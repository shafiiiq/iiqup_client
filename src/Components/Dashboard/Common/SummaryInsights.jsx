import React from 'react';
import { Activity, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { capitalize } from '../utils/formatters';

const SummaryInsights = ({ activeTab, lastUpdated, currentStats, realTimeData }) => {
  const icons = [Activity, TrendingUp, TrendingDown, AlertTriangle];

  return (
    <div className="summary-card">
      <div className="summary-header">
        <h3>Insights — {capitalize(activeTab)} Summary</h3>
        <span className="summary-period">{lastUpdated}</span>
      </div>
      <div className="summary-content">
        <div className="insight-grid">

          {/* Total */}
          <div className="insight-item">
            <div className="insight-icon primary">
              <Activity size={24} />
            </div>
            <div className="insight-text">
              <h4>Total Operations</h4>
              <p><strong>{currentStats.total}</strong> operations recorded this {activeTab} period</p>
            </div>
          </div>

          {/* One insight per collection — fully dynamic */}
          {Object.entries(currentStats.collections).map(([label, count], i) => {
            const Icon = icons[i % icons.length];
            return (
              <div key={label} className="insight-item">
                <div className="insight-icon info">
                  <Icon size={24} />
                </div>
                <div className="insight-text">
                  <h4>{label}</h4>
                  <p><strong>{count}</strong> records in this period</p>
                </div>
              </div>
            );
          })}

          {/* Fleet efficiency — from realtime */}
          <div className="insight-item">
            <div className="insight-icon success">
              <TrendingUp size={24} />
            </div>
            <div className="insight-text">
              <h4>Fleet Efficiency</h4>
              <p>Overall efficiency at <strong>{realTimeData?.efficiency ?? 0}%</strong></p>
            </div>
          </div>

          {/* Stock alerts — from realtime */}
          <div className="insight-item">
            <div className="insight-icon warning">
              <TrendingDown size={24} />
            </div>
            <div className="insight-text">
              <h4>Stock Alerts</h4>
              <p><strong>{realTimeData?.stockMetrics?.lowStockAlerts ?? 0}</strong> low stock items, <strong>{realTimeData?.stockMetrics?.totalStockItems ?? 0}</strong> total tracked</p>
            </div>
          </div>

          {/* Pending */}
          <div className="insight-item">
            <div className="insight-icon warning">
              <AlertTriangle size={24} />
            </div>
            <div className="insight-text">
              <h4>Pending Maintenance</h4>
              <p><strong>{realTimeData?.pendingMaintenance ?? 0}</strong> pending, <strong>{realTimeData?.criticalAlerts ?? 0}</strong> critical</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SummaryInsights;