import React, { useId } from 'react';

interface HeimdallAILogoProps {
  size?: number;
  className?: string;
}

/**
 * Heimdall AI logo — shield with neural circuit spark.
 * Uses the brand gradient #2563eb → #06b6d4.
 * Each instance gets a unique gradient ID via useId() to avoid
 * SVG defs ID collisions when multiple logos appear on the same page.
 */
const HeimdallAILogo: React.FC<HeimdallAILogoProps> = ({ size = 24, className = '' }) => {
  const rawId = useId();
  // useId() returns strings like ":r0:" — strip colons so the ID is valid in url()
  const gId = `hai-g-${rawId.replace(/:/g, '')}`;

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
      <defs>
        <linearGradient id={gId} x1="4" y1="3" x2="36" y2="37" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>

      {/* Shield body */}
      <path
        d="M20 3L5 9.5V18.5C5 27.5 11.8 35.5 20 38C28.2 35.5 35 27.5 35 18.5V9.5L20 3Z"
        fill={`url(#${gId})`}
        fillOpacity="0.18"
        stroke={`url(#${gId})`}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      {/* Central neural node */}
      <circle cx="20" cy="19" r="2.5" fill={`url(#${gId})`} />

      {/* Satellite nodes */}
      <circle cx="20" cy="11.5" r="1.5" fill={`url(#${gId})`} fillOpacity="0.9" />
      <circle cx="28" cy="16"   r="1.5" fill={`url(#${gId})`} fillOpacity="0.85" />
      <circle cx="27" cy="25.5" r="1.4" fill={`url(#${gId})`} fillOpacity="0.75" />
      <circle cx="13" cy="16"   r="1.5" fill={`url(#${gId})`} fillOpacity="0.85" />
      <circle cx="13" cy="25.5" r="1.4" fill={`url(#${gId})`} fillOpacity="0.65" />

      {/* Connection lines */}
      <line x1="20"   y1="13"   x2="20"   y2="16.5" stroke={`url(#${gId})`} strokeWidth="1.1" strokeOpacity="0.6"  strokeLinecap="round" />
      <line x1="27"   y1="17"   x2="22.5" y2="18.2"  stroke={`url(#${gId})`} strokeWidth="1.1" strokeOpacity="0.6"  strokeLinecap="round" />
      <line x1="26.5" y1="24.7" x2="22"   y2="20.5"  stroke={`url(#${gId})`} strokeWidth="1.1" strokeOpacity="0.55" strokeLinecap="round" />
      <line x1="14"   y1="17"   x2="17.5" y2="18.2"  stroke={`url(#${gId})`} strokeWidth="1.1" strokeOpacity="0.6"  strokeLinecap="round" />
      <line x1="14.5" y1="24.7" x2="18"   y2="20.5"  stroke={`url(#${gId})`} strokeWidth="1.1" strokeOpacity="0.5"  strokeLinecap="round" />

      {/* AI spark / lightning bolt */}
      <path
        d="M22 9.5L18.5 15.5H21L19 22.5L25.5 14.5H22L23.5 9.5Z"
        fill={`url(#${gId})`}
        fillOpacity="0.32"
      />
    </svg>
  );
};

export default HeimdallAILogo;
