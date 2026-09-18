import React from "react";

export function VolumeChart({ data }: { data: { d: string; v: number }[] }) {
  const W = 560;
  const H = 180;
  const pad = { top: 16, right: 16, bottom: 32, left: 52 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;
  const maxV = Math.max(...data.map((d) => d.v), 1);
  const cx = (i: number) => pad.left + (i / Math.max(data.length - 1, 1)) * iW;
  const cy = (v: number) => pad.top + (1 - Math.min(v / maxV, 1)) * iH;
  const linePts = data.map((d, i) => `${cx(i)},${cy(d.v)}`).join(" L ");
  const areaPath = `M ${linePts} L ${cx(data.length - 1)},${pad.top + iH} L ${cx(0)},${pad.top + iH} Z`;

  const yTicks = [
    0,
    Number((maxV * 0.25).toFixed(1)),
    Number((maxV * 0.5).toFixed(1)),
    Number((maxV * 0.75).toFixed(1)),
    maxV,
  ];

  const fmtChartY = (v: number) => {
    if (maxV >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
    if (maxV >= 1_000) return `₦${(v / 1_000).toFixed(0)}k`;
    return `₦${Math.round(v)}`;
  };

  const xLabelStep = Math.max(1, Math.floor(data.length / 6));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 180 }}>
      <defs>
        <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7B3FE4" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#7B3FE4" stopOpacity={0} />
        </linearGradient>
      </defs>
      {yTicks.slice(1).map((v, i) => (
        <line
          key={i}
          x1={pad.left}
          x2={W - pad.right}
          y1={cy(v)}
          y2={cy(v)}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={1}
        />
      ))}
      {yTicks.map((v, i) => (
        <text key={i} x={pad.left - 6} y={cy(v) + 4} textAnchor="end" fontSize={10} fill="#8B86A8">
          {fmtChartY(v)}
        </text>
      ))}
      {data.map((d, i) => {
        const showLabel = i % xLabelStep === 0 || i === data.length - 1;
        if (!showLabel) return null;
        return (
          <text key={d.d + i} x={cx(i)} y={H - 8} textAnchor="middle" fontSize={10} fill="#8B86A8">
            {d.d}
          </text>
        );
      })}
      <path d={areaPath} fill="url(#volGrad)" />
      <polyline points={linePts} fill="none" stroke="#7B3FE4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={`dot-${i}`} cx={cx(i)} cy={cy(d.v)} r={i === data.length - 1 ? 3.5 : 2} fill="#7B3FE4" />
      ))}
    </svg>
  );
}
