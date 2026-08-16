import React from 'react';
import { Clock } from 'lucide-react';
import { TABS } from '../../constants/color.constant';
import { capitalize } from '../../helper/formatter.helper';

const DashboardTabs = ({ activeTab, setActiveTab, loading }) => (
  <div className="dashboard-tabs">
    {TABS.map((tab) => (
      <button
        key={tab}
        className={`dashboard-tab ${activeTab === tab ? 'active' : ''}`}
        onClick={() => setActiveTab(tab)}
        disabled={loading}
      >
        <Clock size={16} />
        {capitalize(tab)} View
      </button>
    ))}
  </div>
);

export default DashboardTabs;