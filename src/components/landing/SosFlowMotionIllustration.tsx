import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../utils/store';

interface FlowStage {
  id: number;
  step: string;
  title: string;
  caption: string;
  shortLabel: string;
}

const FLOW_STAGES: FlowStage[] = [
  {
    id: 0,
    step: '01',
    title: 'SOS Triggered',
    shortLabel: 'Trigger',
    caption: 'A single press on a pocket BLE iTAG button or the SafetyLink app activates the emergency sequence.',
  },
  {
    id: 1,
    step: '02',
    title: '10-Second Disarm Window',
    shortLabel: '10s PIN Lock',
    caption: 'A 10-second countdown prevents accidental alerts. Safety PIN cancels cleanly; Duress PIN dispatches silently.',
  },
  {
    id: 2,
    step: '03',
    title: '5-Tier Automatic Failover',
    shortLabel: 'R0 Failover',
    caption: 'If data or airtime run out, SafetyLink automatically falls back across API, Push, SMS, Voice, and Zero-Airtime Please Call Me.',
  },
  {
    id: 3,
    step: '04',
    title: 'Responders & Family Alerted',
    shortLabel: 'Dispatched',
    caption: 'Live GPS coordinates and incident status reach saved emergency contacts and your security control deck.',
  },
];

const FAILOVER_NODES = [
  { id: 'api', label: 'Cloud API', sub: 'HTTPS', y: 92, activeAtFailover: false },
  { id: 'fcm', label: 'Loud Push', sub: 'FCM', y: 152, activeAtFailover: false },
  { id: 'sms', label: 'GSM SMS', sub: 'Cellular', y: 212, activeAtFailover: false },
  { id: 'voice', label: 'Voice Call', sub: 'Direct', y: 272, activeAtFailover: false },
  { id: 'pcm', label: 'R0 Please Call Me', sub: '081 673 8186', y: 332, activeAtFailover: true },
];

export function SosFlowMotionIllustration() {
  const { globalTheme } = useAppStore();
  const isLight = globalTheme !== 'dark';

  const [stage, setStage] = useState(0);
  const [countdownNum, setCountdownNum] = useState(10);
  const [paused, setPaused] = useState(false);

  // Respect prefers-reduced-motion automatically
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) setPaused(true);
    const onChange = (e: MediaQueryListEvent) => setPaused(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // Gentle auto-advancing story loop (3.6s per stage)
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setStage((prev) => (prev + 1) % FLOW_STAGES.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [paused]);

  // Smooth countdown visual tick during Stage 1 (10 -> 0)
  useEffect(() => {
    if (stage !== 1) {
      setCountdownNum(stage === 0 ? 10 : 0);
      return;
    }
    setCountdownNum(10);
    if (paused) return;
    const tick = window.setInterval(() => {
      setCountdownNum((n) => (n > 1 ? n - 1 : 0));
    }, 320);
    return () => window.clearInterval(tick);
  }, [stage, paused]);

  const currentStage = FLOW_STAGES[stage];

  const sectionBg = isLight ? '#ffffff' : 'rgba(2, 6, 23, 0.85)';
  const canvasBg = isLight ? '#f8fafc' : '#060d1b';
  const nodeBg = isLight ? '#ffffff' : '#0f172a';
  const borderCol = isLight ? '#d1fae5' : 'rgba(51, 65, 85, 0.72)';
  const strokeMuted = isLight ? '#cbd5e1' : '#334155';
  const headingCol = isLight ? '#0f172a' : '#f8fafc';
  const mutedCol = isLight ? '#475569' : '#94a3b8';

  const ringCircumference = 2 * Math.PI * 38;
  const ringProgress = stage === 1 ? ((10 - countdownNum) / 10) * ringCircumference : stage > 1 ? ringCircumference : 0;

  return (
    <section
      id="sos-drill"
      data-testid="sos-flow-illustration"
      data-stage={stage}
      style={{
        padding: '64px 24px',
        background: sectionBg,
        borderTop: `1px solid ${borderCol}`,
        borderBottom: `1px solid ${borderCol}`,
      }}
    >
      <style>{`
        @keyframes slPulseRing {
          0% { transform: scale(0.85); opacity: 0.75; }
          100% { transform: scale(1.75); opacity: 0; }
        }
        @keyframes slDashFlow {
          from { stroke-dashoffset: 36; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes slPacketTravel {
          0% { opacity: 0; transform: translateX(0px); }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; transform: translateX(118px); }
        }
        .sl-ripple {
          transform-box: fill-box;
          transform-origin: center;
          animation: slPulseRing 1.8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        .sl-flow-line {
          stroke-dasharray: 6 6;
          animation: slDashFlow 1.1s linear infinite;
        }
        .sl-packet {
          animation: slPacketTravel 1.6s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .sl-ripple, .sl-flow-line, .sl-packet {
            animation: none !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
        {/* Header Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <div style={{ maxWidth: '660px' }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '.14em',
                color: '#059669',
                marginBottom: '8px',
                textTransform: 'uppercase',
              }}
            >
              01 · How Emergency Failover Works
            </div>
            <h2
              style={{
                fontSize: 'clamp(26px, 3.8vw, 38px)',
                fontWeight: 900,
                letterSpacing: '-.03em',
                color: headingCol,
                margin: '0 0 10px',
                textWrap: 'balance',
              }}
            >
              From Panic Trigger to Confirmed Dispatch
            </h2>
            <p style={{ fontSize: '14px', color: mutedCol, lineHeight: 1.6, margin: 0 }}>
              Every SOS follows one predictable path: a 10-second PIN-protected disarm window, followed by automatic failover down to R0-airtime Please Call Me when mobile data fails.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Play failover motion illustration' : 'Pause failover motion illustration'}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: `1px solid ${borderCol}`,
              background: canvasBg,
              color: headingCol,
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {paused ? 'Play Motion' : 'Pause Motion'}
          </button>
        </div>

        {/* Clean Single-Elevation Animated SVG Illustration Frame */}
        <div
          style={{
            background: canvasBg,
            border: `1px solid ${borderCol}`,
            borderRadius: '18px',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '20px 16px 12px', overflowX: 'hidden' }}>
            <svg
              viewBox="0 0 1040 410"
              role="img"
              aria-label="Animated illustration of the SafetyLink emergency flow from trigger to 10-second countdown, 5-tier R0-airtime failover, and confirmed responder dispatch"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            >
              <defs>
                <linearGradient id="slEmeraldFade" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="slAlertFade" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {/* Subtle architectural dot grid */}
              <pattern id="slGridDots" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill={isLight ? '#cbd5e1' : '#1e293b'} />
              </pattern>
              <rect x="0" y="0" width="1040" height="410" fill="url(#slGridDots)" opacity="0.65" />

              {/* ── CONNECTOR 1 -> 2 ── */}
              <line
                x1="212"
                y1="205"
                x2="318"
                y2="205"
                stroke={stage >= 1 ? '#ef4444' : strokeMuted}
                strokeWidth={stage === 0 || stage === 1 ? '2.5' : '1.5'}
                className={!paused && stage <= 1 ? 'sl-flow-line' : undefined}
              />
              {!paused && stage === 0 && (
                <circle cx="212" cy="205" r="5" fill="#ef4444" className="sl-packet" />
              )}

              {/* ── CONNECTOR 2 -> 3 (Fan out to 5 failover tiers) ── */}
              {FAILOVER_NODES.map((node) => {
                const isPcm = node.activeAtFailover;
                const activeLine = stage === 2 || stage === 3;
                const lineColor = !activeLine
                  ? strokeMuted
                  : isPcm
                    ? '#10b981'
                    : '#f59e0b';
                const pathD = `M 508 205 C 546 205, 546 ${node.y}, 584 ${node.y}`;
                return (
                  <g key={`in-${node.id}`}>
                    <path
                      id={`sl-path-in-${node.id}`}
                      d={pathD}
                      fill="none"
                      stroke={lineColor}
                      strokeWidth={activeLine && isPcm ? '2.6' : '1.4'}
                      opacity={!activeLine ? 0.55 : isPcm ? 1 : 0.45}
                      className={!paused && stage === 2 && isPcm ? 'sl-flow-line' : undefined}
                    />
                    {!paused && stage === 2 && isPcm && (
                      <circle r="4.5" fill="#10b981">
                        <animateMotion dur="1.3s" repeatCount="indefinite" path={pathD} />
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* ── CONNECTOR 3 -> 4 (Verified dispatch to Responders) ── */}
              {FAILOVER_NODES.map((node) => {
                const isPcm = node.activeAtFailover;
                const confirmed = stage === 3;
                const pathD = `M 762 ${node.y} C 796 ${node.y}, 796 205, 828 205`;
                return (
                  <g key={`out-${node.id}`}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke={confirmed && isPcm ? '#10b981' : strokeMuted}
                      strokeWidth={confirmed && isPcm ? '2.8' : '1.2'}
                      opacity={confirmed && isPcm ? 1 : 0.35}
                      className={!paused && confirmed && isPcm ? 'sl-flow-line' : undefined}
                    />
                    {!paused && confirmed && isPcm && (
                      <circle r="4.5" fill="#10b981">
                        <animateMotion dur="1.2s" repeatCount="indefinite" path={pathD} />
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* ══════════════════════════════════════════════════
                  STAGE 1: TRIGGER (BLE iTAG + PHONE SOS)
              ══════════════════════════════════════════════════ */}
              <g transform="translate(36, 95)">
                <rect
                  x="0"
                  y="0"
                  width="176"
                  height="220"
                  rx="18"
                  fill={nodeBg}
                  stroke={stage === 0 ? '#ef4444' : borderCol}
                  strokeWidth={stage === 0 ? '2' : '1.2'}
                />
                <text
                  x="88"
                  y="28"
                  textAnchor="middle"
                  fill={stage === 0 ? '#ef4444' : mutedCol}
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  STEP 01 · TRIGGER
                </text>

                {/* Animated ripple rings around SOS button */}
                {stage === 0 && !paused && (
                  <>
                    <circle cx="88" cy="112" r="34" fill="none" stroke="#ef4444" strokeWidth="2" className="sl-ripple" />
                    <circle
                      cx="88"
                      cy="112"
                      r="34"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      className="sl-ripple"
                      style={{ animationDelay: '0.9s' }}
                    />
                  </>
                )}

                {/* Tactile SOS / BLE Keyfob illustration */}
                <circle
                  cx="88"
                  cy="112"
                  r="34"
                  fill={stage === 0 ? '#dc2626' : isLight ? '#fee2e2' : '#450a0a'}
                  stroke="#ef4444"
                  strokeWidth="2"
                />
                <text
                  x="88"
                  y="117"
                  textAnchor="middle"
                  fill={stage === 0 ? '#ffffff' : '#ef4444'}
                  fontSize="16"
                  fontWeight="900"
                  fontFamily="'Inter', system-ui, sans-serif"
                >
                  SOS
                </text>

                <text x="88" y="176" textAnchor="middle" fill={headingCol} fontSize="13" fontWeight="800">
                  BLE iTAG or App
                </text>
                <text x="88" y="195" textAnchor="middle" fill={mutedCol} fontSize="11">
                  Pocket click · 1-Tap trigger
                </text>
              </g>

              {/* ══════════════════════════════════════════════════
                  STAGE 2: 10-SECOND COUNTDOWN & PIN SHIELD
              ══════════════════════════════════════════════════ */}
              <g transform="translate(318, 72)">
                <rect
                  x="0"
                  y="0"
                  width="190"
                  height="266"
                  rx="22"
                  fill={nodeBg}
                  stroke={stage === 1 ? '#f59e0b' : borderCol}
                  strokeWidth={stage === 1 ? '2' : '1.2'}
                />
                {/* Phone speaker bar */}
                <rect x="74" y="14" width="42" height="4" rx="2" fill={strokeMuted} />

                <text
                  x="95"
                  y="40"
                  textAnchor="middle"
                  fill={stage === 1 ? '#f59e0b' : mutedCol}
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  STEP 02 · 10s LOCK
                </text>

                {/* Radial 10-second countdown ring */}
                <g transform="translate(95, 114)">
                  <circle cx="0" cy="0" r="38" fill="none" stroke={strokeMuted} strokeWidth="6" opacity="0.4" />
                  <circle
                    cx="0"
                    cy="0"
                    r="38"
                    fill="none"
                    stroke={stage === 1 ? '#ef4444' : stage > 1 ? '#10b981' : strokeMuted}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringCircumference - ringProgress}
                    transform="rotate(-90)"
                    style={{ transition: 'stroke-dashoffset 0.28s linear, stroke 0.25s ease' }}
                  />
                  <text
                    x="0"
                    y="7"
                    textAnchor="middle"
                    fill={headingCol}
                    fontSize="22"
                    fontWeight="900"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {String(countdownNum).padStart(2, '0')}s
                  </text>
                </g>

                {/* Two PIN paths explained visually */}
                <rect
                  x="18"
                  y="174"
                  width="154"
                  height="32"
                  rx="8"
                  fill={isLight ? '#ecfdf5' : 'rgba(16,185,129,0.12)'}
                  stroke="rgba(16,185,129,0.45)"
                />
                <text x="95" y="194" textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="700">
                  Safety PIN → Safe Cancel
                </text>

                <rect
                  x="18"
                  y="214"
                  width="154"
                  height="32"
                  rx="8"
                  fill={isLight ? '#fffbeb' : 'rgba(245,158,11,0.12)'}
                  stroke="rgba(245,158,11,0.45)"
                />
                <text x="95" y="234" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="700">
                  Duress PIN → Silent SOS
                </text>
              </g>

              {/* ══════════════════════════════════════════════════
                  STAGE 3: 5-TIER FAILOVER LADDER (INCLUDING R0 PCM)
              ══════════════════════════════════════════════════ */}
              <g>
                <text
                  x="673"
                  y="54"
                  textAnchor="middle"
                  fill={stage === 2 ? '#10b981' : mutedCol}
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  STEP 03 · 5-TIER FAILOVER
                </text>

                {FAILOVER_NODES.map((node, idx) => {
                  const isPcm = node.activeAtFailover;
                  const isStageFailover = stage === 2 || stage === 3;
                  const stroke = !isStageFailover
                    ? borderCol
                    : isPcm
                      ? '#10b981'
                      : 'rgba(245,158,11,0.55)';
                  const badgeText = !isStageFailover
                    ? `T${idx + 1}`
                    : isPcm
                      ? 'SENT'
                      : '0 MB';
                  const badgeColor = !isStageFailover
                    ? mutedCol
                    : isPcm
                      ? '#10b981'
                      : '#f59e0b';

                  return (
                    <g key={node.id} transform={`translate(584, ${node.y - 22})`}>
                      <rect
                        x="0"
                        y="0"
                        width="178"
                        height="44"
                        rx="10"
                        fill={isStageFailover && isPcm ? (isLight ? '#ecfdf5' : 'rgba(16,185,129,0.16)') : nodeBg}
                        stroke={stroke}
                        strokeWidth={isStageFailover && isPcm ? '2' : '1.1'}
                      />
                      <text x="12" y="19" fill={headingCol} fontSize="11.5" fontWeight="800">
                        {node.label}
                      </text>
                      <text x="12" y="34" fill={mutedCol} fontSize="9.5" fontFamily="'JetBrains Mono', monospace">
                        {node.sub}
                      </text>
                      <text
                        x="166"
                        y="26"
                        textAnchor="end"
                        fill={badgeColor}
                        fontSize="10"
                        fontWeight="800"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        {badgeText}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* ══════════════════════════════════════════════════
                  STAGE 4: CONFIRMED RESPONDER & FAMILY DISPATCH
              ══════════════════════════════════════════════════ */}
              <g transform="translate(828, 95)">
                <rect
                  x="0"
                  y="0"
                  width="176"
                  height="220"
                  rx="18"
                  fill={nodeBg}
                  stroke={stage === 3 ? '#10b981' : borderCol}
                  strokeWidth={stage === 3 ? '2' : '1.2'}
                />
                <text
                  x="88"
                  y="28"
                  textAnchor="middle"
                  fill={stage === 3 ? '#10b981' : mutedCol}
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  STEP 04 · ALERTED
                </text>

                {stage === 3 && !paused && (
                  <circle cx="88" cy="108" r="32" fill="none" stroke="#10b981" strokeWidth="2" className="sl-ripple" />
                )}

                {/* Shield checkmark icon */}
                <path
                  d="M88 74 L116 86 V108 C116 127 104 141 88 148 C72 141 60 127 60 108 V86 Z"
                  fill={stage === 3 ? '#059669' : isLight ? '#d1fae5' : '#064e3b'}
                  stroke="#10b981"
                  strokeWidth="2"
                />
                <path
                  d="M77 110 L85 118 L100 101"
                  fill="none"
                  stroke={stage === 3 ? '#ffffff' : '#10b981'}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <text x="88" y="176" textAnchor="middle" fill={headingCol} fontSize="13" fontWeight="800">
                  Help Dispatched
                </text>
                <text x="88" y="195" textAnchor="middle" fill={mutedCol} fontSize="11">
                  Contacts + Control Deck
                </text>
              </g>
            </svg>
          </div>

          {/* Quiet 4-step storyboard strip underneath */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              borderTop: `1px solid ${borderCol}`,
            }}
          >
            {FLOW_STAGES.map((item, idx) => {
              const isActive = idx === stage;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStage(idx)}
                  aria-current={isActive ? 'step' : undefined}
                  style={{
                    textAlign: 'left',
                    padding: '16px 18px',
                    border: 'none',
                    borderRight: idx < FLOW_STAGES.length - 1 ? `1px solid ${borderCol}` : 'none',
                    background: isActive
                      ? isLight
                        ? '#ecfdf5'
                        : 'rgba(16, 185, 129, 0.10)'
                      : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: '11px',
                        fontWeight: 800,
                        color: isActive ? '#10b981' : mutedCol,
                      }}
                    >
                      {item.step}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: headingCol }}>
                      {item.title}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: mutedCol, lineHeight: 1.5, margin: 0 }}>
                    {item.caption}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accessible screen-reader announcement of active step */}
        <p className="sr-only" aria-live="polite">
          Step {currentStage.step}: {currentStage.title}. {currentStage.caption}
        </p>
      </div>
    </section>
  );
}
