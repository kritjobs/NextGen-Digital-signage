package com.signage.player.receiver

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * SignageDeviceAdmin — Device Admin Receiver for Lock Task (Kiosk) Mode
 *
 * When enabled, allows the app to enter Lock Task mode which:
 * - Prevents HOME button from exiting
 * - Disables recent apps
 * - Prevents status bar pull-down
 * - Locks the device to this single app
 *
 * Activation: adb shell dpm set-device-owner com.signage.player/.receiver.SignageDeviceAdmin
 * (or via MDM provisioning)
 */
class SignageDeviceAdmin : DeviceAdminReceiver() {

    companion object {
        private const val TAG = "SignageDeviceAdmin"
    }

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.i(TAG, "Device admin enabled — kiosk lock available")
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.i(TAG, "Device admin disabled")
    }

    override fun onLockTaskModeEntering(context: Context, intent: Intent, pkg: String) {
        super.onLockTaskModeEntering(context, intent, pkg)
        Log.i(TAG, "Entering Lock Task (kiosk) mode")
    }

    override fun onLockTaskModeExiting(context: Context, intent: Intent) {
        super.onLockTaskModeExiting(context, intent)
        Log.i(TAG, "Exiting Lock Task (kiosk) mode")
    }
}
