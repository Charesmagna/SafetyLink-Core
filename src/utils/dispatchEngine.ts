/**
 * SafetyLink Canonical Dispatch Engine & Resilience Policies
 * Pure, deterministic, zero-dependency core logic shared across
 * mobile/web dispatch coordination, the Safe 10-Second SOS Drill,
 * adaptive GPS battery management, PCM webhook anti-replay, and
 * free on-device multilingual voice trigger detection.
 */

export type DispatchTierId =
  | 'BACKEND_API'
  | 'FCM_LOUD_ALARM'
  | 'GSM_SMS'
  | 'VOICE_CALL'
  | 'ZERO_AIRTIME_PCM';

export type TierStatus = 'PENDING' | 'IN_FLIGHT' | 'SENT' | 'SKIPPED' | 'FAILED';

export type IncidentState =
  | 'IDLE'
  | 'COUNTDOWN'
  | 'DISPATCHING'
  | 'DISPATCHED'
  | 'PARTIAL_SUCCESS'
  | 'DISARMED'
  | 'COVERT_DURESS';

export type TriggerSource =
  | 'SOFTWARE_BUTTON'
  | 'BLE_ITAG'
  | 'HOME_WIDGET'
  | 'QUICK_TILE'
  | 'VOICE_PHRASE'
  | 'WATCH_ME_TIMEOUT';

export interface DispatchTierRecord {
  id: DispatchTierId;
  label: string;
  transport: string;
  requiresInternet: boolean;
  requiresAirtime: boolean;
  status: TierStatus;
  attempts: number;
  latencyMs?: number;
  detail?: string;
}

export interface IncidentEnvelope {
  incidentId: string;
  createdAtMs: number;
  source: TriggerSource;
  state: IncidentState;
  countdownSeconds: number;
  duressTriggered: boolean;
  networkOnline: boolean;
  hasAirtime: boolean;
  executedTiers: DispatchTierId[];
  tiers: DispatchTierRecord[];
  timeline: string[];
}

export interface AdaptiveGpsPolicy {
  mode: 'PASSIVE_IDLE' | 'BATTERY_SAVER' | 'WATCH_ME' | 'HIGH_ACCURACY_SOS';
  intervalMs: number;
  distanceFilterMeters: number;
  enableHighAccuracy: boolean;
  maximumAgeMs: number;
}

export interface ReplayWindowResult {
  valid: boolean;
  reason: 'OK' | 'INVALID_TIMESTAMP' | 'TOO_OLD' | 'FUTURE_SKEW' | 'REPLAY_DETECTED';
  skewMs?: number;
}

export interface VoiceMatchResult {
  matched: boolean;
  language?: 'en' | 'zu' | 'af' | 'xh' | 'st' | 'tn';
  phrase?: string;
}

export const CANONICAL_TIER_ORDER: readonly DispatchTierId[] = [
  'BACKEND_API',
  'FCM_LOUD_ALARM',
  'GSM_SMS',
  'VOICE_CALL',
  'ZERO_AIRTIME_PCM',
] as const;

const DEFAULT_TIER_TEMPLATES: Record<DispatchTierId, Omit<DispatchTierRecord, 'status' | 'attempts'>> = {
  BACKEND_API: {
    id: 'BACKEND_API',
    label: 'Cloudflare Worker API Sync',
    transport: 'HTTPS / D1 Ledger',
    requiresInternet: true,
    requiresAirtime: false,
  },
  FCM_LOUD_ALARM: {
    id: 'FCM_LOUD_ALARM',
    label: 'Responder Loud Push Alarm',
    transport: 'Firebase Cloud Messaging',
    requiresInternet: true,
    requiresAirtime: false,
  },
  GSM_SMS: {
    id: 'GSM_SMS',
    label: 'Direct Cellular SMS Dispatch',
    transport: 'Native GSM Radio',
    requiresInternet: false,
    requiresAirtime: true,
  },
  VOICE_CALL: {
    id: 'VOICE_CALL',
    label: 'Priority Responder Voice Call',
    transport: 'Cellular Circuit Voice',
    requiresInternet: false,
    requiresAirtime: true,
  },
  ZERO_AIRTIME_PCM: {
    id: 'ZERO_AIRTIME_PCM',
    label: 'Zero-Airtime Please Call Me Relay',
    transport: 'USSD → Rain SIM 081 673 8186 (HMAC)',
    requiresInternet: false,
    requiresAirtime: false,
  },
};

export function generateIncidentId(nowMs = Date.now(), randomHex?: string): string {
  const tsPart = Math.max(0, Math.floor(nowMs)).toString(36).toUpperCase();
  const rand = (
    randomHex ||
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')
  )
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 6)
    .toUpperCase();
  return `SL-INC-${tsPart}-${rand}`;
}

export function createIncidentEnvelope(options: {
  source: TriggerSource;
  countdownSeconds?: number;
  networkOnline?: boolean;
  hasAirtime?: boolean;
  nowMs?: number;
  incidentId?: string;
}): IncidentEnvelope {
  const nowMs = options.nowMs ?? Date.now();
  const countdownSeconds = Math.max(0, Math.floor(options.countdownSeconds ?? 10));
  const incidentId = options.incidentId || generateIncidentId(nowMs);
  const networkOnline = options.networkOnline ?? true;
  const hasAirtime = options.hasAirtime ?? true;

  const tiers: DispatchTierRecord[] = CANONICAL_TIER_ORDER.map((id) => ({
    ...DEFAULT_TIER_TEMPLATES[id],
    status: 'PENDING',
    attempts: 0,
  }));

  return {
    incidentId,
    createdAtMs: nowMs,
    source: options.source,
    state: countdownSeconds > 0 ? 'COUNTDOWN' : 'DISPATCHING',
    countdownSeconds,
    duressTriggered: false,
    networkOnline,
    hasAirtime,
    executedTiers: [],
    tiers,
    timeline: [
      `[${incidentId}] Armed via ${options.source} (${countdownSeconds}s disarm window)`,
    ],
  };
}

/**
 * Evaluates a user's PIN entry during an active countdown.
 * - Matches `safetyPin` -> cleanly disarms the incident.
 * - Matches `duressPin` -> enters COVERT_DURESS (appears disarmed to an attacker,
 *   while flagging silent escalation to responders).
 * - Any other code -> rejected, countdown remains armed.
 */
export function evaluatePinDisarm(
  envelope: IncidentEnvelope,
  enteredPin: string,
  safetyPin: string,
  duressPin?: string
): { envelope: IncidentEnvelope; outcome: 'DISARMED' | 'COVERT_DURESS' | 'INVALID_PIN' } {
  const cleanEntered = enteredPin.trim();
  const cleanSafety = safetyPin.trim();
  const cleanDuress = (duressPin || '').trim();

  if (cleanDuress && cleanEntered === cleanDuress && cleanDuress !== cleanSafety) {
    return {
      outcome: 'COVERT_DURESS',
      envelope: {
        ...envelope,
        state: 'COVERT_DURESS',
        countdownSeconds: 0,
        duressTriggered: true,
        timeline: [
          ...envelope.timeline,
          `[${envelope.incidentId}] Silent duress code accepted — decoy disarm shown while covert escalation continues`,
        ],
      },
    };
  }

  if (cleanSafety && cleanEntered === cleanSafety) {
    return {
      outcome: 'DISARMED',
      envelope: {
        ...envelope,
        state: 'DISARMED',
        countdownSeconds: 0,
        duressTriggered: false,
        timeline: [
          ...envelope.timeline,
          `[${envelope.incidentId}] Safely disarmed with verified Safety PIN`,
        ],
      },
    };
  }

  return {
    outcome: 'INVALID_PIN',
    envelope: {
      ...envelope,
      timeline: [
        ...envelope.timeline,
        `[${envelope.incidentId}] Invalid PIN attempt rejected — countdown remains active`,
      ],
    },
  };
}

/**
 * Idempotently advances one tier in the canonical dispatch chain.
 * Guarantees each tier executes at most once per incidentId.
 */
export function advanceDispatchTier(
  envelope: IncidentEnvelope,
  tierId: DispatchTierId,
  latencyMs = 180
): IncidentEnvelope {
  if (envelope.state === 'DISARMED') {
    return envelope;
  }

  // Strict idempotency: never double-fire a tier already executed for this incidentId
  if (envelope.executedTiers.includes(tierId)) {
    return envelope;
  }

  const nextTiers = envelope.tiers.map((tier) => {
    if (tier.id !== tierId) return tier;

    if (tier.requiresInternet && !envelope.networkOnline) {
      return {
        ...tier,
        status: 'FAILED' as TierStatus,
        attempts: tier.attempts + 1,
        latencyMs,
        detail: 'Offline — failing over to cellular channel',
      };
    }

    if (tier.requiresAirtime && !envelope.hasAirtime) {
      return {
        ...tier,
        status: 'FAILED' as TierStatus,
        attempts: tier.attempts + 1,
        latencyMs,
        detail: 'R0 airtime — failing over to zero-airtime PCM USSD relay',
      };
    }

    return {
      ...tier,
      status: 'SENT' as TierStatus,
      attempts: tier.attempts + 1,
      latencyMs,
      detail: envelope.duressTriggered
        ? 'Covert duress payload delivered silently'
        : 'Delivered and acknowledged',
    };
  });

  const executedTiers = [...envelope.executedTiers, tierId];
  const updatedTier = nextTiers.find((t) => t.id === tierId)!;
  const allAttempted = nextTiers.every((t) => t.status !== 'PENDING' && t.status !== 'IN_FLIGHT');
  const sentCount = nextTiers.filter((t) => t.status === 'SENT').length;
  const failedCount = nextTiers.filter((t) => t.status === 'FAILED').length;

  let nextState: IncidentState = envelope.duressTriggered ? 'COVERT_DURESS' : 'DISPATCHING';
  if (allAttempted) {
    if (envelope.duressTriggered) {
      nextState = 'COVERT_DURESS';
    } else if (sentCount > 0 && failedCount === 0) {
      nextState = 'DISPATCHED';
    } else if (sentCount > 0) {
      nextState = 'PARTIAL_SUCCESS';
    } else {
      nextState = 'PARTIAL_SUCCESS';
    }
  }

  return {
    ...envelope,
    state: nextState,
    countdownSeconds: 0,
    executedTiers,
    tiers: nextTiers,
    timeline: [
      ...envelope.timeline,
      `[${envelope.incidentId}] ${updatedTier.label}: ${updatedTier.status} (${latencyMs}ms) — ${updatedTier.detail}`,
    ],
  };
}

/**
 * Battery-aware adaptive GPS policy to prevent excessive background drain
 * while guaranteeing rapid 5-second high-accuracy tracking during emergencies.
 */
export function getAdaptiveGpsPolicy(params: {
  sosState: 'IDLE' | 'WATCH_ME' | 'COUNTDOWN' | 'ACTIVE_SOS' | 'COVERT_DURESS';
  batteryPercent?: number;
  isCharging?: boolean;
}): AdaptiveGpsPolicy {
  const battery = typeof params.batteryPercent === 'number'
    ? Math.max(0, Math.min(100, params.batteryPercent))
    : 80;

  if (
    params.sosState === 'COUNTDOWN' ||
    params.sosState === 'ACTIVE_SOS' ||
    params.sosState === 'COVERT_DURESS'
  ) {
    return {
      mode: 'HIGH_ACCURACY_SOS',
      intervalMs: 5_000,
      distanceFilterMeters: 5,
      enableHighAccuracy: true,
      maximumAgeMs: 2_000,
    };
  }

  if (params.sosState === 'WATCH_ME') {
    return {
      mode: 'WATCH_ME',
      intervalMs: 20_000,
      distanceFilterMeters: 25,
      enableHighAccuracy: true,
      maximumAgeMs: 10_000,
    };
  }

  if (battery <= 20 && !params.isCharging) {
    return {
      mode: 'BATTERY_SAVER',
      intervalMs: 300_000,
      distanceFilterMeters: 250,
      enableHighAccuracy: false,
      maximumAgeMs: 120_000,
    };
  }

  return {
    mode: 'PASSIVE_IDLE',
    intervalMs: 120_000,
    distanceFilterMeters: 100,
    enableHighAccuracy: false,
    maximumAgeMs: 60_000,
  };
}

/**
 * Canonical string signed by the Rain SIM SMSGate bridge for zero-airtime PCM relays.
 */
export function buildPcmCanonicalPayload(params: {
  senderPhone: string;
  timestampMs: number;
  nonce: string;
  body: string;
}): string {
  const normalizedPhone = params.senderPhone.replace(/\s+/g, '').trim();
  const normalizedNonce = params.nonce.trim();
  const normalizedBody = params.body.trim();
  return `${Math.floor(params.timestampMs)}.${normalizedNonce}.${normalizedPhone}.${normalizedBody}`;
}

/**
 * Validates that an incoming Rain SIM PCM webhook falls within an acceptable
 * anti-replay time window (default 5 minutes) and has not been replayed.
 */
export function verifyPcmReplayWindow(params: {
  timestampMs: number;
  nonce: string;
  seenNonces: Set<string>;
  nowMs?: number;
  maxAgeMs?: number;
  maxFutureSkewMs?: number;
}): ReplayWindowResult {
  const nowMs = params.nowMs ?? Date.now();
  const maxAgeMs = params.maxAgeMs ?? 5 * 60 * 1000;
  const maxFutureSkewMs = params.maxFutureSkewMs ?? 60 * 1000;

  if (!Number.isFinite(params.timestampMs) || params.timestampMs <= 0) {
    return { valid: false, reason: 'INVALID_TIMESTAMP' };
  }

  const skewMs = nowMs - params.timestampMs;
  if (skewMs > maxAgeMs) {
    return { valid: false, reason: 'TOO_OLD', skewMs };
  }
  if (skewMs < -maxFutureSkewMs) {
    return { valid: false, reason: 'FUTURE_SKEW', skewMs };
  }

  const nonceKey = params.nonce.trim();
  if (!nonceKey || params.seenNonces.has(nonceKey)) {
    return { valid: false, reason: 'REPLAY_DETECTED', skewMs };
  }

  params.seenNonces.add(nonceKey);
  return { valid: true, reason: 'OK', skewMs };
}

const MULTILINGUAL_VOICE_PHRASES: Array<{
  language: 'en' | 'zu' | 'af' | 'xh' | 'st' | 'tn';
  phrase: string;
}> = [
  { language: 'en', phrase: 'safetylink help' },
  { language: 'en', phrase: 'emergency sos' },
  { language: 'en', phrase: 'send help now' },
  { language: 'zu', phrase: 'ngisize' },
  { language: 'zu', phrase: 'usizo oluphuthumayo' },
  { language: 'af', phrase: 'help my asseblief' },
  { language: 'af', phrase: 'noodoproep' },
  { language: 'xh', phrase: 'ndincede' },
  { language: 'st', phrase: 'nthuse hle' },
  { language: 'tn', phrase: 'nthusa tsweetswee' },
];

/**
 * Free, zero-API on-device transcript matcher for Web Speech API hands-free distress triggers
 * across major South African languages.
 */
export function matchVoiceTriggerPhrase(transcript: string): VoiceMatchResult {
  const normalized = transcript
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return { matched: false };

  for (const entry of MULTILINGUAL_VOICE_PHRASES) {
    if (normalized.includes(entry.phrase)) {
      return {
        matched: true,
        language: entry.language,
        phrase: entry.phrase,
      };
    }
  }

  return { matched: false };
}
