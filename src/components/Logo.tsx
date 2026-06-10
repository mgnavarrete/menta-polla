// Emblema de copa estilo Mundial (SVG propio). Reemplaza el ícono de pelota.
export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className="inline-block align-[-0.2em]"
    >
      <defs>
        <linearGradient id="copaGrad" x1="4" y1="3" x2="28" y2="29">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="55%" stopColor="#059669" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      {/* asas */}
      <path
        d="M9 7H5.5v3A4.5 4.5 0 0 0 10 14.5"
        stroke="url(#copaGrad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M23 7h3.5v3A4.5 4.5 0 0 1 22 14.5"
        stroke="url(#copaGrad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* copa */}
      <path d="M9 5h14v5a7 7 0 0 1-14 0V5Z" fill="url(#copaGrad)" />
      {/* tallo */}
      <rect x="14.4" y="16.3" width="3.2" height="5" rx="1.2" fill="url(#copaGrad)" />
      {/* base */}
      <path d="M11 21.8h10l1.3 3.6H9.7L11 21.8Z" fill="url(#copaGrad)" />
      <rect x="9.3" y="25.4" width="13.4" height="2.8" rx="1.4" fill="url(#copaGrad)" />
    </svg>
  );
}
