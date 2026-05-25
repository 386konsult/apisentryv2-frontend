import React, { useId } from 'react';

interface HeimdallAILogoProps {
  size?: number;
  className?: string;
  /** Renders in white — use when the logo sits on a dark/brand-coloured background */
  inverted?: boolean;
}

/**
 * Heimdall AI logo — standalone shield with sparkle inside.
 * No background container needed — the shield IS the visual.
 * Uses the brand gradient #2563eb → #06b6d4 (or white when inverted=true).
 */
const HeimdallAILogo: React.FC<HeimdallAILogoProps> = ({ size = 24, className = '', inverted = false }) => {
  const rawId = useId();
  const gId  = `hai-g-${rawId.replace(/:/g, '')}`;
  const gId2 = `hai-g2-${rawId.replace(/:/g, '')}`;

  const strokeFill = inverted ? 'white' : `url(#${gId})`;
  const shieldFill = inverted ? 'rgba(255,255,255,0.15)' : `url(#${gId2})`;
  const sparkFill  = inverted ? 'white' : `url(#${gId})`;
  const sparkOpacity1 = inverted ? '0.95' : '0.95';
  const sparkOpacity2 = inverted ? '0.7'  : '0.7';
  const sparkOpacity3 = inverted ? '0.5'  : '0.55';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Heimdall AI"
    >
      {!inverted && (
        <defs>
          {/* Main brand gradient — blue → cyan */}
          <linearGradient id={gId} x1="5" y1="3" x2="35" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563eb" />
            <stop offset="1" stopColor="#06b6d4" />
          </linearGradient>
          {/* Lighter fill gradient for shield body */}
          <linearGradient id={gId2} x1="5" y1="3" x2="35" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563eb" stopOpacity="0.12" />
            <stop offset="1" stopColor="#06b6d4" stopOpacity="0.08" />
          </linearGradient>
        </defs>
      )}

      {/* Shield body */}
      <path
        d="M20 3L5 9.5V19C5 28 11.8 35.8 20 38C28.2 35.8 35 28 35 19V9.5L20 3Z"
        fill={shieldFill}
        stroke={strokeFill}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* ── Large sparkle — 4-pointed star, centered at (20, 21) ── */}
      {/* Vertical arm */}
      <path
        d="M20 12 C20 12 21 17.5 21 20 C21 22.5 20 28 20 28 C20 28 19 22.5 19 20 C19 17.5 20 12 20 12Z"
        fill={sparkFill}
        fillOpacity={sparkOpacity1}
      />
      {/* Horizontal arm */}
      <path
        d="M12 20 C12 20 17.5 19 20 19 C22.5 19 28 20 28 20 C28 20 22.5 21 20 21 C17.5 21 12 20 12 20Z"
        fill={sparkFill}
        fillOpacity={sparkOpacity1}
      />

      {/* ── Small sparkle top-right ── */}
      <path
        d="M27.5 12.5 C27.5 12.5 28 14.3 28 15 C28 15.7 27.5 17.5 27.5 17.5 C27.5 17.5 27 15.7 27 15 C27 14.3 27.5 12.5 27.5 12.5Z"
        fill={sparkFill}
        fillOpacity={sparkOpacity2}
      />
      <path
        d="M24.5 15 C24.5 15 26.3 14.5 27 14.5 C27.7 14.5 29.5 15 29.5 15 C29.5 15 27.7 15.5 27 15.5 C26.3 15.5 24.5 15 24.5 15Z"
        fill={sparkFill}
        fillOpacity={sparkOpacity2}
      />

      {/* ── Tiny sparkle bottom-left ── */}
      <path
        d="M13 24 C13 24 13.4 25.2 13.4 25.6 C13.4 26 13 27.2 13 27.2 C13 27.2 12.6 26 12.6 25.6 C12.6 25.2 13 24 13 24Z"
        fill={sparkFill}
        fillOpacity={sparkOpacity3}
      />
      <path
        d="M11 25.6 C11 25.6 12.2 25.2 12.6 25.2 C13 25.2 14.2 25.6 14.2 25.6 C14.2 25.6 13 26 12.6 26 C12.2 26 11 25.6 11 25.6Z"
        fill={sparkFill}
        fillOpacity={sparkOpacity3}
      />
    </svg>
  );
};

export default HeimdallAILogo;
