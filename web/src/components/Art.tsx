// Placeholder artwork approximating the board's logo and village banner.
// Swap these two components for <img> tags once the final assets arrive.

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <clipPath id="logoClip"><circle cx="50" cy="50" r="48" /></clipPath>
        <linearGradient id="logoSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#BFE4FF" />
          <stop offset="1" stopColor="#F2FAFF" />
        </linearGradient>
      </defs>
      <g clipPath="url(#logoClip)">
        <rect width="100" height="100" fill="url(#logoSky)" />
        <circle cx="66" cy="27" r="11" fill="#FDB813" />
        <path d="M0 62 Q25 36 50 56 T100 48 V100 H0Z" fill="#8CCB6E" />
        <path d="M0 74 Q30 58 55 72 T100 66 V100 H0Z" fill="#3E9E45" />
        <circle cx="22" cy="58" r="9" fill="#2F8F3A" />
        <rect x="21" y="64" width="2.5" height="9" fill="#7A4F21" />
        <circle cx="80" cy="60" r="8" fill="#2F8F3A" />
        <rect x="79" y="66" width="2.5" height="8" fill="#7A4F21" />
        <rect x="36" y="52" width="28" height="19" fill="#FFF6E5" />
        <polygon points="31,54 50,37 69,54" fill="#D9412F" />
        <rect x="47" y="60" width="6" height="11" fill="#8A5A2B" />
        <rect x="39" y="57" width="5" height="5" fill="#4FA3E0" />
        <rect x="56" y="57" width="5" height="5" fill="#4FA3E0" />
        <path d="M0 84 Q50 72 100 84 V100 H0Z" fill="#2E7D32" />
      </g>
      <circle cx="50" cy="50" r="48" fill="none" stroke="#2E7D32" strokeWidth="2.5" />
    </svg>
  );
}

function House({ x, y, s = 1, roof = '#D9412F' }: { x: number; y: number; s?: number; roof?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="0" y="10" width="26" height="16" fill="#FFF6E5" />
      <polygon points="-4,11 13,-2 30,11" fill={roof} />
      <rect x="10" y="16" width="6" height="10" fill="#8A5A2B" />
      <rect x="3" y="14" width="4.5" height="4.5" fill="#4FA3E0" />
      <rect x="18.5" y="14" width="4.5" height="4.5" fill="#4FA3E0" />
    </g>
  );
}

function Tree({ x, y, r = 9 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <rect x={x - 1.2} y={y} width="2.4" height={r * 1.3} fill="#7A4F21" />
      <circle cx={x} cy={y - r * 0.2} r={r} fill="#2F8F3A" />
      <circle cx={x - r * 0.5} cy={y + r * 0.3} r={r * 0.7} fill="#3BA247" />
    </g>
  );
}

export function Banner() {
  return (
    <svg viewBox="0 0 360 200" role="img" aria-label="Roopawas village">
      <defs>
        <linearGradient id="bannerSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9FD4FF" />
          <stop offset="1" stopColor="#EAF6FF" />
        </linearGradient>
      </defs>
      <rect width="360" height="200" fill="url(#bannerSky)" />
      <circle cx="180" cy="34" r="26" fill="#FFD55A" opacity="0.3" />
      <circle cx="180" cy="34" r="15" fill="#FFC83D" />
      <ellipse cx="70" cy="30" rx="26" ry="8" fill="#FFFFFF" opacity="0.9" />
      <ellipse cx="92" cy="24" rx="18" ry="7" fill="#FFFFFF" opacity="0.9" />
      <ellipse cx="282" cy="26" rx="22" ry="7" fill="#FFFFFF" opacity="0.85" />
      <path d="M0 94 L46 54 L84 82 L130 44 L186 88 L236 56 L290 90 L330 64 L360 82 V200 H0Z" fill="#8DB6DD" />
      <path d="M130 44 L143 56 L122 54Z M236 56 L247 65 L228 64Z M46 54 L56 63 L39 62Z" fill="#FFFFFF" opacity="0.7" />
      <path d="M0 106 Q60 72 120 98 T240 92 T360 100 V200 H0Z" fill="#86CC70" />
      <path d="M0 122 Q90 94 180 116 T360 110 V200 H0Z" fill="#4CAF50" />
      <path d="M0 160 Q120 138 220 156 T360 150 V200 H0Z" fill="#3E9E45" />
      <path d="M150 200 Q168 160 176 126 L186 126 Q196 160 230 200Z" fill="#E8D9B5" />
      <Tree x={36} y={106} r={10} />
      <Tree x={318} y={102} r={11} />
      <Tree x={250} y={108} r={8} />
      <Tree x={104} y={110} r={7} />
      <Tree x={292} y={150} r={12} />
      <Tree x={58} y={154} r={12} />
      <House x={58} y={96} s={0.9} roof="#C8562B" />
      <House x={270} y={94} s={0.95} roof="#C8562B" />
      <House x={160} y={82} s={1.45} />
    </svg>
  );
}
