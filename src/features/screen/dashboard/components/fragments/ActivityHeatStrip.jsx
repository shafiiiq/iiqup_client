import React from 'react';
import './DashboardPanels.css';
import './ActivityHeatStrip.css';

const ActivityHeatStrip = ({ series }) => {
  const max = Math.max(...series.map((point) => point.total), 1);

  return (
    <div className="features screen dashboard panel-card">
      <div className="features screen dashboard panel-card-header">
        <h3>Activity Heat Strip</h3>
        <p>Relative volume per bucket this period</p>
      </div>
      <div className="features screen dashboard heat-strip">
        {series.map((point) => {
          const intensity = point.total / max;
          return (
            <div key={point.label} className="features screen dashboard heat-strip-cell" title={`${point.label}: ${point.total}`}>
              <div className="features screen dashboard heat-strip-fill" style={{ opacity: 0.12 + intensity * 0.88 }} />
              <span className="features screen dashboard heat-strip-value">{point.total}</span>
              <span className="features screen dashboard heat-strip-label">{point.label.slice(0, 4)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityHeatStrip;
