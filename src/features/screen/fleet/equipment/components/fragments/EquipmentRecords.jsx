import { useEffect, useState } from 'react';
import { apiRequest } from '@/features/core/network/api/api.request';

const MAINTENANCE_COLORS = {
  oil: '#f59e0b',
  normal: '#3b82f6',
  major: '#ef4444',
  battery: '#8b5cf6',
  tyre: '#10b981',
};

function DonutChart({ data, size = 180, strokeWidth = 26 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  if (!total) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-primary, #333)"
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {data.map((d) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const gap = circumference - dash;
          const offset = -cumulative * circumference;
          cumulative += fraction;
          return (
            <circle
              key={d.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </g>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fleet equipment records donut-total"
      >
        {total}
      </text>
    </svg>
  );
}

function BarChart({ data, height = 160 }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="fleet equipment records bar-chart" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="fleet equipment records bar-column">
          <div className="fleet equipment records bar-value">{d.value}</div>
          <div
            className="fleet equipment records bar"
            style={{ height: `${max ? (d.value / max) * 100 : 0}%`, background: d.color }}
          />
          <div className="fleet equipment records bar-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function TopList({ title, items, unitLabel }) {
  return (
    <div className="fleet equipment records card">
      <h3 className="fleet equipment records card-title">{title}</h3>
      {items.length === 0 ? (
        <div className="fleet equipment records empty">No data yet</div>
      ) : (
        <ol className="fleet equipment records top-list">
          {items.map((item, index) => (
            <li key={item.regNo} className="fleet equipment records top-list-item">
              <span className="fleet equipment records top-list-rank">{index + 1}</span>
              <span className="fleet equipment records top-list-name">
                {item.machine} · {item.regNo}
              </span>
              <span className="fleet equipment records top-list-value">
                {item.value} {unitLabel}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="fleet equipment records stat-card" style={{ '--stat-accent': accent }}>
      <div className="fleet equipment records stat-value">{value}</div>
      <div className="fleet equipment records stat-label">{label}</div>
    </div>
  );
}

const readEquipmentMetric = (equipment, key) => {
  const [group, field] = key.split('.');
  if (group === 'maintenance') return equipment.maintenanceRecord?.[field] || 0;
  if (group === 'mobilizations') return equipment.mobilizationsRecord?.[field] || 0;
  if (group === 'replacements') return equipment.replacementRecord?.[field] || 0;
  return 0;
};

const COMPARISON_METRICS = [
  { key: 'maintenance.oil', label: 'Oil Services' },
  { key: 'maintenance.normal', label: 'Normal Services' },
  { key: 'maintenance.major', label: 'Major Services' },
  { key: 'maintenance.battery', label: 'Battery Services' },
  { key: 'maintenance.tyre', label: 'Tyre Services' },
  { key: 'mobilizations.mobilization', label: 'Mobilizations' },
  { key: 'mobilizations.demobilization', label: 'Demobilizations' },
  { key: 'replacements.equipmentReplacement', label: 'Replacements' },
];

const COMPARISON_BAR_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

function MetricBarRow({ metric, comparedEquipment }) {
  const values = comparedEquipment.map((equipment) => readEquipmentMetric(equipment, metric.key));
  const maxValue = Math.max(...values, 1);

  return (
    <div className="fleet equipment records comparison-bar-row">
      <span className="fleet equipment records comparison-bar-label">{metric.label}</span>
      <div className="fleet equipment records comparison-bar-track-group">
        {comparedEquipment.map((equipment, index) => (
          <div key={equipment.regNo} className="fleet equipment records comparison-bar-track">
            <div
              className="fleet equipment records comparison-bar-fill"
              style={{
                width: `${(values[index] / maxValue) * 100}%`,
                backgroundColor: COMPARISON_BAR_COLORS[index % COMPARISON_BAR_COLORS.length],
              }}
            />
            <span className="fleet equipment records comparison-bar-value">{values[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonSection({ comparedEquipment, isLoading, onRemove, onClear }) {
  if (isLoading) {
    return <div className="fleet equipment records loading">Loading equipment statistics...</div>;
  }
  if (!comparedEquipment.length) return null;

  return (
    <div className="fleet equipment records comparison">
      <div className="fleet equipment records comparison-header">
        <h3 className="fleet equipment records card-title">
          {comparedEquipment.length > 1 ? 'Equipment Comparison' : 'Equipment Statistics'}
        </h3>
        <button className="fleet equipment records comparison-clear" onClick={onClear}>Clear All</button>
      </div>

      <div className="fleet equipment records comparison-chips">
        {comparedEquipment.map((equipment) => (
          <div key={equipment.regNo} className="fleet equipment records comparison-chip">
            <span>{equipment.machine} · {equipment.regNo}</span>
            <button onClick={() => onRemove(equipment.regNo)}>
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>
        ))}
      </div>

      <div className="fleet equipment records comparison-bars">
        {COMPARISON_METRICS.map((metric) => (
          <MetricBarRow key={metric.key} metric={metric} comparedEquipment={comparedEquipment} />
        ))}
      </div>

      <div className="fleet equipment records comparison-table-wrap">
        <table className="fleet equipment records comparison-table">
          <thead>
            <tr>
              <th>Detail</th>
              {comparedEquipment.map((equipment) => (
                <th key={equipment.regNo}>{equipment.machine} ({equipment.regNo})</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Status</td>
              {comparedEquipment.map((equipment) => (
                <td key={equipment.regNo}>{equipment.status}</td>
              ))}
            </tr>
            <tr>
              <td>Site</td>
              {comparedEquipment.map((equipment) => (
                <td key={equipment.regNo}>{equipment.site?.at(-1) || 'N/A'}</td>
              ))}
            </tr>
            <tr>
              <td>Remarks</td>
              {comparedEquipment.map((equipment) => (
                <td key={equipment.regNo}>{equipment.remarks || '—'}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EquipmentRecords({ comparedEquipment = [], isLoadingComparedEquipment = false, onRemoveCompared, onClearCompared }) {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchSummary = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await apiRequest(`/equipments/records-summary?hired=own`, 'GET');
        const data = await response.json();
        if (!isMounted) return;
        if (data.ok) setSummary(data.data);
        else setError(data.message || 'Failed to load records summary');
      } catch (err) {
        if (isMounted) setError('Error loading records summary: ' + err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <div className="fleet equipment records loading">Loading records...</div>;
  }

  if (error) {
    return <div className="fleet equipment records error">{error}</div>;
  }

  if (!summary) return null;

  const maintenanceData = [
    { label: 'Oil', value: summary.maintenance.oil, color: MAINTENANCE_COLORS.oil },
    { label: 'Normal', value: summary.maintenance.normal, color: MAINTENANCE_COLORS.normal },
    { label: 'Major', value: summary.maintenance.major, color: MAINTENANCE_COLORS.major },
    { label: 'Battery', value: summary.maintenance.battery, color: MAINTENANCE_COLORS.battery },
    { label: 'Tyre', value: summary.maintenance.tyre, color: MAINTENANCE_COLORS.tyre },
  ];

  const mobilizationData = [
    { label: 'Mobilized', value: summary.mobilizations.mobilization, color: '#22c55e' },
    { label: 'Demobilized', value: summary.mobilizations.demobilization, color: '#f97316' },
  ];

  return (
    <>
      <ComparisonSection
        comparedEquipment={comparedEquipment}
        isLoading={isLoadingComparedEquipment}
        onRemove={onRemoveCompared}
        onClear={onClearCompared}
      />

      {comparedEquipment.length === 0 && summary && (
        <div className="fleet equipment records masonry">
          <StatCard label="Equipment Tracked" value={summary.equipmentCount} accent="#3b82f6" />
          <StatCard label="Total Maintenance Jobs" value={summary.maintenance.total} accent="#f59e0b" />
          <StatCard label="Total Mobilizations" value={summary.mobilizations.mobilization} accent="#22c55e" />
          <StatCard label="Total Demobilizations" value={summary.mobilizations.demobilization} accent="#f97316" />
          <StatCard label="Equipment Replacements" value={summary.replacements.equipmentReplacement} accent="#a855f7" />

          <div className="fleet equipment records card">
            <h3 className="fleet equipment records card-title">Maintenance Breakdown</h3>
            <div className="fleet equipment records donut-wrap">
              <DonutChart data={maintenanceData} />
              <ul className="fleet equipment records legend">
                {maintenanceData.map((d) => (
                  <li key={d.label} className="fleet equipment records legend-item">
                    <span className="fleet equipment records legend-dot" style={{ background: d.color }} />
                    {d.label} — {d.value}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="fleet equipment records card">
            <h3 className="fleet equipment records card-title">Mobilization vs Demobilization</h3>
            <BarChart data={mobilizationData} />
          </div>

          <TopList title="Top 5 — Most Serviced" items={summary.topMaintenance} unitLabel="jobs" />
          <TopList title="Top 5 — Most Mobilized" items={summary.topMobilizations} unitLabel="events" />
          <TopList title="Top 5 — Most Replaced" items={summary.topReplacements} unitLabel="replacements" />
        </div>
      )}
    </>
  );
}

export default EquipmentRecords;