function getMaxValue(data) {
  return Math.max(...data.map((item) => Number(item.value) || 0), 1);
}

export function SaasBarChart({ data, color = "purple" }) {
  const maxValue = getMaxValue(data);

  return (
    <div className={`saas-chart saas-chart--${color}`} role="img" aria-label="Bar chart">
      {data.map((item) => {
        const height = Math.max(8, Math.round((Number(item.value) / maxValue) * 100));

        return (
          <div className="saas-chart__bar-item" key={item.label}>
            <span className="saas-chart__bar-track">
              <span className="saas-chart__bar-fill" style={{ height: `${height}%` }} />
            </span>
            <span className="saas-chart__label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function SaasTrendChart({ data }) {
  const maxValue = getMaxValue(data);
  const points = data
    .map((item, index) => {
      const x = data.length === 1 ? 0 : (index / (data.length - 1)) * 100;
      const y = 100 - (Number(item.value) / maxValue) * 82 - 8;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div className="saas-trend-chart" role="img" aria-label="Trend chart">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="saasTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7B2CBF" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#7B2CBF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={areaPoints} fill="url(#saasTrendFill)" stroke="none" />
        <polyline points={points} fill="none" stroke="#7B2CBF" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="saas-trend-chart__axis">
        {data.map((item) => (
          <span key={item.label}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}

export function SaasDonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
  const segments = data.reduce(
    (result, item) => {
      const value = (Number(item.value) / total) * 100;
      return {
        offset: result.offset - value,
        items: [
          ...result.items,
          {
            label: item.label,
            color: item.color,
            dashArray: `${value} ${100 - value}`,
            strokeDashoffset: result.offset,
          },
        ],
      };
    },
    { offset: 25, items: [] }
  ).items;

  return (
    <div className="saas-donut-block">
      <div className="saas-donut" role="img" aria-label="Subscription distribution chart">
        <svg viewBox="0 0 42 42">
          <circle className="saas-donut__track" cx="21" cy="21" r="15.915" />
          {segments.map((segment) => (
            <circle
              key={segment.label}
              className="saas-donut__segment"
              cx="21"
              cy="21"
              r="15.915"
              stroke={segment.color}
              strokeDasharray={segment.dashArray}
              strokeDashoffset={segment.strokeDashoffset}
            />
          ))}
        </svg>
        <div>
          <strong>{total}</strong>
          <span>orgs</span>
        </div>
      </div>
      <div className="saas-donut-legend">
        {data.map((item) => (
          <span key={item.label}>
            <i style={{ background: item.color }} />
            {item.label}: {item.value}
          </span>
        ))}
      </div>
    </div>
  );
}

export default SaasBarChart;
