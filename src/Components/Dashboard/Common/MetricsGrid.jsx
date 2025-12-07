import React from 'react';
import {
  Activity, Wrench, AlertTriangle, Truck,
  Package, Archive, ArrowUp, ArrowDown, BarChart3,
  Car,
  Battery
} from 'lucide-react';

const MetricsGrid = ({ currentStats, realTimeData, COLORS }) => {
  return (
    <div className="metrics-grid">
      <div className="metric-card primary">
        <div className="metric-header">
          <Activity className="metric-icon" />
          <h3>Total Activities</h3>
        </div>
        <div className="metric-value">{currentStats.total}</div>
        <div className="metric-change positive">
          <ArrowUp size={14} />
          +12% from last period
        </div>
      </div>

      <div className="metric-card accent">
        <div className="metric-header">
          <Archive className="metric-icon" />
          <h3>Complaints Registed</h3>
        </div>
        <div className="metric-value">{currentStats.collections['Compliants']}</div>
        <div className="metric-change positive">
          <ArrowUp size={14} />
          Active tracking
        </div>
      </div>

      <div className="metric-card success">
        <div className="metric-header">
          <Wrench className="metric-icon" />
          <h3>Services Completed</h3>
        </div>
        <div className="metric-value">{currentStats.collections['Service Reports']}</div>
        <div className="metric-change positive">
          <ArrowUp size={14} />
          +8% efficiency
        </div>
      </div>

      <div className="metric-card warning">
        <div className="metric-header">
          <AlertTriangle className="metric-icon" />
          <h3>Major Maintenance</h3>
        </div>
        <div className="metric-value">{currentStats.collections['Maintenance History']}</div>
        <div className="metric-change neutral">
          <ArrowDown size={14} />
          -3% from last period
        </div>
      </div>

      <div className="metric-card warning">
        <div className="metric-header">
          <Car className="metric-icon" />
          <h3>Tyre Changes</h3>
        </div>
        <div className="metric-value">{currentStats.collections['Tyre History']}</div>
        <div className="metric-change neutral">
          <ArrowDown size={14} />
          -3% from last period
        </div>
      </div>

      <div className="metric-card warning">
        <div className="metric-header">
          <Battery className="metric-icon" />
          <h3>Battery Changes</h3>
        </div>
        <div className="metric-value">{currentStats.collections['Battery History']}</div>
        <div className="metric-change neutral">
          <ArrowDown size={14} />
          -3% from last period
        </div>
      </div>

      {/* <div className="metric-card info">
        <div className="metric-header">
          <Truck className="metric-icon" />
          <h3>Equipment Units</h3>
        </div>
        <div className="metric-value">{currentStats.collections['Equipment']}</div>
        <div className="metric-change positive">
          <ArrowUp size={14} />
          +2 new units
        </div>
      </div> */}

      <div className="metric-card accent">
        <div className="metric-header">
          <Package className="metric-icon" />
          <h3>Stock Inventory</h3>
        </div>
        <div className="metric-value">{currentStats.collections['Stock Items']}</div>
        <div className="metric-change positive">
          <ArrowUp size={14} />
          Active tracking
        </div>
      </div>

      <div className="metric-card accent">
        <div className="metric-header">
          <Archive className="metric-icon" />
          <h3>Toolkit Inventory</h3>
        </div>
        <div className="metric-value">{currentStats.collections['Toolkit Items']}</div>
        <div className="metric-change positive">
          <ArrowUp size={14} />
          Active tracking
        </div>
      </div>

      {/* <div className="metric-card danger">
        <div className="metric-header">
          <Archive className="metric-icon" />
          <h3>Stock Movements</h3>
        </div>
        <div className="metric-value">{realTimeData?.stockMetrics?.recentMovements || 0}</div>
        <div className="metric-change neutral">
          <BarChart3 size={14} />
          Recent activity
        </div>
      </div> */}
    </div>
  );
};

export default MetricsGrid;