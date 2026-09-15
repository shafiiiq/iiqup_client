import React from 'react';
import { Activity } from 'lucide-react';
import { toDisplayLabel } from '../../helper/dashboard.format.helper';
import './DashboardPanels.css';
import './MetricsGrid.css';

const MetricsGrid = ({ numbers }) => (
  <div className="features screen dashboard metrics-grid">
    <div className="features screen dashboard metrics-card primary">
      <Activity size={20} />
      <span className="features screen dashboard metrics-card-value">{numbers.total}</span>
      <span className="features screen dashboard metrics-card-label">Total Records</span>
    </div>

    {numbers.collections.map(({ key, label }) => (
      <div key={key} className="features screen dashboard metrics-card">
        <Activity size={20} />
        <span className="features screen dashboard metrics-card-value">{numbers.counts[key] || 0}</span>
        <span className="features screen dashboard metrics-card-label">{toDisplayLabel(label)}</span>
      </div>
    ))}
  </div>
);

export default MetricsGrid;
