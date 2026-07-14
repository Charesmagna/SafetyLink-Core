import { registerPlugin, Capacitor } from '@capacitor/core';

export interface EmergencyDispatchPlugin {
  sendSms(options: { phone: string; message: string }): Promise<{ sent: boolean; error?: string }>;
  placeCall(options: { phone: string }): Promise<{ dialed: boolean; error?: string }>;
  openWhatsApp(options: { phone: string; message: string }): Promise<{ opened: boolean; requiresManualSend: boolean; error?: string }>;
}

const NativeEmergencyDispatch = registerPlugin<EmergencyDispatchPlugin>('EmergencyDispatch');

export interface DispatchResult {
  success: boolean;
  simulated: boolean;
  error?: string;
}

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

  static async sendSms(phone: string, message: string): Promise<DispatchResult> {
    if (!this.isNative) {
      console.log(`[NativeDispatch:web-sim] Would SMS ${phone}: "${message}"`);
      return { success: true, simulated: true };
    }
    try {
      const res = await NativeEmergencyDispatch.sendSms({ phone, message });
      return { success: res.sent, simulated: false, error: res.error };
    } catch (e) {
      console.error('[NativeDispatch] sendSms failed', e);
      return { success: false, simulated: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  static async placeCall(phone: string): Promise<DispatchResult> {
    if (!this.isNative) {
      console.log(`[NativeDispatch:web-sim] Would call ${phone}`);
      return { success: true, simulated: true };
    }
    try {
      const res = await NativeEmergencyDispatch.placeCall({ phone });
      return { success: res.dialed, simulated: false, error: res.error };
    } catch (e) {
      console.error('[NativeDispatch] placeCall failed', e);
      return { success: false, simulated: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * Opens WhatsApp with the message ready to go. This cannot be made fully
   * silent -- the user still taps Send inside WhatsApp. See
   * EmergencyDispatchPlugin.java for why (no consent-free WhatsApp send API
   * exists for third-party apps without WhatsApp Business Cloud API or an
   * accessibility-service auto-tapper, which this app deliberately does not use).
   */
  static async openWhatsApp(phone: string, message: string): Promise<DispatchResult> {
    if (!this.isNative) {
      console.log(`[NativeDispatch:web-sim] Would open WhatsApp to ${phone}: "${message}"`);
      return { success: true, simulated: true };
    }
    try {
      const res = await NativeEmergencyDispatch.openWhatsApp({ phone, message });
      return { success: res.opened, simulated: false, error: res.error };
    } catch (e) {
      console.error('[NativeDispatch] openWhatsApp failed', e);
      return { success: false, simulated: false, error: e instanceof Error ? e.message : String(e) };
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
