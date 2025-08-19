import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';

const DashboardHeader = ({ title, subtitle, currentDateTime, refreshing, handleRefresh }) => {
  return (
    <div className="dashboard-header">
      <div className="header-content">
        <h1 className="dashboard-title">{title}</h1>
        <p className="dashboard-subtitle">{subtitle}</p>
      </div>
      <div className="header-actions">
        <div className="datetime-display">
          <Calendar className="datetime-icon" />
          <span>{currentDateTime}</span>
        </div>
        <button
          onClick={handleRefresh}
          className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
          disabled={refreshing}
        >
          <RefreshCw size={16} />
          {refreshing ? 'Updating...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;