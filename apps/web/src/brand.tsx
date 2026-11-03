export function Logo({ size = 42 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="36" r="20" fill="#071422" stroke="#f4f7fb" strokeWidth="2.4" />
      <path d="M14 28h36l-4-3.2L32 14 18 24.8 14 28z" fill="#f4f7fb" />
      <path d="M32 14v-5" stroke="#f4f7fb" strokeWidth="2" />
      <circle cx="32" cy="8" r="2.3" fill="#3b82f6" />
      <circle cx="24.5" cy="36" r="6.2" fill="#f4f7fb" />
      <circle cx="39.5" cy="36" r="6.2" fill="#f4f7fb" />
      <circle cx="25.2" cy="36.4" r="2.5" fill="#071422" />
      <circle cx="40.2" cy="36.4" r="2.5" fill="#071422" />
      <path d="M29.2 44.2 32 48.2 34.8 44.2z" fill="#f6b73c" />
      <path d="M22 48.5c2.4 3 6 4.6 10 4.6s7.6-1.6 10-4.6" fill="none" stroke="#f4f7fb" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LinkMascot({ size = 148 }: { size?: number }) {
  return (
    <svg className="link-mascot" width={size} height={size} viewBox="0 0 160 160" aria-label="Link, el búho de ProfeLink">
      <circle cx="80" cy="82" r="70" fill="#10203a" stroke="rgba(255,255,255,0.16)" />
      <path d="M38 62h84l-8-8L80 28 46 54l-8 8z" fill="#f4f7fb" />
      <path d="M48 54c16-36 62-38 82-2l-14 8c-14-24-48-24-62 0z" fill="#e23b4a" />
      <circle cx="124" cy="50" r="9" fill="#f4f7fb" />
      <path d="M80 28V18" stroke="#f4f7fb" strokeWidth="3" />
      <circle cx="80" cy="16" r="4" fill="#3b82f6" />
      <ellipse cx="80" cy="92" rx="38" ry="34" fill="#f4f7fb" />
      <circle cx="64" cy="86" r="14" fill="#10203a" />
      <circle cx="96" cy="86" r="14" fill="#10203a" />
      <circle cx="66" cy="86" r="5" fill="#f4f7fb" />
      <circle cx="98" cy="86" r="5" fill="#f4f7fb" />
      <path d="M74 100h12l-6 8z" fill="#f6b73c" />
      <path d="M48 84c0-16 8-24 16-24M112 84c0-16-8-24-16-24" fill="none" stroke="#7eb6ff" strokeWidth="3" />
      <circle cx="118" cy="108" r="14" fill="#f6b73c" />
      <path d="M118 100v10M114 104h8" stroke="#10203a" strokeWidth="2" strokeLinecap="round" />
      <path d="M112 118h12" stroke="#f4f7fb" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const STARS: [number, number][] = [
  [80, 120], [180, 80], [260, 160], [160, 220],
  [420, 90], [520, 40], [610, 130], [500, 190],
  [860, 70], [980, 120], [900, 210], [780, 160],
  [140, 520], [260, 460], [340, 560], [200, 640],
  [720, 480], [860, 430], [940, 560], [760, 620],
  [980, 360], [1120, 300], [1160, 460], [1000, 500],
];

const FLAKES = Array.from({ length: 32 }, (_, index) => ({
  left: `${(index * 31) % 100}%`,
  delay: `${(index % 10) * 0.55}s`,
  duration: `${9 + (index % 8)}s`,
  size: index % 5 === 0 ? 16 : 5 + (index % 4) * 2,
  drift: index % 2 === 0 ? '8px' : '-10px',
  glyph: index % 5 === 0 ? '❄' : '•',
}));

export function NightSky() {
  return (
    <div className="holiday-sky" aria-hidden="true">
      <svg className="night-sky holiday-back" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <g className="constellation" fill="none" stroke="#7eb6ff" strokeWidth="1.2">
          <path d="M80 120 L180 80 L260 160 L160 220 Z" />
          <path d="M420 90 L520 40 L610 130 L500 190 Z" />
          <path d="M860 70 L980 120 L900 210 L780 160 Z" />
          <path d="M140 520 L260 460 L340 560 L200 640 Z" />
          <path d="M720 480 L860 430 L940 560 L760 620 Z" />
          <path d="M980 360 L1120 300 L1160 460 L1000 500 Z" />
        </g>
        {STARS.map(([x, y], index) => (
          <circle
            key={`${x}-${y}`}
            className="sky-star"
            cx={x}
            cy={y}
            r="3.2"
            fill="#dbeafe"
            style={{ animationDelay: `${(index % 7) * 0.35}s` }}
          />
        ))}
      </svg>
      <div className="holiday-front">
      <div className="xmas-lights">
        {Array.from({ length: 22 }, (_, index) => (
          <i key={index} style={{ animationDelay: `${index * 0.12}s` }} />
        ))}
      </div>
      <div className="snow">
        {FLAKES.map((flake, index) => (
          <span
            key={index}
            className={flake.glyph === '❄' ? 'snowflake big' : 'snowflake'}
            style={{
              left: flake.left,
              animationDelay: flake.delay,
              animationDuration: flake.duration,
              fontSize: flake.size,
              ['--drift' as string]: flake.drift,
            }}
          >
            {flake.glyph}
          </span>
        ))}
      </div>
      </div>
    </div>
  );
}
