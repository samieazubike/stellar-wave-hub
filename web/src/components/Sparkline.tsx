"use client";

interface SparklineProps {
  /** Ordered list of numeric values (oldest → newest). */
  values: number[];
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Lightweight pure-SVG sparkline — no external chart library.
 *
 * Renders a smooth polyline + a subtle area fill. The stroke colour shifts
 * from aurora-green (up/flat trend) to supernova-red (down trend) so a
 * glance tells users whether a project's on-chain balance is growing.
 */
export default function Sparkline({
  values,
  width = 80,
  height = 28,
  className = "",
}: SparklineProps) {
  // Need at least 2 points to draw a line
  if (!values || values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // avoid /0 when all values are equal

  const padX = 2;
  const padY = 3;
  const drawW = width - padX * 2;
  const drawH = height - padY * 2;

  // Map value → SVG coordinate (y is flipped)
  const toX = (i: number) => padX + (i / (values.length - 1)) * drawW;
  const toY = (v: number) => padY + drawH - ((v - min) / range) * drawH;

  const points = values.map((v, i) => `${toX(i).toFixed(2)},${toY(v).toFixed(2)}`);
  const polyline = points.join(" ");

  // Closed path for the area fill (down to baseline, back to start)
  const baseline = padY + drawH;
  const areaPath =
    `M ${toX(0).toFixed(2)},${baseline} ` +
    points.map((p) => `L ${p}`).join(" ") +
    ` L ${toX(values.length - 1).toFixed(2)},${baseline} Z`;

  // Trend: compare last value to first
  const isUp = values[values.length - 1] >= values[0];
  // aurora = #10b981 (green), supernova = #ef4444 (red)
  const strokeColor = isUp ? "var(--aurora)" : "var(--supernova)";
  const fillColor = isUp ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.10)";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className={className}
      style={{ display: "block", overflow: "visible" }}
    >
      {/* Area fill */}
      <path d={areaPath} fill={fillColor} />

      {/* Trend line */}
      <polyline
        points={polyline}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dot at the latest data point */}
      <circle
        cx={toX(values.length - 1).toFixed(2)}
        cy={toY(values[values.length - 1]).toFixed(2)}
        r="2"
        fill={strokeColor}
      />
    </svg>
  );
}
