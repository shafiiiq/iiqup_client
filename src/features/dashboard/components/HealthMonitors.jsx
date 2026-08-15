import React from 'react';
import { getStatusColor } from '../utils/constants';

const HealthBar = ({ fill, label, status, extra }) => (
  <div className="health-card">
    <div className="health-info">
      <h4>{label}</h4>
      <span className={`health-status ${status.toLowerCase().replace('_', '-')}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    </div>
    <div className="health-meter">
      <div className="health-bar">
        <div
          className="health-fill"
          style={{ width: `${fill}%`, backgroundColor: getStatusColor(status) }}
        />
      </div>
      <span className="health-percentage">{extra}</span>
    </div>
  </div>
);

export const StockHealthMonitor = ({ stockHealth }) => {
  if (!stockHealth?.length) return null;
  return (
    <div className="health-dashboard">
      <div className="health-header">
        <h3>Stock Health Monitor</h3>
        <p>Real-time stock levels and status</p>
      </div>
      <div className="health-grid">
        {stockHealth.map((stock, i) => (
          <HealthBar
            key={i}
            label={`${stock.name} - ${stock.serialNumber}`}
            fill={stock.health}
            status={stock.status}
            extra={`${stock.currentStock}/${stock.minThreshold}`}
          />
        ))}
      </div>
    </div>
  );
};

export const ToolkitStatusMonitor = ({ toolkitStatus }) => {
  if (!toolkitStatus?.length) return null;
  return (
    <div className="health-dashboard">
      <div className="health-header">
        <h3>Toolkit Status Monitor</h3>
        <p>Real-time toolkit availability and status</p>
      </div>
      <div className="health-grid">
        {toolkitStatus.map((toolkit, i) => (
          <HealthBar
            key={i}
            label={toolkit.name}
            fill={toolkit.totalStock > 0 ? 100 : 0}
            status={toolkit.status}
            extra={`${toolkit.totalStock} items (${toolkit.variants} variants)`}
          />
        ))}
      </div>
    </div>
  );
};