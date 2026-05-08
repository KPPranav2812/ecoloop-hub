// Tiny SVG-based pseudo QR (deterministic from id). Not a real QR, but visually convincing.
export function QRPlaceholder({ value, size = 96 }: { value: string; size?: number }) {
  const cells = 13;
  // hash to bit pattern
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  const bits: boolean[] = [];
  for (let i = 0; i < cells * cells; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    bits.push((h & 1) === 1);
  }
  const cs = size / cells;
  return (
    <svg width={size} height={size} className="rounded-md bg-white p-1">
      {bits.map((b, i) => {
        if (!b) return null;
        const x = (i % cells) * cs;
        const y = Math.floor(i / cells) * cs;
        return <rect key={i} x={x} y={y} width={cs} height={cs} fill="#0f172a" />;
      })}
      {/* finder squares */}
      {[
        [0, 0],
        [cells - 3, 0],
        [0, cells - 3],
      ].map(([fx, fy]) => (
        <g key={`${fx}-${fy}`}>
          <rect x={fx * cs} y={fy * cs} width={cs * 3} height={cs * 3} fill="#0f172a" />
          <rect
            x={fx * cs + cs * 0.5}
            y={fy * cs + cs * 0.5}
            width={cs * 2}
            height={cs * 2}
            fill="white"
          />
          <rect x={fx * cs + cs} y={fy * cs + cs} width={cs} height={cs} fill="#0f172a" />
        </g>
      ))}
    </svg>
  );
}
