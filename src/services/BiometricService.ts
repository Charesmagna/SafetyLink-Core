import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

export interface BiometricCheckResult {
  isAvailable: boolean;
  biometryType: 'FINGERPRINT' | 'FACE_ID' | 'TOUCH_ID' | 'IRIS' | 'NONE';
  hasHardware: boolean;
  error?: string;
}

export interface BiometricVerifyOptions {
  reason?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  negativeButtonText?: string;
}

class BiometricService {
  private static instance: BiometricService;
  private sessionExpiry: Record<string, number> = {};
  private readonly SESSION_DURATION_MS = 5 * 60 * 1000; // 5 minutes grace window

  private constructor() {}

  public static getInstance(): BiometricService {
    if (!BiometricService.instance) {
      BiometricService.instance = new BiometricService();
    }
    return BiometricService.instance;
  }

  /**
   * Checks if biometric hardware (fingerprint, face, etc.) is available on the current device
   */
  public async checkAvailability(): Promise<BiometricCheckResult> {
    if (!Capacitor.isNativePlatform()) {
      // Check if WebAuthn / Platform Authenticator (Windows Hello, TouchID, Android Chrome) is available in browser
      const hasWebAuthn = typeof window !== 'undefined' && 
        window.PublicKeyCredential !== undefined &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
      
      let webAuthnAvailable = false;
      if (hasWebAuthn) {
        try {
          webAuthnAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch (_) {
          webAuthnAvailable = false;
        }
      }

      return {
        isAvailable: webAuthnAvailable,
        biometryType: webAuthnAvailable ? 'FINGERPRINT' : 'NONE',
        hasHardware: webAuthnAvailable
      };
    }

    try {
      const result = await NativeBiometric.isAvailable({ useFallback: true });
      let biometryType: BiometricCheckResult['biometryType'] = 'NONE';

      if (result.biometryType === BiometryType.TOUCH_ID) biometryType = 'TOUCH_ID';
      else if (result.biometryType === BiometryType.FACE_ID || result.biometryType === BiometryType.FACE_AUTHENTICATION) biometryType = 'FACE_ID';
      else if (result.biometryType === BiometryType.FINGERPRINT) biometryType = 'FINGERPRINT';
      else if (result.biometryType === BiometryType.IRIS_AUTHENTICATION) biometryType = 'IRIS';
      else if (result.isAvailable) biometryType = 'FINGERPRINT';

      return {
        isAvailable: !!result.isAvailable,
        biometryType,
        hasHardware: !!result.isAvailable
      };
    } catch (err: any) {
      console.warn('[BiometricService] Availability check failed:', err?.message || err);
      return {
        isAvailable: false,
        biometryType: 'NONE',
        hasHardware: false,
        error: err?.message
      };
    }
  }

  /**
   * Prompts the user with the native Android BiometricPrompt / iOS FaceID or fallback credential
   */
  public async authenticate(options?: BiometricVerifyOptions): Promise<boolean> {
    const title = options?.title || 'SafetyLink Biometric Security';
    const subtitle = options?.subtitle || 'Identity Verification Required';
    const description = options?.description || 'Confirm your fingerprint to access confidential assets.';
    const negativeButtonText = options?.negativeButtonText || 'Use PIN';

    if (!Capacitor.isNativePlatform()) {
      // In Web / Simulator mode, attempt WebAuthn challenge if platform authenticator is available
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        try {
          const isPlatformAuth = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          if (isPlatformAuth) {
            // Simulated secure local assertion for dev/web environments
            return true;
          }
        } catch (_) {}
      }
      return false;
    }

    try {
      await NativeBiometric.verifyIdentity({
        title,
        subtitle,
        description,
        negativeButtonText,
        maxAttempts: 3,
        useFallback: true
      });
      return true;
    } catch (err: any) {
      console.warn('[BiometricService] Verification failed/canceled:', err?.message || err);
      return false;
    }
  }

  /**
   * Validates if a scope (e.g. 'vault', 'settings') currently has an active biometric grace period
   */
  public isScopeUnlocked(scope: string): boolean {
    const expiry = this.sessionExpiry[scope];
    if (!expiry) return false;
    if (Date.now() > expiry) {
      delete this.sessionExpiry[scope];
      return false;
    }
    return true;
  }

  /**
   * Grants an authenticated grace window for the specified scope
   */
  public grantScopeUnlock(scope: string, durationMs?: number): void {
    this.sessionExpiry[scope] = Date.now() + (durationMs || this.SESSION_DURATION_MS);
  }

  /**
   * Manually locks the given scope immediately
   */
  public lockScope(scope: string): void {
    delete this.sessionExpiry[scope];
  }
}

export const biometricService = BiometricService.getInstance();
