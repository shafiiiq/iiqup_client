import React from 'react';
import { Activity, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const MetricsGrid = ({ currentStats, realTimeData }) => {
  // Status bar items — these come from realTimeData (equipment API, not models)
  const statusItems = [
    { label: 'Total Equipment',    value: realTimeData?.totalEquipment     ?? 0 },
    { label: 'Active Units',       value: realTimeData?.activeEquipment    ?? 0 },
    { label: 'Idle Units',         value: realTimeData?.idleEquipment      ?? 0 },
    { label: 'Pending Complaints', value: realTimeData?.pendingMaintenance ?? 0 },
    { label: 'Critical Alerts',    value: realTimeData?.criticalAlerts     ?? 0 },
    { label: 'Fleet Efficiency',   value: `${realTimeData?.efficiency ?? 0}%`   },
  ];

  return (
    <div className="metrics-grid">
      {/* Total — always first */}
      <div className="metric-card primary">
        <div className="metric-header">
          <Activity className="metric-icon" />
          <h3>Total Activities</h3>
        </div>
        <div className="metric-value">{currentStats.total}</div>
        <div className="metric-change positive">
          <ArrowUp size={14} /> Active period
        </div>
      </div>

      {/* One card per collection — fully dynamic */}
      {Object.entries(currentStats.collections).map(([label, count], i) => (
        <div key={label} className="metric-card accent">
          <div className="metric-header">
            <Minus className="metric-icon" />
            <h3>{label}</h3>
          </div>
          <div className="metric-value">{count}</div>
          <div className="metric-change positive">
            <ArrowUp size={14} /> Active tracking
          </div>
        </div>
      ))}

      {/* Equipment/realtime stats */}
      {statusItems.map(({ label, value }) => (
        <div key={label} className="metric-card success">
          <div className="metric-header">
            <Activity className="metric-icon" />
            <h3>{label}</h3>
          </div>
          <div className="metric-value">{value}</div>
          <div className="metric-change positive">
            <ArrowUp size={14} /> Live
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsGrid;