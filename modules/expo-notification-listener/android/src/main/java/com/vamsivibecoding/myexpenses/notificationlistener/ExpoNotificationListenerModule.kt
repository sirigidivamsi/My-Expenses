package com.vamsivibecoding.myexpenses.notificationlistener

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.content.Context
import android.content.Intent
import android.provider.Settings

class ExpoNotificationListenerModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context not available")

  override fun definition() = ModuleDefinition {
    Name("ExpoNotificationListener")

    Function("isPermissionGranted") {
      val packageName = context.packageName
      val enabledListeners = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")
      enabledListeners != null && enabledListeners.contains(packageName)
    }

    Function("requestPermission") {
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }

    Function("getPendingNotifications") {
      val sharedPrefs = context.getSharedPreferences("notification_listener_prefs", Context.MODE_PRIVATE)
      val notificationsJson = sharedPrefs.getString("pending_notifications", "[]") ?: "[]"
      // Clear them after reading
      sharedPrefs.edit().putString("pending_notifications", "[]").apply()
      notificationsJson
    }

    Function("updateSupportedApps") { appsJson: String ->
      val sharedPrefs = context.getSharedPreferences("notification_listener_prefs", Context.MODE_PRIVATE)
      sharedPrefs.edit().putString("supported_apps", appsJson).apply()
    }
  }
}
