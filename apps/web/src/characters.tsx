const avatars = [
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#f4a261" />
      <ellipse cx="32" cy="38" rx="14" ry="12" fill="#e76f51" />
      <path d="M18 16l10 6-8 6z" fill="#e63946" />
      <circle cx="27" cy="36" r="2" fill="#1d1d1d" />
      <circle cx="37" cy="36" r="2" fill="#1d1d1d" />
      <path d="M32 40l8 2-8 3z" fill="#ffe66d" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#1d3557" />
      <path d="M16 28c4-12 28-12 32 0v6H16z" fill="#e63946" />
      <circle cx="32" cy="38" r="12" fill="#f1faee" />
      <circle cx="28" cy="37" r="1.6" fill="#1d1d1d" />
      <circle cx="36" cy="37" r="1.6" fill="#1d1d1d" />
      <path d="M28 42c3 2 6 2 8 0" fill="none" stroke="#1d1d1d" strokeWidth="1.5" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#2a9d8f" />
      <circle cx="32" cy="30" r="8" fill="none" stroke="#f8f9fa" strokeWidth="4" />
      <path d="M32 38v14M24 48h16" stroke="#f8f9fa" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#ffb703" />
      <circle cx="32" cy="32" r="8" fill="#fb8500" />
      {Array.from({ length: 8 }, (_, index) => (
        <rect key={index} x="30" y="8" width="4" height="10" rx="2" fill="#fb8500" transform={`rotate(${index * 45} 32 32)`} />
      ))}
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#6d28d9" />
      <path d="M30 10h4l2 28h-8z" fill="#e0e7ff" />
      <path d="M22 38h20l-4 8H26z" fill="#fbbf24" />
      <circle cx="32" cy="18" r="3" fill="#fbbf24" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#606c38" />
      <rect x="18" y="16" width="28" height="32" rx="3" fill="#fefae0" />
      <path d="M22 24h20M22 30h14M22 36h18" stroke="#bc6c25" strokeWidth="2" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#111827" />
      <path d="M16 24h32v16c0 8-8 12-16 12S16 48 16 40z" fill="#1f2937" />
      <rect x="20" y="30" width="24" height="6" rx="2" fill="#f8fafc" />
      <circle cx="26" cy="33" r="1.4" fill="#111827" />
      <circle cx="38" cy="33" r="1.4" fill="#111827" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#b08968" />
      <circle cx="22" cy="18" r="7" fill="#7f5539" />
      <circle cx="42" cy="18" r="7" fill="#7f5539" />
      <circle cx="32" cy="36" r="14" fill="#ddb892" />
      <circle cx="27" cy="34" r="2" fill="#1d1d1d" />
      <circle cx="37" cy="34" r="2" fill="#1d1d1d" />
      <ellipse cx="32" cy="40" rx="3" ry="2" fill="#6f4e37" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#f77f00" />
      <circle cx="32" cy="34" r="14" fill="#fb923c" />
      <path d="M28 16c2 6 6 6 8 0" fill="#166534" />
      <path d="M24 32h4M36 32h4M28 40c3 3 6 3 8 0" stroke="#7c2d12" strokeWidth="2" fill="none" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#2563eb" />
      <path d="M32 12l8 18h-6v16h-4V30h-6z" fill="#f8fafc" />
      <circle cx="32" cy="22" r="3" fill="#facc15" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#fef3c7" />
      <ellipse cx="32" cy="40" rx="12" ry="10" fill="#f8fafc" />
      <ellipse cx="20" cy="28" rx="5" ry="8" fill="#f8fafc" />
      <ellipse cx="44" cy="28" rx="5" ry="8" fill="#f8fafc" />
      <circle cx="28" cy="38" r="1.6" fill="#1d1d1d" />
      <circle cx="36" cy="38" r="1.6" fill="#1d1d1d" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#94a3b8" />
      <rect x="18" y="20" width="28" height="22" rx="6" fill="#e2e8f0" />
      <circle cx="26" cy="30" r="3" fill="#38bdf8" />
      <circle cx="38" cy="30" r="3" fill="#38bdf8" />
      <rect x="26" y="38" width="12" height="3" rx="1" fill="#64748b" />
      <rect x="28" y="12" width="8" height="8" rx="2" fill="#cbd5e1" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#0f172a" />
      <circle cx="32" cy="30" r="12" fill="#f8fafc" />
      <circle cx="27" cy="28" r="2" fill="#0f172a" />
      <circle cx="37" cy="28" r="2" fill="#0f172a" />
      <path d="M26 34c4 3 8 3 12 0" fill="none" stroke="#0f172a" strokeWidth="1.5" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#7c3aed" />
      <path d="M26 16h12l-2 14h-8z" fill="#c4b5fd" />
      <rect x="24" y="30" width="16" height="16" rx="4" fill="#ddd6fe" />
      <circle cx="32" cy="38" r="3" fill="#7c3aed" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#22c55e" />
      <circle cx="32" cy="36" r="12" fill="#86efac" />
      <circle cx="22" cy="24" r="6" fill="#86efac" />
      <circle cx="42" cy="24" r="6" fill="#86efac" />
      <circle cx="28" cy="35" r="2" fill="#14532d" />
      <circle cx="36" cy="35" r="2" fill="#14532d" />
      <path d="M28 41h8" stroke="#14532d" strokeWidth="2" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#fb7185" />
      <path d="M18 40c4-14 24-14 28 0v6H18z" fill="#fff7ed" />
      <path d="M22 22l6 8M42 22l-6 8" stroke="#9a3412" strokeWidth="2" />
      <circle cx="27" cy="40" r="1.6" fill="#1d1d1d" />
      <circle cx="37" cy="40" r="1.6" fill="#1d1d1d" />
      <path d="M29 45c2 2 4 2 6 0" fill="none" stroke="#1d1d1d" strokeWidth="1.4" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#38bdf8" />
      <path d="M14 36l18-16 18 16-18 6z" fill="#f8fafc" />
      <path d="M32 20v18" stroke="#0ea5e9" strokeWidth="2" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#ef4444" />
      <path d="M16 36c2-16 30-16 32 0 0 10-6 16-16 16S16 46 16 36z" fill="#b91c1c" />
      <path d="M20 20c4 6 6 6 8-2M36 18c2 8 6 8 10-2" fill="#fca5a5" />
      <circle cx="26" cy="36" r="2" fill="#fef2f2" />
      <circle cx="38" cy="36" r="2" fill="#fef2f2" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#f59e0b" />
      <ellipse cx="32" cy="40" rx="14" ry="10" fill="#fde68a" />
      <circle cx="18" cy="34" r="6" fill="#fde68a" />
      <circle cx="46" cy="34" r="6" fill="#fde68a" />
      <circle cx="27" cy="38" r="2" fill="#1d1d1d" />
      <circle cx="37" cy="38" r="2" fill="#1d1d1d" />
      <ellipse cx="32" cy="43" rx="3" ry="2" fill="#92400e" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#facc15" />
      <path d="M20 28c0-8 24-8 24 0v10H20z" fill="#84cc16" />
      <circle cx="26" cy="32" r="2" fill="#1d1d1d" />
      <circle cx="38" cy="32" r="2" fill="#1d1d1d" />
      <path d="M24 42h16" stroke="#1d1d1d" strokeWidth="2" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#0284c7" />
      <circle cx="32" cy="34" r="14" fill="#e0f2fe" />
      <path d="M20 28c6-10 18-10 24 0" fill="#bae6fd" />
      <circle cx="32" cy="34" r="5" fill="#0c4a6e" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#fbbf24" />
      <ellipse cx="32" cy="36" rx="12" ry="10" fill="#1f2937" />
      <circle cx="32" cy="34" r="5" fill="#fbbf24" />
      <path d="M26 18l3 6M38 18l-3 6" stroke="#1f2937" strokeWidth="2" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#dc2626" />
      <circle cx="32" cy="32" r="14" fill="#ef4444" />
      <circle cx="32" cy="32" r="6" fill="#111827" />
      <circle cx="24" cy="22" r="3" fill="#111827" />
      <circle cx="42" cy="26" r="2.4" fill="#111827" />
      <circle cx="22" cy="40" r="2" fill="#111827" />
    </>
  ),
  () => (
    <>
      <circle cx="32" cy="32" r="32" fill="#111827" />
      <path d="M24 44c0-10 16-10 16 0v6H24z" fill="#f8fafc" />
      <rect x="28" y="14" width="8" height="16" rx="2" fill="#f8fafc" />
      <circle cx="32" cy="12" r="3" fill="#ef4444" />
    </>
  ),
];

export function characterIndex(name: string): number {
  let hash = 0;
  for (const char of name) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return hash % avatars.length;
}

export function Character({ name, size = 76 }: { name: string; size?: number }) {
  const draw = avatars[characterIndex(name)];
  return (
    <svg className="character" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <circle cx="32" cy="32" r="31" fill="#ffffff" />
      {draw()}
      <circle cx="32" cy="32" r="31" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="3" />
    </svg>
  );
}

export function Trophy({ place }: { place: number }) {
  const color = place === 1 ? '#ffe08a' : place === 2 ? '#e5e7eb' : '#f0b27a';
  return (
    <svg viewBox="0 0 64 64" width="54" height="54" aria-hidden="true">
      <path d="M18 12h28v8c0 10-6 18-14 18S18 30 18 20z" fill={color} stroke="#2a1248" strokeWidth="3" />
      <path d="M18 16H10c0 8 4 12 8 12M46 16h8c0 8-4 12-8 12" fill="none" stroke="#2a1248" strokeWidth="3" />
      <path d="M32 38v8M24 52h16M26 46h12" stroke="#2a1248" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
