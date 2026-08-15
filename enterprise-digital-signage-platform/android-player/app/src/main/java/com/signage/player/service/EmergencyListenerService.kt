package com.signage.player.service

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.signage.player.EmergencyOverlayActivity
import com.signage.player.NativePlayerActivity
import kotlinx.coroutines.*
import org.java_websocket.client.WebSocketClient
import org.java_websocket.handshake.ServerHandshake
import org.json.JSONObject
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import java.net.URI
import java.util.concurrent.TimeUnit

/**
 * EmergencyListenerService — Always-on background service
 *
 * Runs permanently in background listening for WebSocket commands.
 * When EMERGENCY_TRIGGERED arrives:
 * 1. Wake the screen (if sleeping)
 * 2. Launch EmergencyOverlayActivity on top of everything
 * 3. Display emergency message fullscreen
 *
 * This ensures emergency alerts show EVEN when:
 * - TV is showing HDMI input
 * - Another app (YouTube, Cast) is in foreground
 * - Screen is in standby/sleep
 */
class EmergencyListenerService : Service() {

    companion object {
        private const val TAG = "EmergencyListener"
        private const val NOTIFICATION_ID = 2001
        private const val CHANNEL_ID = "signage_emergency"
        private const val PREFS_NAME = "signage_prefs"
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_DISPLAY_TOKEN = "display_token"
        private const val KEY_SCREEN_ID = "screen_id"
        private const val RECONNECT_DELAY_MS = 5000L

        fun start(context: Context) {
            val intent = Intent(context, EmergencyListenerService::class.java)
            try {
                // Use regular startService (not foreground) to avoid crash on Android TV
                context.startService(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start service: ${e.message}")
            }
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, EmergencyListenerService::class.java))
        }
    }

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var wsClient: WebSocketClient? = null
    private var isRunning = false
    private var serverUrl = ""
    private var displayToken = ""
    private var screenId = ""
    private var tamperCheckJob: Job? = null
    private var isSignageInForeground = true

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        try {
            val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
            serverUrl = prefs.getString(KEY_SERVER_URL, "") ?: ""
            displayToken = prefs.getString(KEY_DISPLAY_TOKEN, "") ?: ""
            screenId = prefs.getString(KEY_SCREEN_ID, "") ?: ""

            if (serverUrl.isEmpty() || displayToken.isEmpty()) {
                Log.w(TAG, "Not configured — stopping service")
                stopSelf()
                return START_NOT_STICKY
            }

            // Start as background service (no foreground notification needed for TV kiosk)
            isRunning = true
            scope.launch { connectLoop() }

            // Start tamper detection
            tamperCheckJob = scope.launch { tamperDetectionLoop() }

            Log.i(TAG, "Emergency listener started (background)")
        } catch (e: Exception) {
            Log.e(TAG, "Service start failed: ${e.message}", e)
            stopSelf()
        }
        return START_STICKY
    }

    private suspend fun connectLoop() {
        while (isRunning) {
            try {
                connectWebSocket()
            } catch (e: Exception) {
                Log.w(TAG, "WS error: ${e.message}")
            }
            if (isRunning) delay(RECONNECT_DELAY_MS)
        }
    }

    private suspend fun connectWebSocket() {
        val wsProtocol = if (serverUrl.startsWith("https")) "wss" else "ws"
        val host = serverUrl.removePrefix("http://").removePrefix("https://").trimEnd('/')
        val wsUri = URI("$wsProtocol://$host/ws?token=$displayToken")

        wsClient = object : WebSocketClient(wsUri) {
            override fun onOpen(handshakedata: ServerHandshake?) {
                Log.i(TAG, "Emergency WS connected")
                updateNotification("● Connected — Listening for alerts")
            }

            override fun onMessage(message: String?) {
                message ?: return
                handleMessage(message)
            }

            override fun onClose(code: Int, reason: String?, remote: Boolean) {
                Log.d(TAG, "WS closed: $reason")
                updateNotification("○ Reconnecting...")
            }

            override fun onError(ex: Exception?) {
                Log.w(TAG, "WS error: ${ex?.message}")
            }
        }

        wsClient?.connectBlocking(10, TimeUnit.SECONDS)

        // Keep alive until disconnected
        while (isRunning && wsClient?.isOpen == true) {
            delay(1000)
        }
    }

    private fun handleMessage(raw: String) {
        try {
            val msg = JSONObject(raw)
            val type = msg.optString("type", "")

            when (type) {
                "EMERGENCY_TRIGGERED" -> {
                    val payload = msg.optJSONObject("payload") ?: return
                    val targetScreens = payload.optJSONArray("targetScreenIds")
                    
                    // Check if this emergency targets our screen
                    val targetsUs = targetScreens == null || 
                                    targetScreens.length() == 0 ||
                                    (0 until targetScreens.length()).any { 
                                        targetScreens.getString(it) == screenId 
                                    }

                    if (targetsUs) {
                        Log.i(TAG, "🚨 EMERGENCY RECEIVED — forcing foreground!")
                        triggerEmergencyOverlay(payload)
                    }
                }

                "EMERGENCY_CLEARED" -> {
                    Log.i(TAG, "Emergency cleared — closing overlay")
                    closeEmergencyOverlay()
                }

                "SCREEN_COMMAND" -> {
                    val payload = msg.optJSONObject("payload") ?: return
                    val targetId = payload.optString("screenId", "")
                    val command = payload.optString("command", "")

                    if (targetId == screenId || targetId == "ALL") {
                        when (command) {
                            "UNPAIR_DEVICE" -> {
                                // Clear prefs and stop
                                getSharedPreferences(PREFS_NAME, MODE_PRIVATE).edit()
                                    .remove(KEY_DISPLAY_TOKEN).remove(KEY_SCREEN_ID).apply()
                                stopSelf()
                            }
                            "FORCE_DISPLAY" -> {
                                // Force signage app to foreground (non-emergency)
                                bringSignageToForeground()
                            }
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Message parse error: ${e.message}")
        }
    }

    /**
     * CRITICAL: Force the emergency screen to appear on top of EVERYTHING
     * Works even when another app is in foreground (YouTube, HDMI, etc.)
     */
    private fun triggerEmergencyOverlay(alertData: JSONObject) {
        // 1. Wake the screen if sleeping
        wakeScreen()

        // 2. Launch emergency overlay activity (NEW_TASK forces it on top)
        val intent = Intent(this, EmergencyOverlayActivity::class.java).apply {
            addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP or
                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            )
            putExtra("title", alertData.optString("title", "EMERGENCY"))
            putExtra("message", alertData.optString("message", ""))
            putExtra("type", alertData.optString("type", "custom"))
            putExtra("severity", alertData.optString("severity", "critical"))
        }
        startActivity(intent)

        // 3. Update notification
        updateNotification("🚨 EMERGENCY ACTIVE")
    }

    private fun closeEmergencyOverlay() {
        // Send broadcast to close the overlay
        val intent = Intent("com.signage.player.EMERGENCY_CLEAR")
        sendBroadcast(intent)
        updateNotification("● Connected — Listening for alerts")
    }

    /**
     * Bring the signage player to foreground (non-emergency)
     * Used for "Force Display" command from admin
     */
    private fun bringSignageToForeground() {
        wakeScreen()
        val intent = Intent(this, NativePlayerActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
        }
        startActivity(intent)
    }

    /**
     * Wake the screen if it's sleeping / in standby
     */
    private fun wakeScreen() {
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            val wakeLock = pm.newWakeLock(
                PowerManager.FULL_WAKE_LOCK or
                PowerManager.ACQUIRE_CAUSES_WAKEUP or
                PowerManager.ON_AFTER_RELEASE,
                "signage:emergency_wake"
            )
            wakeLock.acquire(10_000) // 10 seconds
        } catch (e: Exception) {
            Log.e(TAG, "Wake screen failed: ${e.message}")
        }
    }

    // ─── Notification ───────────────────────────────────────────

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Emergency Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Listens for emergency broadcast alerts"
                setShowBadge(true)
            }
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(text: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Digital Signage")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotification(text: String) {
        val nm = getSystemService(NotificationManager::class.java)
        nm.notify(NOTIFICATION_ID, buildNotification(text))
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        tamperCheckJob?.cancel()
        scope.cancel()
        wsClient?.close()
        Log.i(TAG, "Emergency listener stopped")
    }

    // ─── Tamper Detection ───────────────────────────────────────

    /**
     * Every 10 seconds, check if our signage app is in the foreground.
     * If another app takes over → report "app_inactive" to server.
     * Admin sees it instantly on the Screens dashboard.
     */
    private suspend fun tamperDetectionLoop() {
        delay(15_000) // Wait 15s after boot before first check
        while (isRunning) {
            val wasInForeground = isSignageInForeground
            isSignageInForeground = isOurAppInForeground()

            if (!isSignageInForeground && wasInForeground) {
                // Just lost foreground — report tamper
                Log.w(TAG, "⚠ Signage app lost foreground — possible tamper!")
                reportStatusToServer("app_inactive")
                updateNotification("⚠ Display inactive — another app is running")
            } else if (isSignageInForeground && !wasInForeground) {
                // Came back to foreground
                Log.i(TAG, "✓ Signage app back in foreground")
                reportStatusToServer("online")
                updateNotification("● Connected — Listening for alerts")
            }

            delay(10_000) // Check every 10 seconds
        }
    }

    /**
     * Check if our app (NativePlayerActivity or EmergencyOverlayActivity) is foreground
     */
    private fun isOurAppInForeground(): Boolean {
        return try {
            val am = getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
            val tasks = am.getRunningTasks(1)
            if (tasks.isNullOrEmpty()) return false

            val topActivity = tasks[0].topActivity?.packageName ?: ""
            topActivity == packageName
        } catch (e: Exception) {
            // If can't determine, assume it's fine
            true
        }
    }

    /**
     * Send heartbeat with status to server
     * Server updates screen status → Admin sees on dashboard
     */
    private fun reportStatusToServer(status: String) {
        scope.launch(Dispatchers.IO) {
            try {
                val url = "${serverUrl.trimEnd('/')}/api/telemetry/heartbeat"
                val body = org.json.JSONObject().apply {
                    put("screenId", screenId)
                    put("status", status)
                }.toString()

                val request = okhttp3.Request.Builder()
                    .url(url)
                    .addHeader("Authorization", "Bearer $displayToken")
                    .post(okhttp3.RequestBody.create(
                        "application/json".toMediaTypeOrNull(),
                        body
                    ))
                    .build()

                val client = okhttp3.OkHttpClient.Builder()
                    .connectTimeout(5, TimeUnit.SECONDS)
                    .build()
                client.newCall(request).execute().close()

                Log.d(TAG, "Reported status: $status")
            } catch (e: Exception) {
                Log.w(TAG, "Failed to report status: ${e.message}")
            }
        }
    }
}
