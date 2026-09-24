import React, { useState, useMemo, useRef } from 'react';

export interface DataPoint {
  timestamp: string;
  displayTime: string;
  value: number;
  value2?: number; // Optional secondary series (e.g. Battery temp vs Equipment temp)
}

interface TelemetryChartProps {
  title: string;
  subtitle?: string;
  unit: string;
  series1Name: string;
  series1Color: string;
  series2Name?: string;
  series2Color?: string;
  data: DataPoint[];
  thresholdLine?: {
    value: number;
    label: string;
    color: string;
  };
  secondaryThresholdLine?: {
    value: number;
    label: string;
    color: string;
  };
  height?: number;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  title,
  subtitle,
  unit,
  series1Name,
  series1Color,
  series2Name,
  series2Color = '#a78bfa',
  data,
  thresholdLine,
  secondaryThresholdLine,
  height = 200,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Compute scale boundaries
  const { minVal, maxVal, path1, path2, points1, points2, fillPath1 } = useMemo(() => {
    if (!data || data.length === 0) {
      return { minVal: 0, maxVal: 100, path1: '', path2: '', points1: [], points2: [], fillPath1: '' };
    }

    const allValues: number[] = [];
    data.forEach((d) => {
      allValues.push(d.value);
      if (d.value2 !== undefined) allValues.push(d.value2);
    });

    if (thresholdLine) allValues.push(thresholdLine.value);
    if (secondaryThresholdLine) allValues.push(secondaryThresholdLine.value);

    let rawMin = Math.min(...allValues);
    let rawMax = Math.max(...allValues);

    if (rawMin === rawMax) {
      rawMin -= 1;
      rawMax += 1;
    }

    // Add 10% breathing room top and bottom
    const range = rawMax - rawMin;
    const padding = range * 0.12;
    const computedMin = rawMin - padding;
    const computedMax = rawMax + padding;

    const width = 1000;
    const h = height;
    const padTop = 15;
    const padBottom = 25;
    const usableHeight = h - padTop - padBottom;

    const getY = (val: number) => {
      const norm = (val - computedMin) / (computedMax - computedMin);
      return h - padBottom - norm * usableHeight;
    };

    const getX = (idx: number) => {
      if (data.length <= 1) return 0;
      return (idx / (data.length - 1)) * width;
    };

    // Build series 1 points
    const pts1 = data.map((d, i) => ({ x: getX(i), y: getY(d.value), orig: d }));
    const dPath1 = pts1.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      // Smooth cubic bezier or line
      const prev = pts1[i - 1];
      const cx1 = prev.x + (pt.x - prev.x) / 3;
      const cy1 = prev.y;
      const cx2 = pt.x - (pt.x - prev.x) / 3;
      const cy2 = pt.y;
      return `${acc} C ${cx1.toFixed(1)},${cy1.toFixed(1)} ${cx2.toFixed(1)},${cy2.toFixed(1)} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }, '');

    // Fill path under series 1
    const baseLineY = h - padBottom;
    const fPath1 = pts1.length > 0
      ? `${dPath1} L ${pts1[pts1.length - 1].x.toFixed(1)},${baseLineY} L ${pts1[0].x.toFixed(1)},${baseLineY} Z`
      : '';

    // Build series 2 if present
    let dPath2 = '';
    let pts2: Array<{ x: number; y: number }> = [];
    if (series2Name && data.some((d) => d.value2 !== undefined)) {
      pts2 = data.map((d, i) => ({ x: getX(i), y: getY(d.value2 ?? d.value) }));
      dPath2 = pts2.reduce((acc, pt, i) => {
        if (i === 0) return `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
        const prev = pts2[i - 1];
        const cx1 = prev.x + (pt.x - prev.x) / 3;
        const cy1 = prev.y;
        const cx2 = pt.x - (pt.x - prev.x) / 3;
        const cy2 = pt.y;
        return `${acc} C ${cx1.toFixed(1)},${cy1.toFixed(1)} ${cx2.toFixed(1)},${cy2.toFixed(1)} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      }, '');
    }

    return {
      minVal: computedMin,
      maxVal: computedMax,
      path1: dPath1,
      path2: dPath2,
      points1: pts1,
      points2: pts2,
      fillPath1: fPath1,
    };
  }, [data, thresholdLine, secondaryThresholdLine, height, series2Name]);

  const latestPoint = data.length > 0 ? data[data.length - 1] : null;
  const activePoint = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : latestPoint;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || data.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const index = Math.round(ratio * (data.length - 1));
    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const width = 1000;
  const padTop = 15;
  const padBottom = 25;
  const usableHeight = height - padTop - padBottom;
  const getY = (val: number) => {
    if (maxVal === minVal) return height / 2;
    const norm = (val - minVal) / (maxVal - minVal);
    return height - padBottom - norm * usableHeight;
  };

  const gradientId = `grad-${title.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between">
      {/* Chart Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              {title}
            </span>
            {subtitle && (
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                {subtitle}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-bold font-mono text-slate-100">
              {activePoint ? activePoint.value.toFixed(2) : '--'}
            </span>
            <span className="text-xs text-slate-400">{unit}</span>
            {series2Name && activePoint && activePoint.value2 !== undefined && (
              <span className="text-sm font-mono text-cyan-400 ml-2">
                / {activePoint.value2.toFixed(2)} {unit}
              </span>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: series1Color }}
            />
            <span className="text-slate-300">{series1Name}</span>
          </div>
          {series2Name && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: series2Color }}
              />
              <span className="text-cyan-300">{series2Name}</span>
            </div>
          )}
          {thresholdLine && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-0.5"
                style={{ backgroundColor: thresholdLine.color }}
              />
              <span className="text-slate-400 text-[10px]">{thresholdLine.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Container with Interactive Hover */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full cursor-crosshair select-none"
        style={{ height }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={series1Color} stopOpacity="0.28" />
              <stop offset="90%" stopColor={series1Color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1="0"
            y1={padTop}
            x2={width}
            y2={padTop}
            stroke="#1e293b"
            strokeDasharray="4,4"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1={padTop + usableHeight * 0.33}
            x2={width}
            y2={padTop + usableHeight * 0.33}
            stroke="#1e293b"
            strokeDasharray="4,4"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1={padTop + usableHeight * 0.66}
            x2={width}
            y2={padTop + usableHeight * 0.66}
            stroke="#1e293b"
            strokeDasharray="4,4"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1={height - padBottom}
            x2={width}
            y2={height - padBottom}
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Threshold reference lines */}
          {thresholdLine && (
            <g>
              <line
                x1="0"
                y1={getY(thresholdLine.value)}
                x2={width}
                y2={getY(thresholdLine.value)}
                stroke={thresholdLine.color}
                strokeDasharray="6,4"
                strokeWidth="1.5"
                opacity="0.85"
              />
              <text
                x="8"
                y={getY(thresholdLine.value) - 4}
                fill={thresholdLine.color}
                fontSize="10"
                fontFamily="monospace"
                opacity="0.9"
              >
                {thresholdLine.label} ({thresholdLine.value} {unit})
              </text>
            </g>
          )}

          {secondaryThresholdLine && (
            <g>
              <line
                x1="0"
                y1={getY(secondaryThresholdLine.value)}
                x2={width}
                y2={getY(secondaryThresholdLine.value)}
                stroke={secondaryThresholdLine.color}
                strokeDasharray="4,4"
                strokeWidth="1.2"
                opacity="0.75"
              />
              <text
                x={width - 8}
                textAnchor="end"
                y={getY(secondaryThresholdLine.value) - 4}
                fill={secondaryThresholdLine.color}
                fontSize="9"
                fontFamily="monospace"
              >
                {secondaryThresholdLine.label} ({secondaryThresholdLine.value} {unit})
              </text>
            </g>
          )}

          {/* Area fill for series 1 */}
          {fillPath1 && <path d={fillPath1} fill={`url(#${gradientId})`} />}

          {/* Series 1 Stroke */}
          {path1 && (
            <path
              d={path1}
              fill="none"
              stroke={series1Color}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Series 2 Stroke if available */}
          {path2 && (
            <path
              d={path2}
              fill="none"
              stroke={series2Color}
              strokeWidth="1.8"
              strokeDasharray="3,2"
              strokeLinecap="round"
            />
          )}

          {/* Hover Scrub line & Dot */}
          {hoverIndex !== null && points1[hoverIndex] && (
            <g>
              <line
                x1={points1[hoverIndex].x}
                y1={padTop}
                x2={points1[hoverIndex].x}
                y2={height - padBottom}
                stroke="#64748b"
                strokeWidth="1.2"
                strokeDasharray="2,2"
              />
              <circle
                cx={points1[hoverIndex].x}
                cy={points1[hoverIndex].y}
                r="4.5"
                fill={series1Color}
                stroke="#0f172a"
                strokeWidth="2"
              />
              {points2[hoverIndex] && (
                <circle
                  cx={points2[hoverIndex].x}
                  cy={points2[hoverIndex].y}
                  r="3.5"
                  fill={series2Color}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
              )}
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoverIndex !== null && activePoint && points1[hoverIndex] && (
          <div
            className="absolute top-1 pointer-events-none bg-slate-950/95 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono text-slate-200 shadow-2xl z-20"
            style={{
              left: `${Math.min(85, Math.max(10, (hoverIndex / (data.length - 1)) * 100))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="text-slate-400 text-[10px]">{activePoint.displayTime}</div>
            <div className="font-semibold text-white">
              {series1Name}: {activePoint.value.toFixed(2)} {unit}
            </div>
            {series2Name && activePoint.value2 !== undefined && (
              <div className="text-cyan-400">
                {series2Name}: {activePoint.value2.toFixed(2)} {unit}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Time axis footer labels */}
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-1 pt-1 border-t border-slate-800/60">
        <span>{data.length > 0 ? data[0].displayTime : '--:--:--'}</span>
        <span className="text-slate-600">LIVE TELEMETRY WINDOW</span>
        <span>{latestPoint ? latestPoint.displayTime : '--:--:--'}</span>
      </div>
    </div>
  );
};
