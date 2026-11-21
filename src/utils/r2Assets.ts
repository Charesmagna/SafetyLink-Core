/**
 * Comprehensive R2 media registry mapping verified Cloudflare R2 bucket assets
 * to dedicated UI sections across the SafetyLink Core platform.
 */

import { Capacitor } from '@capacitor/core';

const DEFAULT_API_ORIGIN = 'https://api.safetylink.online';

export const resolveR2BaseOrigin = (): string => {
  if (typeof window !== 'undefined' && !Capacitor.isNativePlatform()) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return '';
    }
  }
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
  return DEFAULT_API_ORIGIN;
};

export const getR2StreamUrl = (filename: string): string => {
  const cleanName = String(filename || '').replace(/^\/+/, '').replace(/^Safetylink\//i, '');
  const origin = resolveR2BaseOrigin();
  return `${origin}/api/r2/stream/Safetylink/${encodeURIComponent(cleanName)}`;
};

export const getR2DownloadUrl = (filename: string): string => {
  const cleanName = String(filename || '').replace(/^\/+/, '').replace(/^Safetylink\//i, '');
  const origin = resolveR2BaseOrigin();
  return `${origin}/api/r2/download/Safetylink/${encodeURIComponent(cleanName)}`;
};

export const normalizeR2AssetUrls = <T extends { key: string; streamUrl?: string; downloadUrl?: string }>(
  asset: T,
  baseOrigin?: string
): T => {
  const origin = baseOrigin !== undefined ? baseOrigin : resolveR2BaseOrigin();
  const cleanOrigin = origin.replace(/\/+$/, '');
  const cleanName = String(asset.key || '').replace(/^\/+/, '').replace(/^Safetylink\//i, '');
  const streamPath = `/api/r2/stream/Safetylink/${encodeURIComponent(cleanName)}`;
  const downloadPath = `/api/r2/download/Safetylink/${encodeURIComponent(cleanName)}`;
  return {
    ...asset,
    streamUrl: `${cleanOrigin}${streamPath}`,
    downloadUrl: `${cleanOrigin}${downloadPath}`,
  };
};

export async function fetchR2Assets(prefix = 'Safetylink/') {
  const origins = [resolveR2BaseOrigin(), DEFAULT_API_ORIGIN, 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev'];
  const tried = new Set<string>();
  for (const origin of origins) {
    if (tried.has(origin)) continue;
    tried.add(origin);
    try {
      const res = await fetch(`${origin}/api/r2/assets?prefix=${encodeURIComponent(prefix)}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && Array.isArray(data.assets)) {
          return {
            ...data,
            origin,
            assets: data.assets.map((asset: any) => normalizeR2AssetUrls(asset, origin)),
          };
        }
      }
    } catch {
      // continue to fallback origin
    }
  }
  return { success: false, assets: [] };
}

export async function loginR2Admin(email: string, password: string): Promise<{ ok: boolean; token?: string; error?: string }> {
  const origins = [DEFAULT_API_ORIGIN, 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev'];
  let lastError = 'Unable to reach SafetyLink API';
  for (const origin of origins) {
    try {
      const res = await fetch(`${origin}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.token) {
        return { ok: true, token: data.token };
      }
      lastError = data?.error || `HTTP ${res.status}`;
      if (res.status === 401 || res.status === 429) break;
    } catch (e: any) {
      lastError = e?.message || lastError;
    }
  }
  return { ok: false, error: lastError };
}

export async function deleteR2Asset(key: string, adminToken: string): Promise<{ ok: boolean; error?: string }> {
  const origins = [DEFAULT_API_ORIGIN, 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev'];
  let lastError = 'Failed to delete asset from R2';
  for (const origin of origins) {
    try {
      const res = await fetch(`${origin}/api/r2/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ key }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        return { ok: true };
      }
      lastError = data?.error || `HTTP ${res.status}`;
      if (res.status === 401 || res.status === 403) break;
    } catch (e: any) {
      lastError = e?.message || lastError;
    }
  }
  return { ok: false, error: lastError };
}


export const R2_MEDIA = {
  // Brand & Architecture Diagrams
  architecture: {
    systemAnatomy: getR2StreamUrl('Emergency_System_Architecture_Anatomy.png'),
    responseOverview: getR2StreamUrl('Emergency_Response_Platform_Architecture_Overview.png'),
    meshPlatformOverview: getR2StreamUrl('Emergency_Mesh_Platform_Overview.png'),
    responseArchitecture: getR2StreamUrl('Emergency_Response_System_Architecture.png'),
    universalResilience: getR2StreamUrl('SafetyLink_Universal_Resilience_Comparison.png'),
    securityEcosystem: getR2StreamUrl('Security_Ecosystem_Comparison_Sheet.png'),
    globalNetworkBanner: getR2StreamUrl('Emergency_Response_Platform_Architecture_Overview.png'),
  },

  // Platform Views & Backdrops
  platform: {
    heroBackground: getR2StreamUrl('Random platform background.png'),
    dashboardMesh: getR2StreamUrl('Emergency_Mesh_Platform_Overview.png'),
    telemetryDesk: getR2StreamUrl('Polish_20260914_220631067.png'),
    commandDeckDark: getR2StreamUrl('IMG_20260914_221811.png'),
    networkGrid: getR2StreamUrl('IMG_20260914_223311.png'),
    mobileTelemetry: getR2StreamUrl('IMG_20260914_223547.png'),
    signalMap: getR2StreamUrl('Polish_20260809_035827088.png'),
    dispatchControl: getR2StreamUrl('Polish_20260809_161140255.png'),
    ambientHero: getR2StreamUrl('eka67lqzxa.png'),
    darkInterface: getR2StreamUrl('iumb4dkepg.png'),
  },

  // Hardware Devices, Peripherals & Keyfobs
  hardware: {
    itagFinderProduct: getR2StreamUrl('HST-01-Anti-Lost-Finder-PRODUCT.jpg'),
    itagWhite: getR2StreamUrl('31DP9Fqk0wL._AC_.jpg'),
    itagBlack: getR2StreamUrl('31ThUsPRrzL._AC_.jpg'),
    itagKeyring: getR2StreamUrl('Polish_20260819_014832026.jpg'),
    itagMacro: getR2StreamUrl('Polish_20260819_020007723.jpg'),
    itagTeardown: getR2StreamUrl('Polish_20260819_020134421.jpg'),
    hardwarePack: getR2StreamUrl('Polish_20260819_020219883.jpg'),
    bleTransmitter: getR2StreamUrl('Polish_20260819_023658467.jpg'),
    limxDynamicsRobot: getR2StreamUrl('limx dynamics.jpg'),
    catPanicWearable: getR2StreamUrl('Cat with a button.png'),
    fieldDeviceClose: getR2StreamUrl('IMG_20260907_010544.jpg'),
    microBeacon: getR2StreamUrl('IMG_20260907_010612.jpg'),
    fieldBeaconAntenna: getR2StreamUrl('IMG_20260907_040700.jpg'),
    deviceProfile: getR2StreamUrl('IMG_20260907_040734.jpg'),
    hardwareAssembly: getR2StreamUrl('Polish_20260906_205848313.jpg'),
    wearableTrigger: getR2StreamUrl('Polish_20260907_010722614.jpg'),
    ruggedBeacon: getR2StreamUrl('Polish_20260907_043403519.jpg'),
  },

  // Use Cases & Contextual Roles
  usecases: {
    estateCommunity: getR2StreamUrl('Gemini_Generated_Image_1eu4fz1eu4fz1eu4.png'),
    corporateCampus: getR2StreamUrl('Gemini_Generated_Image_41892s41892s4189.png'),
    loneWorkerIndustrial: getR2StreamUrl('Gemini_Generated_Image_48euet48euet48eu.png'),
    hospitalHealthcare: getR2StreamUrl('Gemini_Generated_Image_6iikvx6iikvx6iik.png'),
    transportLogistics: getR2StreamUrl('Gemini_Generated_Image_9uad6r9uad6r9uad.png'),
    schoolUniversity: getR2StreamUrl('Gemini_Generated_Image_k2mcd9k2mcd9k2mc.png'),
    municipalEmergency: getR2StreamUrl('Gemini_Generated_Image_td9rg6td9rg6td9r.png'),
    nightPatrolOfficer: getR2StreamUrl('Polish_20251001_050324776.jpg'),
    tacticalSecurity: getR2StreamUrl('Polish_20260711_034127538.jpg'),
    securityDeskOperator: getR2StreamUrl('photo-1551288049-bebda4e38f71.jpeg'),
  },

  // Backgrounds & Abstract Textures
  backgrounds: {
    cyberMesh: getR2StreamUrl('Gemini_Generated_Image_4egowc4egowc4ego.jpeg'),
    darkTopology: getR2StreamUrl('Gemini_Generated_Image_59psss59psss59ps.jpeg'),
    telemetryRadar: getR2StreamUrl('Gemini_Generated_Image_dehjc4dehjc4dehj.jpeg'),
    neonGrid: getR2StreamUrl('Gemini_Generated_Image_ohoz6sohoz6sohoz.jpeg'),
    satelliteConstellation: getR2StreamUrl('Gemini_Generated_Image_oq7hz1oq7hz1oq7h.jpeg'),
    quantumCircuit: getR2StreamUrl('Gemini_Generated_Image_swlp4kswlp4kswlp (1).jpeg'),
    ambientSphere: getR2StreamUrl('Gemini_Generated_Image_1597xn1597xn1597.jpeg'),
  },
};
