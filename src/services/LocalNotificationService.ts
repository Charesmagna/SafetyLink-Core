import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
const logoPolish = '/Polish_20260620_014530309.jpg';

export class LocalNotificationService {
  private static isNative = Capacitor.isNativePlatform();

  public static async requestPermission(): Promise<boolean> {
    if (!this.isNative) {
      console.log('[LocalNotificationService:web-sim] Permission requested (auto-granted).');
      return true;
    }
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        return req.display === 'granted';
      }
      return true;
    } catch (e) {
      console.error('[LocalNotificationService] Error requesting permission:', e);
      return false;
    }
  }

  public static async updateStatusNotification(
    isRunning: boolean,
    tickCount: number,
    activeSOSState: string,
    locationStr: string,
    activeBleDevicesCount: number
  ) {
    let title = '';
    let body = '';
    let silent = true;

    if (!isRunning) {
      title = "⚠️ SafetyLink Monitoring Suspended";
      body = "Hardware panic gestures and background tracking are offline! Click to reactivate.";
    } else if (activeSOSState !== 'IDLE') {
      title = "🚨 SafetyLink EMERGENCY ACTIVE";
      body = `Distress signal broadcasting! coordinates: [${locationStr}] • Contact chain alerted.`;
      silent = false;
    } else {
      const devicesStr = activeBleDevicesCount > 0 ? `${activeBleDevicesCount} paired hardware(s)` : 'No iTAG bound';
      title = "🛡️ SafetyLink Active Connection";
      body = `Continuous Link Active • ${devicesStr} • Location: [${locationStr}]`;
    }

    // 1. Browser HTML5 Notifications API
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'granted') {
        try {
          new window.Notification(title, {
            body: body,
            tag: 'safetylink-status',
            icon: logoPolish,
            requireInteraction: isRunning && (activeSOSState !== 'IDLE'),
            silent: silent
          });
        } catch (err) {
          console.warn('[LocalNotificationService] Failed to show HTML5 notification:', err);
        }
      }
    }

    // 2. Capacitor Local Notifications for Native Mobile Devices
    if (!this.isNative) {
      console.log(
        `[LocalNotificationService:web-sim] Device tray notification update (Real Device Notification Pushed): running=${isRunning}, tick=${tickCount}, SOS=${activeSOSState}, location=${locationStr}, paired=${activeBleDevicesCount}`
      );
      return;
    }

    try {
      // Always cancel the previous specific notification ID to update cleanly
      await LocalNotifications.cancel({
        notifications: [{ id: 8801 }]
      }).catch(() => {});

      const notificationInput: any = {
        id: 8801,
        title: title,
        body: body,
        ongoing: true,
        autoCancel: false,
        schedule: { at: new Date(Date.now() + 100) },
        channelId: activeSOSState !== 'IDLE' ? "safetylink_emergency_channel" : "safetylink_channel",
        smallIcon: "res://ic_stat_name"
      };

      await LocalNotifications.schedule({
        notifications: [notificationInput]
      });
    } catch (e) {
      console.error('[LocalNotificationService] Error scheduling local notification:', e);
    }
  }

  public static async cancelNotification() {
    if (!this.isNative) return;
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: 8801 }]
      });
    } catch (e) {
      console.error('[LocalNotificationService] Error canceling local notification:', e);
    }
  }
}
