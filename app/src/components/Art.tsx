import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';

// Placeholder artwork approximating the board's logo and village banner.
// Swap these two components for image assets once the final ones arrive.

export function Logo({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <ClipPath id="logoClip">
          <Circle cx="50" cy="50" r="48" />
        </ClipPath>
        <LinearGradient id="logoSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#BFE4FF" />
          <Stop offset="1" stopColor="#F2FAFF" />
        </LinearGradient>
      </Defs>
      <G clipPath="url(#logoClip)">
        <Rect width="100" height="100" fill="url(#logoSky)" />
        <Circle cx="66" cy="27" r="11" fill="#FDB813" />
        <Path d="M0 62 Q25 36 50 56 T100 48 V100 H0Z" fill="#8CCB6E" />
        <Path d="M0 74 Q30 58 55 72 T100 66 V100 H0Z" fill="#3E9E45" />
        <Circle cx="22" cy="58" r="9" fill="#2F8F3A" />
        <Rect x="21" y="64" width="2.5" height="9" fill="#7A4F21" />
        <Circle cx="80" cy="60" r="8" fill="#2F8F3A" />
        <Rect x="79" y="66" width="2.5" height="8" fill="#7A4F21" />
        <Rect x="36" y="52" width="28" height="19" fill="#FFF6E5" />
        <Polygon points="31,54 50,37 69,54" fill="#D9412F" />
        <Rect x="47" y="60" width="6" height="11" fill="#8A5A2B" />
        <Rect x="39" y="57" width="5" height="5" fill="#4FA3E0" />
        <Rect x="56" y="57" width="5" height="5" fill="#4FA3E0" />
        <Path d="M0 84 Q50 72 100 84 V100 H0Z" fill="#2E7D32" />
      </G>
      <Circle cx="50" cy="50" r="48" fill="none" stroke="#2E7D32" strokeWidth="2.5" />
    </Svg>
  );
}

function House({ x, y, s = 1, roof = '#D9412F' }: { x: number; y: number; s?: number; roof?: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x="0" y="10" width="26" height="16" fill="#FFF6E5" />
      <Polygon points="-4,11 13,-2 30,11" fill={roof} />
      <Rect x="10" y="16" width="6" height="10" fill="#8A5A2B" />
      <Rect x="3" y="14" width="4.5" height="4.5" fill="#4FA3E0" />
      <Rect x="18.5" y="14" width="4.5" height="4.5" fill="#4FA3E0" />
    </G>
  );
}

function Tree({ x, y, r = 9 }: { x: number; y: number; r?: number }) {
  return (
    <G>
      <Rect x={x - 1.2} y={y} width="2.4" height={r * 1.3} fill="#7A4F21" />
      <Circle cx={x} cy={y - r * 0.2} r={r} fill="#2F8F3A" />
      <Circle cx={x - r * 0.5} cy={y + r * 0.3} r={r * 0.7} fill="#3BA247" />
    </G>
  );
}

export function Banner({ height = 170 }: { height?: number }) {
  return (
    <Svg width="100%" height={height} viewBox="0 0 360 170" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="bannerSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9FD4FF" />
          <Stop offset="1" stopColor="#EAF6FF" />
        </LinearGradient>
        <LinearGradient id="bannerFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <Stop offset="0.75" stopColor="#FFFFFF" stopOpacity="0.92" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect width="360" height="170" fill="url(#bannerSky)" />
      <Circle cx="180" cy="30" r="26" fill="#FFD55A" opacity="0.3" />
      <Circle cx="180" cy="30" r="15" fill="#FFC83D" />
      <Ellipse cx="70" cy="28" rx="26" ry="8" fill="#FFFFFF" opacity="0.9" />
      <Ellipse cx="92" cy="22" rx="18" ry="7" fill="#FFFFFF" opacity="0.9" />
      <Path d="M0 84 L46 44 L84 72 L130 34 L186 78 L236 46 L290 80 L330 54 L360 72 V170 H0Z" fill="#8DB6DD" />
      <Path d="M130 34 L143 46 L122 44Z M236 46 L247 55 L228 54Z M46 44 L56 53 L39 52Z" fill="#FFFFFF" opacity="0.7" />
      <Path d="M0 96 Q60 62 120 88 T240 82 T360 90 V170 H0Z" fill="#86CC70" />
      <Path d="M0 112 Q90 84 180 106 T360 100 V170 H0Z" fill="#4CAF50" />
      <Tree x={36} y={96} r={10} />
      <Tree x={318} y={92} r={11} />
      <Tree x={250} y={98} r={8} />
      <Tree x={104} y={100} r={7} />
      <House x={58} y={86} s={0.9} roof="#C8562B" />
      <House x={270} y={84} s={0.95} roof="#C8562B" />
      <House x={160} y={72} s={1.45} />
      <Rect x="0" y="92" width="360" height="78" fill="url(#bannerFade)" />
    </Svg>
  );
}
