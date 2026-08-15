package com.signage.player.engine

import android.util.Log
import kotlinx.coroutines.*
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.net.URI
import java.util.concurrent.TimeUnit

/**
 * DataSyncManager — Fetches display data + listens for WebSocket commands
 *
 * Responsibilities:
 * - Initial data fetch from /api/display/:screenId/data?token=xxx
 * - Periodic refresh every 30 seconds
 * - WebSocket connection for realtime commands (UNPAIR, REBOOT, etc.)
 * - Automatic reconnection on failure
 */
class DataSyncManager(
    private val serverUrl: String,
    private val screenId: String,
    private val displayToken: String,
    private val onDataLoaded: (JSONObject) -> Unit,
    private val onError: (String) -> Unit,
    private val onCommand: (String, JSONObject?) -> Unit
) {
    companion object {
        private const val TAG = "DataSyncManager"
        private const val REFRESH_INTERVAL_MS = 30_000L // 30 seconds
        private const val WS_RECONNECT_DELAY_MS = 5_000L
    }

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private var syncJob: Job? = null
    private var wsJob: Job? = null
    private var wsClient: org.java_websocket.client.WebSocketClient? = null
    private var isRunning = false
    private var lastData: JSONObject? = null

    fun start(scope: CoroutineScope) {
        isRunning = true

        // Initial fetch + periodic refresh
        syncJob = scope.launch(Dispatchers.IO) {
            while (isActive && isRunning) {
                fetchDisplayData()
                delay(REFRESH_INTERVAL_MS)
            }
        }

        // WebSocket for realtime commands
        wsJob = scope.launch(Dispatchers.IO) {
            while (isActive && isRunning) {
                connectWebSocket()
                delay(WS_RECONNECT_DELAY_MS) // Wait before reconnect
            }
        }
    }

    fun stop() {
        isRunning = false
        syncJob?.cancel()
        wsJob?.cancel()
        wsClient?.close()
    }

    fun forceSync() {
        CoroutineScope(Dispatchers.IO).launch {
            fetchDisplayData()
        }
    }

    /**
     * Get last fetched data (for offline use)
     */
    fun getLastData(): JSONObject? = lastData

    // ─── HTTP Data Fetch ────────────────────────────────────────

    private fun fetchDisplayData() {
        try {
            val url = "${serverUrl.trimEnd('/')}/api/display/$screenId/data?token=$displayToken"
            val request = Request.Builder().url(url).get().build()
            val response = httpClient.newCall(request).execute()

            if (response.isSuccessful) {
                val body = response.body?.string() ?: "{}"
                val data = JSONObject(body)

                // Inject serverUrl into data for ZoneRenderer
                data.optJSONObject("screen")?.put("serverUrl", serverUrl.trimEnd('/'))

                lastData = data
                onDataLoaded(data)
                Log.d(TAG, "Data synced: ${data.optJSONObject("screen")?.optString("name")}")
            } else if (response.code == 401) {
                Log.e(TAG, "Display token expired (401)")
                onError("Token expired — re-pairing required")
                onCommand("UNPAIR_DEVICE", null)
            } else {
                Log.w(TAG, "Fetch failed: HTTP ${response.code}")
                // Use cached data if available
                lastData?.let { onDataLoaded(it) }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Fetch error: ${e.message}")
            // Use cached data if available (offline mode)
            lastData?.let {
                Log.i(TAG, "Using cached data (offline)")
                onDataLoaded(it)
            } ?: onError("No connection & no cached data")
        }
    }

    // ─── WebSocket Connection ───────────────────────────────────

    private suspend fun connectWebSocket() {
        try {
            val wsProtocol = if (serverUrl.startsWith("https")) "wss" else "ws"
            val host = serverUrl.removePrefix("http://").removePrefix("https://").trimEnd('/')
            val wsUri = URI("$wsProtocol://$host/ws?token=$displayToken")

            Log.d(TAG, "Connecting WebSocket: $wsUri")

            wsClient = object : org.java_websocket.client.WebSocketClient(wsUri) {
                override fun onOpen(handshakedata: org.java_websocket.handshake.ServerHandshake?) {
                    Log.i(TAG, "WebSocket connected")
                }

                override fun onMessage(message: String?) {
                    message ?: return
                    try {
                        val msg = JSONObject(message)
                        val type = msg.optString("type", "")

                        if (type == "SCREEN_COMMAND") {
                            val payload = msg.optJSONObject("payload")
                            val targetId = payload?.optString("screenId", "")
                            val command = payload?.optString("command", "") ?: ""

                            // Respond to commands for this screen or broadcast (ALL)
                            if (targetId == screenId || targetId == "ALL" || targetId.isNullOrEmpty()) {
                                Log.i(TAG, "Received command: $command")
                                onCommand(command, payload)
                            }
                        }
                    } catch (e: Exception) {
                        Log.w(TAG, "WS message parse error: ${e.message}")
                    }
                }

                override fun onClose(code: Int, reason: String?, remote: Boolean) {
                    Log.d(TAG, "WebSocket closed: $reason")
                }

                override fun onError(ex: Exception?) {
                    Log.w(TAG, "WebSocket error: ${ex?.message}")
                }
            }

            wsClient?.connectBlocking(10, TimeUnit.SECONDS)

            // Keep alive — block until disconnected
            while (isRunning && wsClient?.isOpen == true) {
                delay(1000)
            }
        } catch (e: Exception) {
            Log.w(TAG, "WebSocket connection failed: ${e.message}")
        }
    }
}
