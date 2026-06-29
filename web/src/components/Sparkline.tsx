/**
 * Sparkline — a lightweight SVG sparkline with no external dependencies.
 *
 * Props:
 *   values   — array of numbers to plot (needs ≥2 points to draw a line)
 *   width    — SVG width  (default 80)
 *   height   — SVG height (default 28)
 *   className — extra class names for the <svg> element
 */

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
}

/** Map an input value from [inMin, inMax] to [outMin, outMax]. */
function mapRange(
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (inMax === inMin) return (outMin + outMax) / 2;
  return ((v - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

export default function Sparkline({
  values,
  width = 80,
  height = 28,
  className = "",
}: SparklineProps) {
  // Need at least two data points to draw a meaningful line
  if (!values || values.length < 2) {
    return null;
  }

  const pad = 2; // px padding inside the SVG box
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Build the polyline points string
  const points = values
    .map((v, i) => {
      const x = mapRange(i, 0, values.length - 1, pad, width - pad);
      // SVG y-axis is top-down, so higher values → lower y coordinate
      const y = mapRange(v, min, max, height - pad, pad);
      return `${x},${y}`;
    })
    .join(" ");

  // Build a closed filled area path (line + baseline)
  const firstX = pad;
  const lastX = width - pad;
  const baseline = height - pad;

  const areaPoints = `${firstX},${baseline} ${points} ${lastX},${baseline}`;

  // Pick stroke colour based on trend: last vs first value
  const trending = values[values.length - 1] >= values[0];
  const strokeColor = trending
    ? "var(--aurora-bright, #34d399)"
    : "var(--nova-bright, #a78bfa)";
  const fillColor = trending
    ? "var(--aurora, #10b981)"
    : "var(--nova, #7c3aed)";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
      role="img"
    >
      {/* Filled area under the curve */}
      <polygon
        points={areaPoints}
        fill={fillColor}
        fillOpacity={0.12}
        strokeWidth={0}
      />
      {/* The trend line */}
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dot at the latest value */}
      {(() => {
        const lastIdx = values.length - 1;
        const cx = mapRange(lastIdx, 0, lastIdx, pad, width - pad);
        const cy = mapRange(values[lastIdx], min, max, height - pad, pad);
        return (
          <circle cx={cx} cy={cy} r={2.5} fill={strokeColor} strokeWidth={0} />
        );
      })()}
    </svg>
  );
}
