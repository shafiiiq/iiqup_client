import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { toDisplayLabel } from '../../helper/dashboard.format.helper';
import { COLORS, DIRECTION_COLOR } from '../../constants/dashboard.constant';
import './DashboardPanels.css';
import './TrendSparklineGrid.css';

const sumSeriesByKey = (series, key) => series.reduce((sum, point) => sum + (point.counts[key] || 0), 0);

const TrendSparklineGrid = ({ series, collections, limit = 6 }) => {
  const ranked = [...collections]
    .map((entry) => ({ ...entry, total: sumSeriesByKey(series, entry.key) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .filter((entry) => entry.total > 0);

  return (
    <div className="features screen dashboard panel-card">
      <div className="features screen dashboard panel-card-header">
        <h3>Collection Trends</h3>
        <p>Top {ranked.length || 0} most active collections this period</p>
      </div>

      {ranked.length > 0 ? (
        <div className="features screen dashboard sparkline-grid">
          {ranked.map(({ key, label, direction, total }) => {
            const data = series.map((point) => ({ value: point.counts[key] || 0 }));
            const color = DIRECTION_COLOR[direction] || COLORS.info;
            return (
              <div key={key} className="features screen dashboard sparkline-card">
                <div className="features screen dashboard sparkline-header">
                  <span>{toDisplayLabel(label)}</span>
                  <strong>{total}</strong>
                </div>
                <ResponsiveContainer width="100%" height={48}>
                  <AreaChart data={data}>
                    <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.25} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="features screen dashboard panel-empty"><p>No activity yet this period</p></div>
      )}
    </div>
  );
};

export default TrendSparklineGrid;
