// DashboardTabs.js
import React from 'react';
import { Clock } from 'lucide-react';

const DashboardTabs = ({ activeTab, onTabChange }) => {
  const tabs = ['daily', 'weekly', 'monthly', 'yearly'];
  
  return (
    <div className="dashboard-tabs">
      {tabs.map(tab => (
        <button
          key={tab}
          className={`dashboard-tab ${activeTab === tab ? 'active' : ''}`}
          onClick={() => onTabChange(tab)}
        >
          <Clock size={16} />
          {tab.charAt(0).toUpperCase() + tab.slice(1)} View
        </button>
      ))}
    </div>
  );
};

export default DashboardTabs;