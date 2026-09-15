import React from 'react';
import { toDisplayLabel } from '../../helper/dashboard.format.helper';
import { getStatusColor } from '../../constants/dashboard.constant';
import './DashboardPanels.css';

const BreakdownPanel = ({ title, subtitle, values, loading }) => (
  <div className="features screen dashboard panel-card">
    <div className="features screen dashboard panel-card-header">
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>

    {loading ? (
      <div className="features screen dashboard panel-empty"><p>Loading…</p></div>
    ) : values?.length > 0 ? (
      <div className="features screen dashboard panel-health-grid">
        {values.map((entry) => (
          <div key={String(entry.value)} className="features screen dashboard panel-health-card">
            <div className="features screen dashboard panel-health-info">
              <h4 style={{ color: getStatusColor(entry.value) }}>{toDisplayLabel(String(entry.value))}</h4>
            </div>
            <span className="features screen dashboard panel-health-count">{entry.count}</span>
          </div>
        ))}
      </div>
    ) : (
      <div className="features screen dashboard panel-empty"><p>No data available</p></div>
    )}
  </div>
);

export default BreakdownPanel;
