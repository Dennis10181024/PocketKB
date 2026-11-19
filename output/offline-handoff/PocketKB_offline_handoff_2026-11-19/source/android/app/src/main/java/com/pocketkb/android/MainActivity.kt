package com.pocketkb.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pocketkb.android.ui.PocketKbRoot
import com.pocketkb.android.ui.PocketKbTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val viewModel: PocketKbViewModel = viewModel()
            val state by viewModel.uiState.collectAsStateWithLifecycle()
            val sessions by viewModel.recentSessions.collectAsStateWithLifecycle()
            PocketKbTheme {
                PocketKbRoot(
                    state = state,
                    recentSessions = sessions,
                    actions = viewModel,
                )
            }
        }
    }
}
