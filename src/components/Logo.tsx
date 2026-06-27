import React from "react";

interface LogoProps {
  className?: string;
  size?: number; // width/height of the icon portion
  variant?: "full" | "icon-only" | "stacked";
  mode?: "light" | "dark" | "colors";
}

export default function Logo({
  className = "",
  size = 40,
  variant = "full",
  mode = "colors"
}: LogoProps) {
  // Brand Colors
  const shieldColor = mode === "light" ? "#1e293b" : "#1a365d"; // Slate or Deep Blue
  const linkColor = "#10b981"; // Emerald Green
  const textColor = mode === "light" ? "#0f172a" : "#ffffff";
  const subtextColor = mode === "light" ? "#64748b" : "#94a3b8";

  // Reusable SVG Icon markup
  const renderIcon = () => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* SHIELD BACKGROUND PATH */}
      <path
        d="M50 85C50 85 80 66 80 43V20L50 12L20 20V43C20 66 50 85 50 85Z"
        fill="#0f172a"
        stroke={shieldColor}
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* SHIELD INNER STROKE WITH MASK GAP */}
      <path
        d="M50 78C50 78 74 61 74 41V23L50 16L26 23V41C26 61 50 78 50 78Z"
        stroke={shieldColor}
        strokeWidth="3"
        strokeOpacity="0.4"
        fill="none"
      />

      {/* GREEN LINK CHAIN / ARROW PATH (45 degrees tilt, layered on top) */}
      <g transform="translate(50, 50) rotate(-45) translate(-50, -50)">
        {/* Bottom Link Loop */}
        <rect
          x="30"
          y="52"
          width="16"
          height="32"
          rx="8"
          fill="none"
          stroke={linkColor}
          strokeWidth="6.5"
        />

        {/* Top Link Loop */}
        <rect
          x="44"
          y="28"
          width="16"
          height="32"
          rx="8"
          fill="none"
          stroke={linkColor}
          strokeWidth="6.5"
        />

        {/* Central linking joint */}
        <path
          d="M40 50H50V52H40V50Z"
          fill={linkColor}
        />

        {/* Arrow Head terminating at the top right of the rotated system */}
        <path
          d="M52 24 L52 14 L42 24 Z"
          fill={linkColor}
          transform="translate(4, -14) rotate(45)"
        />
      </g>
    </svg>
  );

  if (variant === "icon-only") {
    return <div className={`inline-flex items-center justify-center ${className}`}>{renderIcon()}</div>;
  }

  if (variant === "stacked") {
    return (
      <div className={`flex flex-col items-center text-center gap-2 ${className}`}>
        {renderIcon()}
        <div className="flex flex-col items-center">
          <span className="text-lg font-black tracking-wider uppercase font-sans text-white">
            SAFETY <span className="text-emerald-400">LINK</span>
          </span>
          <span className="text-[9px] font-medium tracking-widest text-slate-400 uppercase font-mono mt-0.5">
            TM Media Solutions
          </span>
        </div>
      </div>
    );
  }

  // Full Row Variant
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {renderIcon()}
      <div className="text-left font-sans leading-none">
        <h2 className="text-xl font-extrabold tracking-tight text-white uppercase flex items-center gap-1 font-sans">
          <span>SAFETY</span>
          <span className="text-emerald-400">LINK</span>
        </h2>
        <p className="text-[10px] font-medium tracking-widest text-slate-400 uppercase font-mono mt-1.5">
          TM Media Solutions
        </p>
      </div>
    </div>
  );
}
