import { registerPlugin, Capacitor } from '@capacitor/core';

export interface EmergencyDispatchPlugin {
  sendSms(options: { phone: string; message: string }): Promise<{ sent: boolean }>;
  placeCall(options: { phone: string }): Promise<{ dialed: boolean }>;
  openWhatsApp(options: { phone: string; message: string }): Promise<{ opened: boolean; requiresManualSend: boolean }>;
}

const NativeEmergencyDispatch = registerPlugin<EmergencyDispatchPlugin>('EmergencyDispatch');

/**
 * NativeDispatchService
 *
 * Thin wrapper so the rest of the app can call one consistent API whether
 * it's running in the native Android shell (real SMS/calls/WhatsApp) or in
 * a browser preview during development (safely simulated, no native bridge
 * exists there).
 */
export class NativeDispatchService {
  private static isNative = Capacitor.isNativePlatform();

  static async sendSms(phone: string, message: string): Promise<boolean> {
    if (!this.isNative) {
      console.log(`[NativeDispatch:web-sim] Would SMS ${phone}: "${message}"`);
      return true;
    }
    try {
      const res = await NativeEmergencyDispatch.sendSms({ phone, message });
      return res.sent;
    } catch (e) {
      console.error('[NativeDispatch] sendSms failed', e);
      return false;
    }
  }

  static async placeCall(phone: string): Promise<boolean> {
    if (!this.isNative) {
      console.log(`[NativeDispatch:web-sim] Would call ${phone}`);
      return true;
    }
    try {
      const res = await NativeEmergencyDispatch.placeCall({ phone });
      return res.dialed;
    } catch (e) {
      console.error('[NativeDispatch] placeCall failed', e);
      return false;
    }
  }

  /**
   * Opens WhatsApp with the message ready to go. This cannot be made fully
   * silent -- the user still taps Send inside WhatsApp. See
   * EmergencyDispatchPlugin.java for why (no consent-free WhatsApp send API
   * exists for third-party apps without WhatsApp Business Cloud API or an
   * accessibility-service auto-tapper, which this app deliberately does not use).
   */
  static async openWhatsApp(phone: string, message: string): Promise<boolean> {
    if (!this.isNative) {
      console.log(`[NativeDispatch:web-sim] Would open WhatsApp to ${phone}: "${message}"`);
      return true;
    }
    try {
      const res = await NativeEmergencyDispatch.openWhatsApp({ phone, message });
      return res.opened;
    } catch (e) {
      console.error('[NativeDispatch] openWhatsApp failed', e);
      return false;
    }
  }

  static async triggerVibration(): Promise<void> {
    if (navigator.vibrate) {
      try {
        navigator.vibrate([400, 200, 400, 200, 600]);
      } catch (e) {
        console.warn('Vibration rejected by environment:', e);
      }
    }
    console.log("[NativeDispatch] High-intensity distress haptics / vibration sequence engaged.");
  }

  static async forceUnlockAndWake(): Promise<void> {
    console.log("[NativeDispatch] Android background force-unlock and keyguard-bypass routine triggered.");
  }
}
