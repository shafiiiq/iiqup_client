import React from 'react';
import { Clock } from 'lucide-react';

const DashboardTabs = ({ activeTab, setActiveTab, tabs }) => {
  return (
    <div className="dashboard-tabs">
      {tabs.map(tab => (
        <button
          key={tab}
          className={`dashboard-tab ${activeTab === tab ? 'active' : ''}`}
          onClick={() => setActiveTab(tab)}
        >
          <Clock size={16} />
          {tab.charAt(0).toUpperCase() + tab.slice(1)} View
        </button>
      ))}
    </div>
  );
};

export default DashboardTabs;