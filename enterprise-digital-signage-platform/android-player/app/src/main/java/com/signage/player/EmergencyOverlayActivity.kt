package com.signage.player

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

/**
 * EmergencyOverlayActivity — Fullscreen Emergency Alert
 *
 * Launched by EmergencyListenerService when EMERGENCY_TRIGGERED is received.
 * Shows on top of EVERYTHING (YouTube, HDMI, other apps).
 *
 * Features:
 * - Fullscreen red pulsing background
 * - Large warning text (visible from distance)
 * - Auto-close when EMERGENCY_CLEARED received
 * - Cannot be dismissed by user (no back button)
 * - Wakes screen from sleep
 * - Shows over lock screen
 */
class EmergencyOverlayActivity : Activity() {

    companion object {
        private const val TAG = "EmergencyOverlay"
    }

    private val handler = Handler(Looper.getMainLooper())
    private var pulseRunnable: Runnable? = null
    private var isPulseDark = false

    // Listen for emergency clear broadcast
    private val clearReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            finish() // Close overlay
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Show over lock screen + turn screen on
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }

        // Fullscreen + keep on
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        enterImmersiveMode()

        // Get alert data
        val title = intent.getStringExtra("title") ?: "EMERGENCY"
        val message = intent.getStringExtra("message") ?: ""
        val type = intent.getStringExtra("type") ?: "custom"
        val severity = intent.getStringExtra("severity") ?: "critical"

        // Build emergency UI
        setContentView(createEmergencyUI(title, message, type))

        // Start background pulse animation
        startPulseAnimation()

        // Register clear receiver
        val filter = IntentFilter("com.signage.player.EMERGENCY_CLEAR")
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(clearReceiver, filter, RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(clearReceiver, filter)
        }
    }

    private fun createEmergencyUI(title: String, message: String, type: String): View {
        val root = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#93000A")) // Deep red
            tag = "emergency_root"
        }

        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setPadding(64, 64, 64, 64)
        }

        // Warning icon
        val icon = TextView(this).apply {
            text = when (type) {
                "fire" -> "🔥"
                "weather" -> "🌊"
                "lockdown" -> "🔒"
                else -> "⚠️"
            }
            textSize = 120f
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = 32 }
        }
        content.addView(icon)

        // EMERGENCY badge
        val badge = TextView(this).apply {
            text = "⚡ EMERGENCY OVERRIDE BROADCAST ⚡"
            textSize = 16f
            setTextColor(Color.parseColor("#FFCDD2"))
            gravity = Gravity.CENTER
            setTypeface(null, Typeface.BOLD)
            letterSpacing = 0.1f
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = 24 }
        }
        content.addView(badge)

        // Title (HUGE — visible from far)
        val titleView = TextView(this).apply {
            text = title.uppercase()
            textSize = 56f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            setTypeface(null, Typeface.BOLD)
            setShadowLayer(8f, 0f, 4f, Color.BLACK)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = 32 }
        }
        content.addView(titleView)

        // Message
        if (message.isNotEmpty()) {
            val msgView = TextView(this).apply {
                text = message
                textSize = 28f
                setTextColor(Color.parseColor("#FFCDD2"))
                gravity = Gravity.CENTER
                setLineSpacing(0f, 1.4f)
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { bottomMargin = 48 }
            }
            content.addView(msgView)
        }

        // Scrolling ticker at bottom
        val ticker = TextView(this).apply {
            text = "    ⚠ $title — $message    ".repeat(3)
            textSize = 20f
            setTextColor(Color.parseColor("#FFB4AB"))
            setTypeface(null, Typeface.BOLD)
            isSingleLine = true
            isSelected = true // Required for marquee
            ellipsize = android.text.TextUtils.TruncateAt.MARQUEE
            marqueeRepeatLimit = -1 // Infinite
            isFocusable = true
            isFocusableInTouchMode = true
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.BOTTOM
                setMargins(0, 0, 0, 32)
            }
            gravity = Gravity.CENTER
        }

        root.addView(content)
        root.addView(ticker)

        return root
    }

    /**
     * Pulse animation: alternate between dark red and light red
     * Simulates the emergency pulse effect from the web version
     */
    private fun startPulseAnimation() {
        val rootView = window.decorView.findViewWithTag<View>("emergency_root") ?: return

        pulseRunnable = object : Runnable {
            override fun run() {
                isPulseDark = !isPulseDark
                rootView.setBackgroundColor(
                    if (isPulseDark) Color.parseColor("#690005")
                    else Color.parseColor("#93000A")
                )
                handler.postDelayed(this, 750) // Pulse every 750ms
            }
        }
        handler.post(pulseRunnable!!)
    }

    private fun enterImmersiveMode() {
        try {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                )
        } catch (_: Exception) {}
    }

    // Block back button — emergency cannot be dismissed by user
    override fun onBackPressed() {
        // Do nothing — only admin can clear emergency
    }

    override fun onDestroy() {
        super.onDestroy()
        pulseRunnable?.let { handler.removeCallbacks(it) }
        try { unregisterReceiver(clearReceiver) } catch (_: Exception) {}
    }
}
