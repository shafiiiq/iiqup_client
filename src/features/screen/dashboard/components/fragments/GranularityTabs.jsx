import React from 'react';
import { GRANULARITIES } from '../../constants/dashboard.constant';
import './DashboardPanels.css';

const GranularityTabs = ({ active, onChange, loading }) => (
  <div className="features screen dashboard panel-tabs">
    {GRANULARITIES.map((tab) => (
      <button
        key={tab.key}
        type="button"
        className={`features screen dashboard panel-tab${active === tab.key ? ' active' : ''}`}
        onClick={() => onChange(tab.key)}
        disabled={loading}
        title={tab.description}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default GranularityTabs;
