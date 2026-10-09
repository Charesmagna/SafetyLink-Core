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
    directDispatch?: boolean;
  }): Promise<{ status: string; countdownSeconds: number }>;
  cancel(): Promise<{ status: string }>;
  getState(): Promise<{ isCountdownActive: boolean; secondsRemaining: number; lastStatus: string }>;
  getDeviceBattery(): Promise<{ level: number; isCharging: boolean; chargingTime?: number; dischargingTime?: number }>;
  enforceHardwareWake(): Promise<void>;
  checkOverlayPermission(): Promise<{ granted: boolean }>;
  requestOverlayPermission(): Promise<void>;
  toggleFloatingWidget(options: { enable: boolean }): Promise<{ enabled: boolean; needsPermission?: boolean }>;
  addListener(eventName: 'onPanicStatusChange', listenerFunc: (data: { source: string; countdownSeconds: number; status: string }) => void): Promise<any>;
}

const NativeEmergencyDispatch = registerPlugin<EmergencyDispatchPlugin>('EmergencyDispatch');
export const SafetyLinkEmergency = registerPlugin<SafetyLinkEmergencyPlugin>('SafetyLinkEmergency');

export interface DeviceBatteryStatus {
  level: number;
  isCharging: boolean;
  chargingTime?: number;
  dischargingTime?: number;
  isSupported: boolean;
}

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
    directDispatch?: boolean;
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

  private static logDispatchEntry(entry: {
    channel: 'USSD' | 'SMS' | 'VOICE_CALL' | 'WHATSAPP';
    target: string;
    status: 'QUEUED' | 'SENT' | 'INITIATED' | 'FAILED' | 'DELIVERED';
    unitId?: string;
    details?: string;
  }) {
    try {
      if (typeof window !== 'undefined') {
        const store = (window as any).__SAFETYLINK_STORE__;
        if (store?.getState) {
          const state = store.getState();
          const unitId = entry.unitId || state.currentUser?.id || 'SL-UNIT-LOCAL';
          const loc = state.userLocation;
          state.addDispatchLog({
            channel: entry.channel,
            target: entry.target,
            status: entry.status,
            unitId,
            coordinates: loc ? { lat: loc.lat, lng: loc.lng } : undefined,
            details: entry.details || `${entry.channel} dispatch processed via ${this.isNative ? 'Android Native Telephony' : 'Web Simulation'}.`
          });
        }
      }
    } catch (e) {
      console.warn('[NativeDispatch] Logging hook exception:', e);
    }
  }

  static async sendUssd(code: string): Promise<DispatchResult> {
    if (!this.isNative) {
      console.log(`[NativeDispatch:web-sim] Would dial USSD ${code}`);
      this.logDispatchEntry({
        channel: 'USSD',
        target: code,
        status: 'INITIATED',
        details: 'Simulated USSD carrier code execution.'
      });
      return { success: true, simulated: true, status: 'INITIATED' };
    }
    try {
      const res = await (NativeEmergencyDispatch as any).sendUssd({ code });
      const status = res.dialed ? 'INITIATED' : 'FAILED';
      this.logDispatchEntry({
        channel: 'USSD',
        target: code,
        status,
        details: res.error || (res.dialed ? 'Native USSD dialed via Android telephony.' : 'USSD failed')
      });
      return { success: res.dialed, simulated: false, error: res.error, status };
    } catch (e) {
      console.error('[NativeDispatch] sendUssd failed', e);
      this.logDispatchEntry({
        channel: 'USSD',
        target: code,
        status: 'FAILED',
        details: e instanceof Error ? e.message : String(e)
      });
      return { success: false, simulated: false, error: e instanceof Error ? e.message : String(e), status: 'FAILED' };
    }
  }

  static async toggleFloatingWidget(enable: boolean): Promise<{ enabled: boolean; needsPermission?: boolean }> {
    if (!this.isNative) {
      console.log('[NativeDispatch:web-sim] Toggle floating widget:', enable);
      return { enabled: enable };
    }
    try {
      return await SafetyLinkEmergency.toggleFloatingWidget({ enable });
    } catch (e) {
      console.error('[NativeDispatch] toggleFloatingWidget failed', e);
      return { enabled: false };
    }
  }

  static async sendSms(phone: string, message: string): Promise<DispatchResult> {
    if (!this.isNative) {
      console.log(`[NativeDispatch:web-sim] Would SMS ${phone}: "${message}"`);
      this.logDispatchEntry({
        channel: 'SMS',
        target: phone,
        status: 'SENT',
        details: `Simulated SMS broadcast: "${message.slice(0, 50)}..."`
      });
      return { success: true, simulated: true, status: 'SENT' };
    }
    try {
      const res = await NativeEmergencyDispatch.sendSms({ phone, message });
      const status = res.sent ? 'SENT' : 'FAILED';
      this.logDispatchEntry({
        channel: 'SMS',
        target: phone,
        status,
        details: res.error || (res.sent ? 'Native SMS transmitted via Android SmsManager.' : 'SmsManager transmission error')
      });
      return { success: res.sent, simulated: false, error: res.error, status };
    } catch (e) {
      console.error('[NativeDispatch] sendSms failed', e);
      this.logDispatchEntry({
        channel: 'SMS',
        target: phone,
        status: 'FAILED',
        details: e instanceof Error ? e.message : String(e)
      });
      return { success: false, simulated: false, error: e instanceof Error ? e.message : String(e), status: 'FAILED' };
    }
  }

  static async placeCall(phone: string): Promise<DispatchResult> {
    if (!this.isNative) {
      console.log(`[NativeDispatch:web-sim] Would call ${phone}`);
      this.logDispatchEntry({
        channel: 'VOICE_CALL',
        target: phone,
        status: 'INITIATED',
        details: 'Simulated telephony call connection initiated.'
      });
      return { success: true, simulated: true, status: 'INITIATED' };
    }
    try {
      const res = await NativeEmergencyDispatch.placeCall({ phone });
      const status = res.dialed ? 'INITIATED' : 'FAILED';
      this.logDispatchEntry({
        channel: 'VOICE_CALL',
        target: phone,
        status,
        details: res.error || (res.dialed ? 'Native call dispatched via CALL_PHONE.' : 'Call failed')
      });
      return { success: res.dialed, simulated: false, error: res.error, status };
    } catch (e) {
      console.error('[NativeDispatch] placeCall failed', e);
      this.logDispatchEntry({
        channel: 'VOICE_CALL',
        target: phone,
        status: 'FAILED',
        details: e instanceof Error ? e.message : String(e)
      });
      return { success: false, simulated: false, error: e instanceof Error ? e.message : String(e), status: 'FAILED' };
    }
  }

  static async openWhatsApp(phone: string, message: string): Promise<DispatchResult> {
    if (!this.isNative) {
      console.log(`[NativeDispatch:web-sim] Would open WhatsApp to ${phone}: "${message}"`);
      this.logDispatchEntry({
        channel: 'WHATSAPP',
        target: phone,
        status: 'SENT',
        details: `Simulated WhatsApp dispatch: "${message.slice(0, 50)}..."`
      });
      return { success: true, simulated: true };
    }
    try {
      const res = await NativeEmergencyDispatch.openWhatsApp({ phone, message });
      const status = res.opened ? 'SENT' : 'FAILED';
      this.logDispatchEntry({
        channel: 'WHATSAPP',
        target: phone,
        status,
        details: res.error || (res.opened ? 'WhatsApp intent launched.' : 'WhatsApp failed')
      });
      return { success: res.opened, simulated: false, error: res.error };
    } catch (e) {
      console.error('[NativeDispatch] openWhatsApp failed', e);
      this.logDispatchEntry({
        channel: 'WHATSAPP',
        target: phone,
        status: 'FAILED',
        details: e instanceof Error ? e.message : String(e)
      });
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

  /**
   * Retrieves real-time device battery percentage and charging state via native
   * Android BatteryManager or the standard Web Battery Status API.
   */
  static async getDeviceBattery(): Promise<DeviceBatteryStatus> {
    if (this.isNative) {
      try {
        const res = await SafetyLinkEmergency.getDeviceBattery();
        return {
          level: Math.round(res.level),
          isCharging: !!res.isCharging,
          chargingTime: res.chargingTime,
          dischargingTime: res.dischargingTime,
          isSupported: true,
        };
      } catch (err) {
        console.warn('[NativeDispatch] Native getDeviceBattery failed, falling back to Web API:', err);
      }
    }

    // Web / PWA Battery Status API fallback
    try {
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        const battery: any = await (navigator as any).getBattery();
        return {
          level: Math.round(battery.level * 100),
          isCharging: !!battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
          isSupported: true,
        };
      }
    } catch (e) {
      console.warn('[NativeDispatch] navigator.getBattery unavailable:', e);
    }

    // Default safe fallback if battery API unavailable in environment
    return {
      level: 95,
      isCharging: false,
      isSupported: false,
    };
  }

  /**
   * Subscribes to real-time charge and battery level changes.
   * Returns an unsubscribe function.
   */
  static subscribeBatteryUpdates(callback: (status: DeviceBatteryStatus) => void): () => void {
    let active = true;

    // Check if web battery events are available
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (!active) return;
        const handler = () => {
          if (!active) return;
          callback({
            level: Math.round(battery.level * 100),
            isCharging: !!battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime,
            isSupported: true,
          });
        };

        battery.addEventListener('levelchange', handler);
        battery.addEventListener('chargingchange', handler);

        // Send initial reading
        handler();
      }).catch(() => {});
    }

    // Periodic poll for native bridge (every 15s) to guarantee fresh telemetry
    const interval = setInterval(async () => {
      if (!active) return;
      try {
        const status = await this.getDeviceBattery();
        callback(status);
      } catch {}
    }, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }
}

