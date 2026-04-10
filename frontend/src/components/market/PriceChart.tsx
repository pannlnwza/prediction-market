function generatePriceHistory(endPct: number): number[] {
  const len = 40;
  const pts: number[] = [];
  let val = 50 + (Math.random() - 0.5) * 20;
  for (let i = 0; i < len; i++) {
    const progress = i / (len - 1);
    const target = 50 + (endPct - 50) * progress;
    val += (target - val) * 0.12 + (Math.random() - 0.5) * 5;
    val = Math.max(2, Math.min(98, val));
    pts.push(Math.round(val));
  }
  pts[pts.length - 1] = endPct;
  return pts;
}

export function PriceChart({ yesPercent }: { yesPercent: number }) {
  const points = generatePriceHistory(yesPercent);
  const w = 600, h = 180, padY = 10;

  const minVal = Math.max(0, Math.min(...points) - 5);
  const maxVal = Math.min(100, Math.max(...points) + 5);
  const range = maxVal - minVal || 1;

  const toY = (val: number) => padY + (1 - (val - minVal) / range) * (h - padY * 2);
  const line = points.map((p, i) => `${(i / (points.length - 1)) * w},${toY(p)}`).join(' ');
  const area = `0,${h} ${line} ${w},${h}`;

  const ticks: number[] = [];
  const step = range > 30 ? 10 : range > 10 ? 5 : 2;
  for (let v = Math.ceil(minVal / step) * step; v <= maxVal; v += step) {
    ticks.push(v);
  }

  return (
    <div>
      {/* Time filters */}
      <div className="flex items-center gap-1 mb-3 justify-end">
        {['1H', '6H', '1D', '1W', '1M', 'ALL'].map((label, i) => (
          <button
            key={label}
            className={`px-2 py-1 text-[12px] font-semibold border-none cursor-pointer rounded transition-colors
              ${i === 5 ? 'text-gray-900 bg-transparent' : 'text-gray-400 bg-transparent hover:text-gray-600'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[220px]">
          {/* Grid lines + labels */}
          {ticks.map((v) => (
            <g key={v}>
              <line x1="0" y1={toY(v)} x2={w} y2={toY(v)} stroke="#f3f4f6" strokeWidth="1" />
              <text x={w + 5} y={toY(v) + 3} fill="#9ca3af" fontSize="9" textAnchor="start">{v}%</text>
            </g>
          ))}

          {/* Area */}
          <polygon points={area} fill="url(#chartGrad)" opacity="0.08" />

          {/* Line */}
          <polyline fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" points={line} />

          {/* End dot */}
          <circle cx={w} cy={toY(yesPercent)} r="3" fill="#2563eb" />

          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
        <span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span>
      </div>
    </div>
  );
}
