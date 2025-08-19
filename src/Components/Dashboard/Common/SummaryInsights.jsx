import React from 'react';
import { 
  Activity, CheckCircle, Wrench, TrendingUp, 
  Package, TrendingDown 
} from 'lucide-react';

const SummaryInsights = ({ activeTab, lastUpdated, currentStats, realTimeData }) => {
  return (
    <div className="summary-card">
      <div className="summary-header">
        <h3>Fleet Insights - {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Summary</h3>
        <span className="summary-period">{lastUpdated}</span>
      </div>
      <div className="summary-content">
        <div className="insight-grid">
          <div className="insight-item">
            <div className="insight-icon primary">
              <Activity size={24} />
            </div>
            <div className="insight-text">
              <h4>Total Operations</h4>
              <p><strong>{currentStats.total}</strong> fleet operations recorded this {activeTab} period</p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon success">
              <CheckCircle size={24} />
            </div>
            <div className="insight-text">
              <h4>Service Efficiency</h4>
              <p><strong>{currentStats.collections['Service History']}</strong> services completed with <strong>95%</strong> efficiency rate</p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon warning">
              <Wrench size={24} />
            </div>
            <div className="insight-text">
              <h4>Maintenance Status</h4>
              <p><strong>{currentStats.collections['Maintenance History']}</strong> maintenance tasks completed, <strong>{realTimeData?.pendingMaintenance || 0}</strong> pending</p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon info">
              <TrendingUp size={24} />
            </div>
            <div className="insight-text">
              <h4>Fleet Performance</h4>
              <p>Overall fleet efficiency is at <strong>{realTimeData?.efficiency || 95}%</strong> with excellent operational standards</p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon accent">
              <Package size={24} />
            </div>
            <div className="insight-text">
              <h4>Stock Management</h4>
              <p><strong>{realTimeData?.stockMetrics?.totalStockItems || 0}</strong> items tracked with <strong>${(realTimeData?.stockMetrics?.totalStockValue || 0).toLocaleString()}</strong> total value</p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon warning">
              <TrendingDown size={24} />
            </div>
            <div className="insight-text">
              <h4>Stock Alerts</h4>
              <p><strong>{realTimeData?.stockMetrics?.lowStockAlerts || 0}</strong> items need attention, <strong>{realTimeData?.stockMetrics?.recentMovements || 0}</strong> recent movements</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryInsights;