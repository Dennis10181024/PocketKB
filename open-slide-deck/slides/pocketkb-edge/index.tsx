import { type Page, type SlideMeta, type DesignSystem, useSlidePageNumber } from "@open-slide/core";
import evidence from "./assets/evidence-crop.png";
export const design: DesignSystem = {palette:{bg:'#FBFAF7',text:'#12263A',accent:'#BC571C'},fonts:{display:'"Microsoft JhengHei", sans-serif',body:'"Microsoft JhengHei", sans-serif'},typeScale:{hero:100,body:32.5},radius:0};
export const meta: SlideMeta = {title:'PocketKB Edge｜正式送件聚焦版',createdAt:'2026-10-01T12:00:00.000Z'};
const Footer = () => { const {current,total}=useSlidePageNumber(); return <span style={{position:'absolute',right:100,bottom:27,fontSize:20,color:'#71818e'}}>{String(current).padStart(2,'0')} / {total}</span>; };
const Page01: Page = () => (
<div style={{position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#12263A", fontFamily: "var(--osd-font-body)", color: "var(--osd-text)"}}>
<p style={{position: "absolute", left: 140.0, top: 102.5, width: 1500.0, fontSize: 28.75, fontWeight: 400, lineHeight: 1.38, color: "#FFAB70", margin: 0, whiteSpace: "pre-wrap"}}>{"2026 競賽企劃"}</p>
<p style={{position: "absolute", left: 140.0, top: 222.5, width: 1575.0, fontSize: 100.0, fontWeight: 700, lineHeight: 1.38, color: "#FFFFFF", margin: 0, whiteSpace: "pre-wrap"}}>{"PocketKB Edge"}</p>
<p style={{position: "absolute", left: 145.0, top: 358.75, width: 1550.0, fontSize: 52.5, fontWeight: 700, lineHeight: 1.38, color: "#FFFFFF", margin: 0, whiteSpace: "pre-wrap"}}>{"讓一棟宿舍在斷網與無法打字時，仍走到下一個安全行動"}</p>
<p style={{position: "absolute", left: 145.0, top: 502.5, width: 1550.0, fontSize: 42.5, fontWeight: 400, lineHeight: 1.38, color: "#B6D5DD", margin: 0, whiteSpace: "pre-wrap"}}>{"平時確保關鍵設備與物資可用；\n火警時依現況自主重規劃。"}</p>
<p style={{position: "absolute", left: 145.0, top: 681.25, width: 1550.0, fontSize: 33.75, fontWeight: 400, lineHeight: 1.38, color: "#E1E9EE", margin: 0, whiteSpace: "pre-wrap"}}>{"正式版只承諾一棟宿舍、煙霧與停電兩種訊號、食品／飲水期限與手電筒電量兩類物資、一張逃生圖、\n一個模擬照明工具，以及一個台語長者情境。所有NVIDIA技術都只用來完成這套自主應變流程。"}</p>
<p style={{position: "absolute", left: 145.0, top: 912.5, width: 1550.0, fontSize: 25.0, fontWeight: 400, lineHeight: 1.38, color: "#B5C4CF", margin: 0, whiteSpace: "pre-wrap"}}>{"2026 Agentic AI on the Edge Hackathon 競賽企劃\n正式送件聚焦版 2026.10.01"}</p>
<Footer /></div>
);
const Page02: Page = () => (
<div style={{position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#FBFAF7", fontFamily: "var(--osd-font-body)", color: "var(--osd-text)"}}>
<p style={{position: "absolute", left: 140.0, top: 85.0, width: 1640.0, fontSize: 60.0, fontWeight: 700, lineHeight: 1.38, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"防災真正的缺口在災前到災時"}</p>
<p style={{position: "absolute", left: 142.5, top: 173.75, width: 1635.0, fontSize: 33.75, fontWeight: 400, lineHeight: 1.38, color: "#235B72", margin: 0, whiteSpace: "pre-wrap"}}>{"物資、設備與人員狀態彼此分離，等到災害發生才發現已經太晚"}</p>
<p style={{position: "absolute", left: 1716.25, top: 985.0, width: 75.0, fontSize: 22.5, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"02"}</p>
<p style={{position: "absolute", left: 140.0, top: 300.0, width: 517.5, fontSize: 36.25, fontWeight: 700, lineHeight: 1.38, color: "#BC571C", margin: 0, whiteSpace: "pre-wrap"}}>{"平時準備缺乏追蹤機制"}</p>
<p style={{position: "absolute", left: 140.0, top: 382.5, width: 517.5, fontSize: 30.0, fontWeight: 400, lineHeight: 1.48, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"防災包、電池、照明與感測器多靠人工\n定期檢查。\n\n發現即期、缺漏或設備離線後，也不一\n定有人追蹤到完成。"}</p>
<p style={{position: "absolute", left: 702.5, top: 300.0, width: 517.5, fontSize: 36.25, fontWeight: 700, lineHeight: 1.38, color: "#BC571C", margin: 0, whiteSpace: "pre-wrap"}}>{"災時資訊快速改變"}</p>
<p style={{position: "absolute", left: 702.5, top: 382.5, width: 517.5, fontSize: 30.0, fontWeight: 400, lineHeight: 1.48, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"煙霧、停電、出口與人員位置會持續變\n動，靜態逃生圖無法重規劃。\n\n管理者還要同時處理大量回報與設備狀\n態。"}</p>
<p style={{position: "absolute", left: 1265.0, top: 300.0, width: 517.5, fontSize: 36.25, fontWeight: 700, lineHeight: 1.38, color: "#BC571C", margin: 0, whiteSpace: "pre-wrap"}}>{"恐慌讓介面失效"}</p>
<p style={{position: "absolute", left: 1265.0, top: 382.5, width: 517.5, fontSize: 30.0, fontWeight: 400, lineHeight: 1.48, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"驚慌、注意力不集中或大腦空白會降低\n判斷。\n\n長者、濃煙中或手上抱著物品的人，可\n能無法打字與操作手機。"}</p>
<p style={{position: "absolute", left: 140.0, top: 912.5, width: 1575.0, fontSize: 26.25, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"本案只解決一個問題：災前準備可能失效，災時人又可能無法操作；Agent要把任務推進到下一個已驗證的安全行動。"}</p>
<Footer /></div>
);
const Page03: Page = () => (
<div style={{position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#FBFAF7", fontFamily: "var(--osd-font-body)", color: "var(--osd-text)"}}>
<p style={{position: "absolute", left: 140.0, top: 85.0, width: 1640.0, fontSize: 60.0, fontWeight: 700, lineHeight: 1.38, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"聚焦一棟宿舍的一個安全任務"}</p>
<p style={{position: "absolute", left: 142.5, top: 173.75, width: 1635.0, fontSize: 33.75, fontWeight: 400, lineHeight: 1.38, color: "#235B72", margin: 0, whiteSpace: "pre-wrap"}}>{"平時維持災時會用到的東西，火警時把住戶帶到下一個安全行動"}</p>
<p style={{position: "absolute", left: 1716.25, top: 985.0, width: 75.0, fontSize: 22.5, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"03"}</p>
<p style={{position: "absolute", left: 140.0, top: 300.0, width: 517.5, fontSize: 36.25, fontWeight: 700, lineHeight: 1.38, color: "#BC571C", margin: 0, whiteSpace: "pre-wrap"}}>{"平時只確認關鍵準備"}</p>
<p style={{position: "absolute", left: 140.0, top: 382.5, width: 517.5, fontSize: 30.0, fontWeight: 400, lineHeight: 1.48, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"監看煙霧感測與停電／照明狀態。\n\n巡檢食品、飲水期限和手電筒電量；發\n現異常就建立任務，重新掃描或讀值後\n才結案。"}</p>
<p style={{position: "absolute", left: 702.5, top: 300.0, width: 517.5, fontSize: 36.25, fontWeight: 700, lineHeight: 1.38, color: "#BC571C", margin: 0, whiteSpace: "pre-wrap"}}>{"災時完成一套應變流程"}</p>
<p style={{position: "absolute", left: 702.5, top: 382.5, width: 517.5, fontSize: 30.0, fontWeight: 400, lineHeight: 1.48, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"火警或台語求救觸發Agent，取得位置\n與煙霧狀態。\n\n原路線不可用就改走替代路線，再執行\n語音、模擬照明與校內通報。"}</p>
<p style={{position: "absolute", left: 1265.0, top: 300.0, width: 517.5, fontSize: 36.25, fontWeight: 700, lineHeight: 1.38, color: "#BC571C", margin: 0, whiteSpace: "pre-wrap"}}>{"只用證據判定完成"}</p>
<p style={{position: "absolute", left: 1265.0, top: 382.5, width: 517.5, fontSize: 30.0, fontWeight: 400, lineHeight: 1.48, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"路線須通過規則，照明須有工具回傳，\n指令須有語音回讀。\n\n任何一步失敗就重試、改計畫或交由人\n員接管。"}</p>
<p style={{position: "absolute", left: 140.0, top: 912.5, width: 1575.0, fontSize: 26.25, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"成功條件不是做出完整智慧城市，而是讓一棟宿舍的兩段情境可以端到端重播、量測與解釋。"}</p>
<Footer /></div>
);
const Page04: Page = () => (
<div style={{position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#FBFAF7", fontFamily: "var(--osd-font-body)", color: "var(--osd-text)"}}>
<p style={{position: "absolute", left: 140.0, top: 85.0, width: 1640.0, fontSize: 60.0, fontWeight: 700, lineHeight: 1.38, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"核心創新：從提醒工具變成自主代理"}</p>
<p style={{position: "absolute", left: 142.5, top: 173.75, width: 1635.0, fontSize: 33.75, fontWeight: 400, lineHeight: 1.38, color: "#235B72", margin: 0, whiteSpace: "pre-wrap"}}>{"比較重點是能否主動完成多步任務，並根據結果改變下一步"}</p>
<p style={{position: "absolute", left: 1716.25, top: 985.0, width: 75.0, fontSize: 22.5, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"04"}</p>
<table style={{position: "absolute", left: 140.0, top: 265.0, width: 1640.0, borderCollapse: "collapse", tableLayout: "fixed", fontSize: 30.0, lineHeight: 1.3}}><colgroup><col style={{width: 450.0}} /><col style={{width: 297.5}} /><col style={{width: 297.5}} /><col style={{width: 297.5}} /><col style={{width: 297.5}} /></colgroup><tbody>
<tr style={{height: 74.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"方法"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"主動觸發"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"跨來源規劃"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"工具執行"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"驗證／重規劃"}</td>
</tr>
<tr style={{height: 74.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"紙本清單／行事曆"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"有限"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"否"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"否"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"否"}</td>
</tr>
<tr style={{height: 74.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"IoT監控儀表板"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"是"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"有限"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"有限"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"有限"}</td>
</tr>
<tr style={{height: 74.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"一般雲端聊天模型"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"否"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"是"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"有限"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"有限"}</td>
</tr>
<tr style={{height: 74.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"PocketKB Edge"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"是"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"是"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"是"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"是"}</td>
</tr>
</tbody></table>
<p style={{position: "absolute", left: 140.0, top: 930.0, width: 1575.0, fontSize: 25.0, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"Agent維護任務狀態並自行選工具；規則否決危險決策；權限閘道限制動作；工具回傳決定是否結案、重試或升級。"}</p>
<Footer /></div>
);
const Page05: Page = () => (
<div style={{position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#FBFAF7", fontFamily: "var(--osd-font-body)", color: "var(--osd-text)"}}>
<p style={{position: "absolute", left: 140.0, top: 85.0, width: 1640.0, fontSize: 60.0, fontWeight: 700, lineHeight: 1.38, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"自主應變流程：Observe → Plan → Act → Verify"}</p>
<p style={{position: "absolute", left: 142.5, top: 173.75, width: 1635.0, fontSize: 33.75, fontWeight: 400, lineHeight: 1.38, color: "#235B72", margin: 0, whiteSpace: "pre-wrap"}}>{"每個事件都要走到已驗證完成，或明確交由人員接管"}</p>
<p style={{position: "absolute", left: 1716.25, top: 985.0, width: 75.0, fontSize: 22.5, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"05"}</p>
<table style={{position: "absolute", left: 140.0, top: 265.0, width: 1640.0, borderCollapse: "collapse", tableLayout: "fixed", fontSize: 30.0, lineHeight: 1.3}}><colgroup><col style={{width: 387.5}} /><col style={{width: 600.0}} /><col style={{width: 652.5}} /></colgroup><tbody>
<tr style={{height: 74.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"處理階段"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"Agent自主行為與工具"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"完成／轉向條件"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"1 Observe／主動觀察"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"接收感測、庫存期限、警報、台灣華語／\n台語ASR及人員回報。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"標示來源、時間與信心；衝突時建立確認\n任務。"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"2 Plan／拆解與規劃"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"把事件拆成巡檢、更換、疏散、待協助、\n通報與設備子任務。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"每項任務都有負責人、時限、風險與完成\n條件。"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"3 Act／選擇與執行"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"自主呼叫物資、圖資、路線、通知、TTS\n及核准的輔助照明工具。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"低風險自動執行；中風險核准；高風險拒絕並\n升級。"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"4 Verify／驗證與重規劃"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"檢查新物品掃描、感測恢復、設備回傳、\n訊息收訖與語音回讀。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"未達目標就換工具或改計畫；超過上限由人員\n接管。"}</td>
</tr>
</tbody></table>
<p style={{position: "absolute", left: 140.0, top: 930.0, width: 1575.0, fontSize: 25.0, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"自主不等於無限制：Agent可以主動推進，但每個工具都受規則、角色權限、參數白名單與完整稽核約束。"}</p>
<Footer /></div>
);
const Page06: Page = () => (
<div style={{position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#FBFAF7", fontFamily: "var(--osd-font-body)", color: "var(--osd-text)"}}>
<p style={{position: "absolute", left: 140.0, top: 85.0, width: 1640.0, fontSize: 60.0, fontWeight: 700, lineHeight: 1.38, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"平時情境：只檢查災時真的會用到的項目"}</p>
<p style={{position: "absolute", left: 142.5, top: 173.75, width: 1635.0, fontSize: 33.75, fontWeight: 400, lineHeight: 1.38, color: "#235B72", margin: 0, whiteSpace: "pre-wrap"}}>{"Agent不只提醒到期，而是主動建立任務並驗證場域恢復就緒"}</p>
<p style={{position: "absolute", left: 1716.25, top: 985.0, width: 75.0, fontSize: 22.5, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"06"}</p>
<table style={{position: "absolute", left: 140.0, top: 265.0, width: 1640.0, borderCollapse: "collapse", tableLayout: "fixed", fontSize: 30.0, lineHeight: 1.3}}><colgroup><col style={{width: 487.5}} /><col style={{width: 625.0}} /><col style={{width: 527.5}} /></colgroup><tbody>
<tr style={{height: 74.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"Agent發現"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"自主處理"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"驗證與留下的證據"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"飲水與食品30天內到期；儲存櫃\n曾出現溫濕度異常。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"交叉比對條碼／OCR、期限與環境紀錄，產\n生輪替與人工檢查清單。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"品項、批號、期限、儲存條件與判斷\n原因。"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"手電筒電量18%，不足以支援預\n定演練時間。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"建立更換電池任務並通知管理者，不擴充到\n其他物資種類。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"電量門檻、負責人、完成期限與更換\n紀錄。"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"煙霧感測器失聯，停電模式下輔\n助照明回報異常。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"先重試與交叉查詢，再建立維修任務；未恢\n復就升級給設施單位。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"感測心跳、照明回傳、重試與升級紀\n錄。"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"管理者更換物資並完成維修。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"重新掃描新品、讀取感測器與照明狀態；全\n部達標才關閉任務。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"更換前後差異、完成者、時間與下一\n次巡檢日。"}</td>
</tr>
</tbody></table>
<p style={{position: "absolute", left: 140.0, top: 930.0, width: 1575.0, fontSize: 25.0, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"食品有效日期成立的前提是符合保存條件；Agent只能標記風險與建立人工檢查，不能自行宣告食品仍可安全食用。"}</p>
<Footer /></div>
);
const Page07: Page = () => (
<div style={{position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#FBFAF7", fontFamily: "var(--osd-font-body)", color: "var(--osd-text)"}}>
<p style={{position: "absolute", left: 140.0, top: 85.0, width: 1640.0, fontSize: 60.0, fontWeight: 700, lineHeight: 1.38, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"災時情境：黑暗、濃煙與台語求救"}</p>
<p style={{position: "absolute", left: 142.5, top: 173.75, width: 1635.0, fontSize: 33.75, fontWeight: 400, lineHeight: 1.38, color: "#235B72", margin: 0, whiteSpace: "pre-wrap"}}>{"長者無法打字；Agent從在地語音開始推進逃生、安撫、照明與通報"}</p>
<p style={{position: "absolute", left: 1716.25, top: 985.0, width: 75.0, fontSize: 22.5, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"07"}</p>
<table style={{position: "absolute", left: 140.0, top: 265.0, width: 1640.0, borderCollapse: "collapse", tableLayout: "fixed", fontSize: 30.0, lineHeight: 1.3}}><colgroup><col style={{width: 487.5}} /><col style={{width: 625.0}} /><col style={{width: 527.5}} /></colgroup><tbody>
<tr style={{height: 74.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"現場變化"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"Agent自主調整"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"可查證的安全證據"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"火警、停電；長者喊「我佇\n五樓，南邊攏是煙」。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"台語ASR辨識樓層與煙霧，建立事件並封鎖\n南側候選路線。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"語言、ASR信心、事件來源與路線節\n點。"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"長者重複「我毋知欲按怎」。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"TTS說「毋免驚，先毋通行南邊」，再慢速\n詢問是否看得到北側綠燈。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"短句版本、重複播放、回讀與首響時\n間。"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"北側可用，但走廊照明不足。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"提出北側逃生步驟，經白名單閘道啟動輔助\n導引照明並驗證回傳。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"路線規則、權限、設備狀態與替代方\n案。"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"外網中斷；另有人回報行動\n不便。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"留在本地推論，通知校內應變人員並持續確\n認疏散與協助兩項任務。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"本地軌跡、通知收訖、任務狀態與人\n工接管。"}</td>
</tr>
</tbody></table>
<p style={{position: "absolute", left: 140.0, top: 930.0, width: 1575.0, fontSize: 25.0, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"決賽以模擬感測器、建物圖與設備閘道重播；未經消防與場域驗證的指令不會用於真實災害。"}</p>
<Footer /></div>
);
const Page08: Page = () => (
<div style={{position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#FBFAF7", fontFamily: "var(--osd-font-body)", color: "var(--osd-text)"}}>
<p style={{position: "absolute", left: 140.0, top: 85.0, width: 1640.0, fontSize: 60.0, fontWeight: 700, lineHeight: 1.38, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"企業採用：安全營運而不只是一個App"}</p>
<p style={{position: "absolute", left: 142.5, top: 173.75, width: 1635.0, fontSize: 33.75, fontWeight: 400, lineHeight: 1.38, color: "#235B72", margin: 0, whiteSpace: "pre-wrap"}}>{"同一套平台同時降低人工巡檢負擔，並縮短災時形成可用行動的時間"}</p>
<p style={{position: "absolute", left: 1716.25, top: 985.0, width: 75.0, fontSize: 22.5, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"08"}</p>
<table style={{position: "absolute", left: 140.0, top: 265.0, width: 1640.0, borderCollapse: "collapse", tableLayout: "fixed", fontSize: 30.0, lineHeight: 1.3}}><colgroup><col style={{width: 375.0}} /><col style={{width: 775.0}} /><col style={{width: 490.0}} /></colgroup><tbody>
<tr style={{height: 74.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"角色"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"可採用的工作流程"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"決賽量測"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"防火管理／應變中心"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"監看備災就緒度、Agent任務、例外與待核准動作；可\n暫停或接管。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"首個可用行動時間、介入率、接管\n成功率。"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"設施與物資管理"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"維護感測器、照明、防災包、控制白名單及巡檢工單。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"巡檢工時、逾期任務、工具成\n功率。"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"校內資訊單位"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"管理本地部署、角色權限、保存期限、版本與故障\n回復。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"WAN中斷服務率、可重播事件比\n例。"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"師生、長者與訪客"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"以台灣華語或台語免手持求助，接收可重複的短句語音\n指引。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"分語言召回、指令理解率、回讀成\n功率。"}</td>
</tr>
</tbody></table>
<p style={{position: "absolute", left: 140.0, top: 930.0, width: 1575.0, fontSize: 25.0, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"只做一棟宿舍、煙霧與停電兩種訊號、食品／飲水期限與手電筒電量兩類物資，以及一個模擬照明閘道。"}</p>
<Footer /></div>
);
const Page09: Page = () => (
<div style={{position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#FBFAF7", fontFamily: "var(--osd-font-body)", color: "var(--osd-text)"}}>
<p style={{position: "absolute", left: 140.0, top: 85.0, width: 1640.0, fontSize: 60.0, fontWeight: 700, lineHeight: 1.38, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"可部署的 NVIDIA 技術組態"}</p>
<p style={{position: "absolute", left: 142.5, top: 173.75, width: 1635.0, fontSize: 33.75, fontWeight: 400, lineHeight: 1.38, color: "#235B72", margin: 0, whiteSpace: "pre-wrap"}}>{"每個NVIDIA元件都對應一項可驗收能力，而不是只列技術名稱"}</p>
<p style={{position: "absolute", left: 1716.25, top: 985.0, width: 75.0, fontSize: 22.5, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"09"}</p>
<table style={{position: "absolute", left: 140.0, top: 265.0, width: 1640.0, borderCollapse: "collapse", tableLayout: "fixed", fontSize: 30.0, lineHeight: 1.3}}><colgroup><col style={{width: 400.0}} /><col style={{width: 750.0}} /><col style={{width: 490.0}} /></colgroup><tbody>
<tr style={{height: 74.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"項目"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"預定設定"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"驗收重點"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"Edge Hardware"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"DGX Spark承載全部本地推論與事件狀態。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"GB10 peak／steady記憶體與p95\n延遲。"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"Speech Perception"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"NeMo Speech處理台灣華語／台語ASR與短句TTS。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"分語言WER、求救詞召回與\n首響。"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"Reasoning＋Workflow"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"Nemotron產生候選tool call；NeMo Agent Toolkit\n管理任務、重試與evaluation。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"任務成功、重規劃及完整工具\n軌跡。"}</td>
</tr>
<tr style={{height: 113.0}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"Restricted Runtime"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"NemoClaw管理生命週期；OpenShell限制工具、網\n路與本地推論路由。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"越權阻擋、白名單與斷網服務。"}</td>
</tr>
</tbody></table>
<p style={{position: "absolute", left: 140.0, top: 930.0, width: 1575.0, fontSize: 25.0, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"四層各自只解決一項必要問題；NeMo workflow與NemoClaw runtime不宣稱原生直連，實際橋接在工作坊鎖定。"}</p>
<Footer /></div>
);
const Page10: Page = () => (
<div style={{position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#FBFAF7", fontFamily: "var(--osd-font-body)", color: "var(--osd-text)"}}>
<p style={{position: "absolute", left: 140.0, top: 85.0, width: 1640.0, fontSize: 60.0, fontWeight: 700, lineHeight: 1.38, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"平時與災時共用一個Agent Core"}</p>
<p style={{position: "absolute", left: 142.5, top: 173.75, width: 1635.0, fontSize: 33.75, fontWeight: 400, lineHeight: 1.38, color: "#235B72", margin: 0, whiteSpace: "pre-wrap"}}>{"事件來源不同，但任務規劃、安全工具、驗證與稽核使用同一套核心"}</p>
<p style={{position: "absolute", left: 1716.25, top: 985.0, width: 75.0, fontSize: 22.5, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"10"}</p>
<p style={{position: "absolute", left: 140.0, top: 260.0, width: 950.0, fontSize: 31.25, fontWeight: 700, lineHeight: 1.38, color: "#BC571C", margin: 0, whiteSpace: "pre-wrap"}}>{"自主工作流｜平時巡檢＋災時應變"}</p>
<div style={{position: "absolute", left: 140.0, top: 322.5, width: 312.5, height: 145.0, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", whiteSpace: "pre-wrap", padding: "12px 16px", background: "#FFFFFF", border: "2px solid #235B72", borderRadius: 15, fontSize: 25.0, fontWeight: 700, lineHeight: 1.25, color: "#12263A"}}>{"時間／感測／語音事件\n環境／物資／台語ASR"}</div>
<p style={{position: "absolute", left: 463.75, top: 368.75, width: 40.0, fontSize: 37.5, fontWeight: 700, lineHeight: 1.38, color: "#BC571C", margin: 0, whiteSpace: "pre-wrap"}}>{"→"}</p>
<div style={{position: "absolute", left: 510.0, top: 322.5, width: 350.0, height: 145.0, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", whiteSpace: "pre-wrap", padding: "12px 16px", background: "#EDF2F3", border: "2px solid #235B72", borderRadius: 15, fontSize: 28.75, fontWeight: 700, lineHeight: 1.25, color: "#12263A"}}>{"Task Planner\nNeMo Agent Toolkit"}</div>
<p style={{position: "absolute", left: 871.25, top: 368.75, width: 40.0, fontSize: 37.5, fontWeight: 700, lineHeight: 1.38, color: "#BC571C", margin: 0, whiteSpace: "pre-wrap"}}>{"→"}</p>
<div style={{position: "absolute", left: 917.5, top: 322.5, width: 412.5, height: 145.0, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", whiteSpace: "pre-wrap", padding: "12px 16px", background: "#FFFFFF", border: "2px solid #235B72", borderRadius: 15, fontSize: 27.5, fontWeight: 700, lineHeight: 1.25, color: "#12263A"}}>{"確定性工具\n環境／物資／路線／通報"}</div>
<p style={{position: "absolute", left: 1341.25, top: 368.75, width: 40.0, fontSize: 37.5, fontWeight: 700, lineHeight: 1.38, color: "#BC571C", margin: 0, whiteSpace: "pre-wrap"}}>{"→"}</p>
<div style={{position: "absolute", left: 1387.5, top: 322.5, width: 392.5, height: 145.0, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", whiteSpace: "pre-wrap", padding: "12px 16px", background: "#FFF1E8", border: "2px solid #BC571C", borderRadius: 15, fontSize: 26.25, fontWeight: 700, lineHeight: 1.25, color: "#12263A"}}>{"Act → Verify → Replan\n照明／TTS／工單／稽核"}</div>
<p style={{position: "absolute", left: 140.0, top: 563.75, width: 1125.0, fontSize: 31.25, fontWeight: 700, lineHeight: 1.38, color: "#BC571C", margin: 0, whiteSpace: "pre-wrap"}}>{"執行與推論平面｜限制Agent能看、能做、能連到哪裡"}</p>
<div style={{position: "absolute", left: 140.0, top: 631.25, width: 312.5, height: 140.0, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", whiteSpace: "pre-wrap", padding: "12px 16px", background: "#FFFFFF", border: "2px solid #235B72", borderRadius: 15, fontSize: 27.5, fontWeight: 700, lineHeight: 1.25, color: "#12263A"}}>{"NemoClaw\n配置與生命週期"}</div>
<p style={{position: "absolute", left: 463.75, top: 675.0, width: 40.0, fontSize: 37.5, fontWeight: 700, lineHeight: 1.38, color: "#BC571C", margin: 0, whiteSpace: "pre-wrap"}}>{"→"}</p>
<div style={{position: "absolute", left: 510.0, top: 631.25, width: 397.5, height: 140.0, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", whiteSpace: "pre-wrap", padding: "12px 16px", background: "#EDF2F3", border: "2px solid #235B72", borderRadius: 15, fontSize: 27.5, fontWeight: 700, lineHeight: 1.25, color: "#12263A"}}>{"OpenShell\nsandbox／policy／白名單"}</div>
<p style={{position: "absolute", left: 918.75, top: 675.0, width: 40.0, fontSize: 37.5, fontWeight: 700, lineHeight: 1.38, color: "#BC571C", margin: 0, whiteSpace: "pre-wrap"}}>{"→"}</p>
<div style={{position: "absolute", left: 965.0, top: 631.25, width: 350.0, height: 140.0, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", whiteSpace: "pre-wrap", padding: "12px 16px", background: "#FFFFFF", border: "2px solid #235B72", borderRadius: 15, fontSize: 27.5, fontWeight: 700, lineHeight: 1.25, color: "#12263A"}}>{"inference.local\n受控推論路由"}</div>
<p style={{position: "absolute", left: 1326.25, top: 675.0, width: 40.0, fontSize: 37.5, fontWeight: 700, lineHeight: 1.38, color: "#BC571C", margin: 0, whiteSpace: "pre-wrap"}}>{"→"}</p>
<div style={{position: "absolute", left: 1372.5, top: 631.25, width: 407.5, height: 140.0, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", whiteSpace: "pre-wrap", padding: "12px 16px", background: "#FFF1E8", border: "2px solid #BC571C", borderRadius: 15, fontSize: 27.5, fontWeight: 700, lineHeight: 1.25, color: "#12263A"}}>{"本地vLLM／Nemotron\nDGX Spark"}</div>
<p style={{position: "absolute", left: 140.0, top: 882.5, width: 1575.0, fontSize: 25.0, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"事件資料、個資與模型留在場域；外網中斷且區網正常時維持完整服務，主機失聯才退回裝置端固定規則。"}</p>
<Footer /></div>
);
const Page11: Page = () => (
<div style={{position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#FBFAF7", fontFamily: "var(--osd-font-body)", color: "var(--osd-text)"}}>
<p style={{position: "absolute", left: 140.0, top: 85.0, width: 1640.0, fontSize: 60.0, fontWeight: 700, lineHeight: 1.38, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"最小可行範圍與決賽驗收"}</p>
<p style={{position: "absolute", left: 142.5, top: 173.75, width: 1635.0, fontSize: 33.75, fontWeight: 400, lineHeight: 1.38, color: "#235B72", margin: 0, whiteSpace: "pre-wrap"}}>{"入選前消除軟體風險；拿到DGX Spark後只做硬體綁定、量測與調優"}</p>
<p style={{position: "absolute", left: 1716.25, top: 985.0, width: 75.0, fontSize: 22.5, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"11"}</p>
<table style={{position: "absolute", left: 140.0, top: 265.0, width: 1640.0, borderCollapse: "collapse", tableLayout: "fixed", fontSize: 28.75, lineHeight: 1.3}}><colgroup><col style={{width: 375.0}} /><col style={{width: 712.5}} /><col style={{width: 552.5}} /></colgroup><tbody>
<tr style={{height: 69.875}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"面向"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"入選前可完成"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#12263A", color: "#FFFFFF", fontWeight: 700, borderBottom: "1px solid #D4DEE2"}}>{"DGX Spark決賽證據"}</td>
</tr>
<tr style={{height: 107.25000000000001}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"Safety"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"80則封存情境、工具白名單、模擬照明閘道與人工接\n管。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"危險路線誤放行0次；未授權工具執行0\n次。"}</td>
</tr>
<tr style={{height: 107.25000000000001}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"Agent Autonomy"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"20個平時／災時多步任務，以mock endpoint驗證重\n試、重規劃與結案。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"任務成功率、工具步數、重規劃成\n功率、介入率。"}</td>
</tr>
<tr style={{height: 107.25000000000001}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"Local Speech"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"40則經同意的台灣華語／台語語音，包含長者與警報\n噪音。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"分語言WER、求救詞召回、首響與回讀\n成功率。"}</td>
</tr>
<tr style={{height: 107.25000000000001}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"Edge System"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"OpenAI-compatible adapter、context／併發設定\n與量測腳本。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#FFFFFF", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"GB10記憶體、TTFT、tokens/sec、1／\n4人p50／p95。"}</td>
</tr>
<tr style={{height: 107.25000000000001}}>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"Resilience"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"模擬WAN、LAN、模型、感測器與工具逾時。"}</td>
<td style={{padding: "12px 15px", boxSizing: "border-box", verticalAlign: "middle", whiteSpace: "pre-wrap", background: "#EDF2F3", color: "var(--osd-text)", fontWeight: 400, borderBottom: "1px solid #D4DEE2"}}>{"本地持續服務、狀態保留、退回與接管\n成功率。"}</td>
</tr>
</tbody></table>
<p style={{position: "absolute", left: 140.0, top: 930.0, width: 1575.0, fontSize: 25.0, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"既有基線：Android／PWA、BM25、宿舍火災規則、共用JSON與38回合演練；Agent、語音、AIoT與NVIDIA部署尚未完成。"}</p>
<Footer /></div>
);
const Page12: Page = () => (
<div style={{position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#FBFAF7", fontFamily: "var(--osd-font-body)", color: "var(--osd-text)"}}>
<p style={{position: "absolute", left: 140.0, top: 85.0, width: 1640.0, fontSize: 60.0, fontWeight: 700, lineHeight: 1.38, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"決賽只展示同一個場域的兩套完整流程"}</p>
<p style={{position: "absolute", left: 142.5, top: 173.75, width: 1635.0, fontSize: 33.75, fontWeight: 400, lineHeight: 1.38, color: "#235B72", margin: 0, whiteSpace: "pre-wrap"}}>{"平時確保關鍵準備可用，火警時把住戶帶到下一個安全行動"}</p>
<p style={{position: "absolute", left: 1716.25, top: 985.0, width: 75.0, fontSize: 22.5, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"12"}</p>
<p style={{position: "absolute", left: 140.0, top: 288.75, width: 775.0, fontSize: 38.75, fontWeight: 700, lineHeight: 1.38, color: "#BC571C", margin: 0, whiteSpace: "pre-wrap"}}>{"現場展示順序"}</p>
<p style={{position: "absolute", left: 1052.5, top: 288.75, width: 725.0, fontSize: 38.75, fontWeight: 700, lineHeight: 1.38, color: "#BC571C", margin: 0, whiteSpace: "pre-wrap"}}>{"評審可以看到的證據"}</p>
<p style={{position: "absolute", left: 140.0, top: 368.75, width: 797.5, fontSize: 33.75, fontWeight: 700, lineHeight: 1.38, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"01 平時自主巡檢"}</p>
<p style={{position: "absolute", left: 140.0, top: 417.5, width: 797.5, fontSize: 27.5, fontWeight: 400, lineHeight: 1.3, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"發現即期食品、低電量與感測器異常，建立任務並驗證更換。"}</p>
<p style={{position: "absolute", left: 140.0, top: 481.25, width: 797.5, fontSize: 33.75, fontWeight: 700, lineHeight: 1.38, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"02 台語自主啟動"}</p>
<p style={{position: "absolute", left: 140.0, top: 530.0, width: 797.5, fontSize: 27.5, fontWeight: 400, lineHeight: 1.3, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"火警後長者用台語求救，Agent辨識位置並建立疏散子任務。"}</p>
<p style={{position: "absolute", left: 140.0, top: 593.75, width: 797.5, fontSize: 33.75, fontWeight: 700, lineHeight: 1.38, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"03 重規劃與行動"}</p>
<p style={{position: "absolute", left: 140.0, top: 642.5, width: 797.5, fontSize: 27.5, fontWeight: 400, lineHeight: 1.3, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"原路線被煙霧否決，改走替代路線並啟動模擬輔助照明。"}</p>
<p style={{position: "absolute", left: 140.0, top: 706.25, width: 797.5, fontSize: 33.75, fontWeight: 700, lineHeight: 1.38, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"04 驗證與復原"}</p>
<p style={{position: "absolute", left: 140.0, top: 755.0, width: 797.5, fontSize: 27.5, fontWeight: 400, lineHeight: 1.3, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"確認語音回讀、通知收訖與設備回傳，產生補貨維修任務。"}</p>
<p style={{position: "absolute", left: 1052.5, top: 357.5, width: 700.0, fontSize: 30.0, fontWeight: 400, lineHeight: 1.42, color: "var(--osd-text)", margin: 0, whiteSpace: "pre-wrap"}}>{"Agent不是等人提問，而是由時間、感測器或語音事\n件主動啟動。\n\n它能跨越環境、物資、圖資、語音與設備工具，根據\n結果重規劃。\n\n長者即使不會打字、只習慣台語，也能用聲音求助並\n重複確認。\n\n每項自動行動都有風險層級、依據、驗證結果與人工\n接管方式。"}</p>
<p style={{position: "absolute", left: 140.0, top: 881.25, width: 1640.0, fontSize: 30.0, fontWeight: 700, lineHeight: 1.38, color: "#235B72", margin: 0, whiteSpace: "pre-wrap"}}>{"PocketKB Edge：一棟宿舍、兩套完整流程，證明Agent真的能主動把任務做完。"}</p>
<p style={{position: "absolute", left: 140.0, top: 952.5, width: 1525.0, fontSize: 21.25, fontWeight: 400, lineHeight: 1.38, color: "#52616D", margin: 0, whiteSpace: "pre-wrap"}}>{"依據：原研究計畫v4；PocketKB既有原型；競賽官網；消防署與食藥署資料；逢甲AIoT案例；NVIDIA官方文件（查閱2026/10/01）。"}</p>
<Footer /></div>
);
export const notes = ["核心定位為平災一體的自主Agent。既有成果是Android／PWA規則演練原型；環境監測、物資巡檢、語音Agent與NVIDIA部署均屬競賽新增工作。", "消防署建議防災包每半年檢查；衛福部資料列出災難後常見驚慌、困惑與注意力問題。本頁把兩類需求整合為待驗證問題。", "參考逢甲大學準線智慧科技案例的AIoT整合路徑：感測、資料傳輸、監控、AI分析與現場應變形成完整產品鏈。", "本頁為提案比較。實際價值必須用同一批封存任務比較人工流程、規則版與Agent版。", "工具名稱與風險分級是待實作介面。第一階段全部設備動作透過模擬閘道，不直接控制法定消防系統。", "消防署建議防災包每半年檢查損壞、遺漏與期限；食藥署指出有效日期和溫度、濕度、光線等保存條件有關。", "消防署教材要求通報119、提供位置與待救資訊並使用安全樓梯；衛福部心理急救資料支持以平靜、簡短方式協助混亂者。", "企業價值以維護工時、任務完成與故障回復量測，不宣稱已有採購、試點或真實場域整合。", "依NVIDIA官方NeMo Speech、NeMo Agent Toolkit、Nemotron on DGX Spark及NemoClaw文件規劃；所有效能仍待目標硬體驗證。", "上層為事件驅動工作流，下層為NemoClaw／OpenShell受限執行與本地推論。實際runtime橋接須在主辦設備確認。", "所有門檻都是待驗證目標。正式範圍固定為一棟宿舍、兩種環境訊號、兩類物資、一個照明工具及兩段端到端情境。", "本頁為預定決賽展示。屆時只展示實際完成的功能與量測，不把目標、模擬結果或待整合設備描述成既有成果。"];
export default [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08, Page09, Page10, Page11, Page12] satisfies Page[];