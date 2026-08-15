package com.signage.player.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.signage.player.MainActivity
import com.signage.player.service.EmergencyListenerService

/**
 * BootReceiver — Auto-start player on device boot
 *
 * Ensures the signage player launches automatically after:
 * - Device reboot
 * - Power loss recovery
 * - Quick boot (HTC/custom ROMs)
 *
 * This is critical for kiosk deployments where the TV runs unattended.
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "SignageBootReceiver"
        private const val PREFS_NAME = "signage_prefs"
        private const val KEY_SERVER_URL = "server_url"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return

        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == "com.htc.intent.action.QUICKBOOT_POWERON"
        ) {
            Log.i(TAG, "Boot completed — launching Signage Player")

            // Only auto-launch if server is configured
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val serverUrl = prefs.getString(KEY_SERVER_URL, "") ?: ""

            if (serverUrl.isNotEmpty()) {
                val launchIntent = Intent(context, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                context.startActivity(launchIntent)

                // Also start emergency listener service
                val displayToken = prefs.getString("display_token", "") ?: ""
                if (displayToken.isNotEmpty()) {
                    EmergencyListenerService.start(context)
                }

                Log.i(TAG, "Player launched successfully")
            } else {
                Log.w(TAG, "No server configured — skipping auto-launch")
            }
        }
    }
}
