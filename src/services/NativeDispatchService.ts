import { registerPlugin, Capacitor } from '@capacitor/core';

export interface EmergencyDispatchPlugin {
  sendSms(options: { phone: string; message: string }): Promise<{ sent: boolean; error?: string }>;
  placeCall(options: { phone: string }): Promise<{ dialed: boolean; error?: string }>;
  openWhatsApp(options: { phone: string; message: string }): Promise<{ opened: boolean; requiresManualSend: boolean; error?: string }>;
}

export interface SafetyLinkEmergencyPlugin {
  trigger(options: {
    description?: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
    organizationId?: string;
    userId?: string;
  }): Promise<{ status: string; countdownSeconds: number }>;
  cancel(): Promise<{ status: string }>;
  getState(): Promise<{ isCountdownActive: boolean; secondsRemaining: number; lastStatus: string }>;
  enforceHardwareWake(): Promise<void>;
  checkOverlayPermission(): Promise<{ granted: boolean }>;
  requestOverlayPermission(): Promise<void>;
  addListener(eventName: 'onPanicStatusChange', listenerFunc: (data: { source: string; countdownSeconds: number; status: string }) => void): Promise<any>;
}

const NativeEmergencyDispatch = registerPlugin<EmergencyDispatchPlugin>('EmergencyDispatch');
export const SafetyLinkEmergency = registerPlugin<SafetyLinkEmergencyPlugin>('SafetyLinkEmergency');

export interface DispatchResult {
  success: boolean;
  simulated: boolean;
  error?: string;
  status?: string;
}

/**
 * NativeDispatchService
 *
 * Canonical unified bridge routing emergency calls to the native Android emergency engine
 * (PanicService / EmergencyDispatchPlugin) when running on device, or providing explicit
 * simulation feedback when running in pure web browsers.
 */
export class NativeDispatchService {
  private static isNative = Capacitor.isNativePlatform();

  static async triggerNativeEmergency(payload: {
    description: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
    organizationId?: string;
    userId?: string;
  }): Promise<{ status: string; countdownSeconds: number }> {
    if (!this.isNative) {
      console.log('[NativeDispatch:web-sim] Triggering simulated emergency countdown:', payload);
      return { status: 'COUNTDOWN', countdownSeconds: 10 };
    }
    try {
      return await SafetyLinkEmergency.trigger(payload);
    } catch (e) {
      console.error('[NativeDispatch] SafetyLinkEmergency.trigger failed:', e);
      throw e;
    }
  }

  static async cancelNativeEmergency(): Promise<{ status: string }> {
    if (!this.isNative) {
      console.log('[NativeDispatch:web-sim] Emergency cancelled');
      return { status: 'CANCELLED' };
    }
    try {
      return await SafetyLinkEmergency.cancel();
    } catch (e) {
      console.error('[NativeDispatch] SafetyLinkEmergency.cancel failed:', e);
      throw e;
    }
  }

  static async sendSms(phone: string, message: string): Promise<DispatchResult> {
    if (!this.isNative) {
      console.log(`[NativeDispatch:web-sim] Would SMS ${phone}: "${message}"`);
      return { success: true, simulated: true, status: 'SENT' };
    }
    try {
      const res = await NativeEmergencyDispatch.sendSms({ phone, message });
      return { success: res.sent, simulated: false, error: res.error, status: res.sent ? 'SENT' : 'FAILED' };
    } catch (e) {
      console.error('[NativeDispatch] sendSms failed', e);
      return { success: false, simulated: false, error: e instanceof Error ? e.message : String(e), status: 'FAILED' };
    }
  }

  static async placeCall(phone: string): Promise<DispatchResult> {
    if (!this.isNative) {
      console.log(`[NativeDispatch:web-sim] Would call ${phone}`);
      return { success: true, simulated: true, status: 'INITIATED' };
    }
    try {
      const res = await NativeEmergencyDispatch.placeCall({ phone });
      return { success: res.dialed, simulated: false, error: res.error, status: res.dialed ? 'INITIATED' : 'FAILED' };
    } catch (e) {
      console.error('[NativeDispatch] placeCall failed', e);
      return { success: false, simulated: false, error: e instanceof Error ? e.message : String(e), status: 'FAILED' };
    }
  }

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
    console.log("[NativeDispatch] High-intensity distress haptics sequence engaged.");
  }

  static async forceUnlockAndWake(): Promise<void> {
    if (this.isNative) {
      try {
        await SafetyLinkEmergency.enforceHardwareWake();
      } catch (e) {
        console.warn('[NativeDispatch] enforceHardwareWake failed', e);
      }
    }
    console.log("[NativeDispatch] Android background force-unlock and keyguard-bypass routine triggered.");
  }
}
