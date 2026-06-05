function clampNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getMaxValue(data) {
  return Math.max(...data.map((item) => clampNumber(item.value)), 1);
}

function buildTicks(maxValue, count = 4) {
  return Array.from({ length: count + 1 }, (_, index) =>
    Math.round((maxValue / count) * index)
  );
}

function defaultNumber(value) {
  return new Intl.NumberFormat("en-US").format(clampNumber(value));
}

export function SaasBarChart({
  data,
  color = "purple",
  title = "Bar chart",
  xAxisLabel = "Category",
  yAxisLabel = "Value",
  valueFormatter = defaultNumber,
}) {
  const chartData = Array.isArray(data) ? data : [];
  const maxValue = getMaxValue(chartData);
  const ticks = buildTicks(maxValue, 4).reverse();

  if (!chartData.length) {
    return <p className="saas-chart-empty">No data available for this chart.</p>;
  }

  return (
    <figure className={`saas-chart-card saas-chart-card--${color}`}>
      <figcaption>
        <h3>{title}</h3>
        <p>{yAxisLabel} by {xAxisLabel}</p>
      </figcaption>
      <div className="saas-chart-layout" role="img" aria-label={`${title}: ${yAxisLabel} by ${xAxisLabel}`}>
        <div className="saas-chart-y-axis" aria-hidden="true">
          {ticks.map((tickValue) => (
            <span key={tickValue}>{valueFormatter(tickValue)}</span>
          ))}
        </div>
        <div className="saas-chart-plot">
          <div className="saas-chart-grid-lines" aria-hidden="true">
            {ticks.map((tickValue) => (
              <span key={tickValue} />
            ))}
          </div>
          <div className={`saas-chart saas-chart--${color}`} style={{ "--chart-columns": chartData.length }}>
            {chartData.map((item) => {
              const currentValue = clampNumber(item.value);
              const height = Math.max(8, Math.round((currentValue / maxValue) * 100));
              return (
                <div className="saas-chart__bar-item" key={item.label}>
                  <span className="saas-chart__bar-track" title={`${item.label}: ${valueFormatter(currentValue)}`}>
                    <span className="saas-chart__bar-fill" style={{ height: `${height}%` }} />
                  </span>
                  <span className="saas-chart__label">{item.label}</span>
                </div>
              );
            })}
          </div>
          <p className="saas-chart-axis-label">{xAxisLabel}</p>
        </div>
      </div>
    </figure>
  );
}

export function SaasTrendChart({
  data,
  title = "Trend chart",
  xAxisLabel = "Period",
  yAxisLabel = "Value",
  valueFormatter = defaultNumber,
}) {
  const chartData = Array.isArray(data) ? data : [];
  const maxValue = getMaxValue(chartData);
  const minValue = Math.min(...chartData.map((item) => clampNumber(item.value)), 0);
  const yRange = Math.max(maxValue - minValue, 1);
  const yTicks = buildTicks(maxValue, 4).reverse();

  if (!chartData.length) {
    return <p className="saas-chart-empty">No data available for this trend.</p>;
  }

  const points = chartData
    .map((item, index) => {
      const x = chartData.length === 1 ? 50 : (index / (chartData.length - 1)) * 100;
      const y = 100 - ((clampNumber(item.value) - minValue) / yRange) * 82 - 9;
      return { x, y, label: item.label, value: clampNumber(item.value) };
    });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = `0,100 ${polylinePoints} 100,100`;

  return (
    <figure className="saas-chart-card saas-chart-card--trend">
      <figcaption>
        <h3>{title}</h3>
        <p>{yAxisLabel} over {xAxisLabel}</p>
      </figcaption>
      <div className="saas-trend-chart" role="img" aria-label={`${title}: ${yAxisLabel} over ${xAxisLabel}`}>
        <div className="saas-trend-chart__grid" aria-hidden="true">
          {yTicks.map((tickValue) => (
            <span key={tickValue}>{valueFormatter(tickValue)}</span>
          ))}
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="saasTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7B2CBF" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#7B2CBF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline points={areaPoints} fill="url(#saasTrendFill)" stroke="none" />
          <polyline points={polylinePoints} fill="none" stroke="#7B2CBF" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          {points.map((point) => (
            <circle key={`${point.label}-${point.value}`} cx={point.x} cy={point.y} r="1.5" fill="#5A189A">
              <title>{`${point.label}: ${valueFormatter(point.value)}`}</title>
            </circle>
          ))}
        </svg>
        <div className="saas-trend-chart__axis">
          {chartData.map((item) => (
            <span key={item.label}>{item.label}</span>
          ))}
        </div>
        <p className="saas-chart-axis-label">{xAxisLabel}</p>
      </div>
    </figure>
  );
}

export function SaasDonutChart({
  data,
  title = "Distribution",
  centerLabel = "organizations",
}) {
  const chartData = Array.isArray(data) ? data : [];
  const total = chartData.reduce((sum, item) => sum + clampNumber(item.value), 0) || 1;
  const segments = chartData.reduce(
    (result, item) => {
      const value = (clampNumber(item.value) / total) * 100;
      return {
        offset: result.offset - value,
        items: [
          ...result.items,
          {
            label: item.label,
            color: item.color,
            value: clampNumber(item.value),
            percentage: Math.round((clampNumber(item.value) / total) * 100),
            dashArray: `${value} ${100 - value}`,
            strokeDashoffset: result.offset,
          },
        ],
      };
    },
    { offset: 25, items: [] }
  ).items;

  if (!chartData.length) {
    return <p className="saas-chart-empty">No data available for this distribution.</p>;
  }

  return (
    <figure className="saas-chart-card saas-chart-card--donut">
      <figcaption>
        <h3>{title}</h3>
        <p>Share by segment</p>
      </figcaption>
      <div className="saas-donut-block">
        <div className="saas-donut" role="img" aria-label={`${title} donut chart`}>
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
              >
                <title>{`${segment.label}: ${segment.value} (${segment.percentage}%)`}</title>
              </circle>
            ))}
          </svg>
          <div>
            <strong>{total}</strong>
            <span>{centerLabel}</span>
          </div>
        </div>
        <div className="saas-donut-legend">
          {segments.map((segment) => (
            <span key={segment.label}>
              <i style={{ background: segment.color }} />
              {segment.label}: {segment.value} ({segment.percentage}%)
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}

export default SaasBarChart;
