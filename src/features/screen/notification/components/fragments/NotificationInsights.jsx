import { formatCategoryLabel } from '../../helper/notification.helper';

const NotificationDonutChart = ({ data }) => {
  const total = data.reduce((sum, entry) => sum + entry.value, 0) || 1;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offsetAccumulator = 0;

  return (
    <svg viewBox="0 0 100 100" className="features screen notification chart-donut">
      <circle cx="50" cy="50" r={radius} className="features screen notification donut-track" />
      {data.map((entry) => {
        const fraction = entry.value / total;
        const dashLength = fraction * circumference;
        const dashOffset = circumference - offsetAccumulator;
        offsetAccumulator += dashLength;
        return (
          <circle
            key={entry.label}
            cx="50"
            cy="50"
            r={radius}
            className="features screen notification donut-segment"
            style={{
              stroke: entry.color,
              strokeDasharray: `${dashLength} ${circumference - dashLength}`,
              strokeDashoffset: dashOffset,
            }}
          />
        );
      })}
    </svg>
  );
};

const NotificationBarBreakdown = ({ data }) => {
  const max = Math.max(...data.map((entry) => entry.value), 1);
  return (
    <div className="features screen notification chart-bars">
      {data.map((entry) => (
        <div key={entry.label} className="features screen notification bar-row">
          <span className="features screen notification bar-label">{entry.label}</span>
          <div className="features screen notification bar-track">
            <div className="features screen notification bar-fill" style={{ width: `${(entry.value / max) * 100}%` }} />
          </div>
          <span className="features screen notification bar-value">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const NotificationTrendChart = ({ data }) => {
  const width = 220;
  const height = 70;
  const max = Math.max(...data.map((point) => point.value), 1);
  const stepX = width / Math.max(data.length - 1, 1);
  const points = data
    .map((point, index) => `${index * stepX},${height - (point.value / max) * height}`)
    .join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="features screen notification chart-trend">
        <polyline points={points} className="features screen notification trend-line" />
        {data.map((point, index) => (
          <circle
            key={point.label}
            cx={index * stepX}
            cy={height - (point.value / max) * height}
            r="2.5"
            className="features screen notification trend-dot"
          />
        ))}
      </svg>
      <div className="features screen notification insights-axis">
        {data.map((point) => (
          <span key={point.label} className="features screen notification axis-label">{point.label}</span>
        ))}
      </div>
    </div>
  );
};

const NotificationInsights = ({ stats, priorityBreakdown, categoryBreakdown, dailyTrend }) => {
  const priorityData = [
    { label: 'High', value: priorityBreakdown.high, color: '#ef4444' },
    { label: 'Medium', value: priorityBreakdown.medium, color: '#f97316' },
    { label: 'Low', value: priorityBreakdown.low, color: '#10b981' },
  ];

  const categoryData = categoryBreakdown.map(([label, value]) => ({ label: formatCategoryLabel(label), value }));

  return (
    <aside className="features screen notification insights">
      <div className="features screen notification insights-grid">
        <div className="features screen notification insights-card stat">
          <span className="features screen notification insights-value">{stats.total}</span>
          <span className="features screen notification insights-label">Total</span>
        </div>

        <div className="features screen notification insights-card stat">
          <span className="features screen notification insights-value">{stats.unread}</span>
          <span className="features screen notification insights-label">Unread</span>
        </div>

        <div className="features screen notification insights-card stat">
          <span className="features screen notification insights-value">{stats.forYouUnread}</span>
          <span className="features screen notification insights-label">For You</span>
        </div>

        <div className="features screen notification insights-card chart">
          <span className="features screen notification insights-title">Priority Mix</span>
          <NotificationDonutChart data={priorityData} />
          <div className="features screen notification insights-legend">
            {priorityData.map((entry) => (
              <span key={entry.label} className="features screen notification legend-item">
                <span className="features screen notification legend-dot" style={{ background: entry.color }} />
                {entry.label} · {entry.value}
              </span>
            ))}
          </div>
        </div>

        <div className="features screen notification insights-card chart">
          <span className="features screen notification insights-title">Top Categories</span>
          <NotificationBarBreakdown data={categoryData} />
        </div>

        <div className="features screen notification insights-card chart">
          <span className="features screen notification insights-title">Last 7 Days</span>
          <NotificationTrendChart data={dailyTrend} />
        </div>
      </div>
    </aside>
  );
};

export default NotificationInsights;