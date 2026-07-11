import Foundation
import llama

// MARK: - Token Stream
typealias TokenCallback = (String) -> Void

// MARK: - LlamaInference
/// Wraps llama.cpp C API for on-device inference.
/// Optimised for iPhone 16 Pro (A18 Pro Metal GPU).
/// Compatible with llama.cpp b4000+（建議釘住 Exact Version: b4170）
actor LlamaInference {

    private var model:   OpaquePointer?
    private var ctx:     OpaquePointer?
    private var vocab:   OpaquePointer?
    private var sampler: OpaquePointer?

    private let nCtx:   Int32 = 2048
    private let nBatch: Int32 = 512
    private let nGPU:   Int32 = 99   // offload all layers to Metal

    // MARK: Load
    func load(modelPath: String) throws {
        llama_backend_init()

        var mParams = llama_model_default_params()
        mParams.n_gpu_layers = nGPU

        guard let m = llama_model_load_from_file(modelPath, mParams) else {
            throw LlamaError.modelNotFound(modelPath)
        }
        model = m
        vocab = llama_model_get_vocab(m)

        var cParams = llama_context_default_params()
        cParams.n_ctx      = UInt32(nCtx)
        cParams.n_batch    = UInt32(nBatch)
        cParams.flash_attn = true

        guard let c = llama_new_context_with_model(m, cParams) else {
            throw LlamaError.contextFailed
        }
        ctx = c

        // Sampler chain
        let sparams = llama_sampler_chain_default_params()
        let chain   = llama_sampler_chain_init(sparams)
        llama_sampler_chain_add(chain, llama_sampler_init_top_p(0.9, 1))
        llama_sampler_chain_add(chain, llama_sampler_init_temp(0.7))
        llama_sampler_chain_add(chain,
            llama_sampler_init_dist(UInt32.random(in: 0...UInt32.max)))
        sampler = chain
    }

    var isLoaded: Bool { model != nil }

    // MARK: Cancel
    private var isCancelled = false

    func cancel() {
        isCancelled = true
    }

    // MARK: Generate (streaming)
    func generate(prompt: String, maxTokens: Int = 400,
                  onToken: @escaping TokenCallback) async {
        guard let ctx, let model, let sampler else { return }

        isCancelled = false

        let tokens = tokenise(text: prompt, addBOS: true)
        guard !tokens.isEmpty else { return }

        // BUG FIX 3：llama_decode 是同步 C 程式碼，直接在 cooperative thread 跑
        // 會阻塞整個 Swift concurrency pool 造成 UI 凍結。
        // 改用 withCheckedContinuation 橋接到獨立的 DispatchQueue。
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            Self.inferenceQueue.async { [weak self] in
                guard let self else { continuation.resume(); return }
                self.runGeneration(
                    ctx:      ctx,
                    model:    model,
                    sampler:  sampler,
                    tokens:   tokens,
                    maxTokens: maxTokens,
                    onToken:  onToken
                )
                continuation.resume()
            }
        }
    }

    // 推論專用 DispatchQueue（不佔用 Swift cooperative thread pool）
    private static let inferenceQueue = DispatchQueue(
        label: "ai.pocketkb.llama.inference",
        qos: .userInitiated
    )

    /// 實際的 C API 推論迴圈，在 inferenceQueue 上執行
    private func runGeneration(
        ctx:       OpaquePointer,
        model:     OpaquePointer,
        sampler:   OpaquePointer,
        tokens:    [llama_token],
        maxTokens: Int,
        onToken:   @escaping TokenCallback
    ) {
        var batch = llama_batch_init(Int32(tokens.count), 0, 1)
        defer { llama_batch_free(batch) }

        for (i, tok) in tokens.enumerated() {
            llama_batch_add(&batch, tok, Int32(i), [0], false)
        }

        // logits 安全存取（新版 llama.cpp 可能為 nil）
        if batch.logits != nil {
            batch.logits[Int(batch.n_tokens) - 1] = 1
        }

        llama_kv_cache_clear(ctx)
        guard llama_decode(ctx, batch) == 0 else { return }

        var nCur    = Int32(tokens.count)
        var nDecode = 0

        while nDecode < maxTokens {
            if isCancelled { break }

            let newTok = llama_sampler_sample(sampler, ctx, -1)
            llama_sampler_accept(sampler, newTok)
            if llama_token_is_eog(model, newTok) { break }

            var buf = [CChar](repeating: 0, count: 256)
            let len = llama_token_to_piece(model, newTok, &buf, Int32(buf.count), 0, false)
            if len > 0 {
                let piece = String(
                    bytes: buf.prefix(Int(len)).map { UInt8(bitPattern: $0) },
                    encoding: .utf8) ?? ""
                if !piece.isEmpty { onToken(piece) }
            }

            llama_batch_clear(&batch)
            llama_batch_add(&batch, newTok, nCur, [0], true)

            if batch.logits != nil {
                batch.logits[0] = 1
            }

            nCur    += 1
            nDecode += 1
            guard llama_decode(ctx, batch) == 0 else { break }
        }
    }

    // MARK: Tokenise
    private func tokenise(text: String, addBOS: Bool) -> [llama_token] {
        guard let vocab else { return [] }

        // FIX：正確計算 UTF-8 byte count，避免多位元組字元截斷
        let utf8Len = Int32(text.utf8.count)
        let nMax    = text.utf8.count + 16
        var toks    = [llama_token](repeating: 0, count: nMax)

        let n = llama_tokenize(vocab, text, utf8Len,
                               &toks, Int32(nMax), addBOS, false)
        guard n > 0 else { return [] }
        return Array(toks.prefix(Int(n)))
    }

    // MARK: Unload
    func unload() {
        if let s = sampler { llama_sampler_free(s) }
        if let c = ctx     { llama_free(c) }
        if let m = model   { llama_model_free(m) }
        llama_backend_free()
        model = nil; ctx = nil; vocab = nil; sampler = nil
    }
}

// MARK: - Errors
enum LlamaError: LocalizedError {
    case modelNotFound(String)
    case contextFailed

    var errorDescription: String? {
        switch self {
        case .modelNotFound(let p): return "找不到模型檔案：\(p)"
        case .contextFailed:        return "無法建立推論 Context"
        }
    }
}
