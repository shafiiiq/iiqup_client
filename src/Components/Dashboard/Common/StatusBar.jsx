import React from 'react';
import {
  CheckCircle, AlertTriangle, TrendingUp, Package, TrendingDown,
  Truck,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const StatusBar = ({ realTimeData }) => {

  if (!realTimeData) return null;

  return (
    <div className="status-bar">
      <Link to="/equipments" className='status-item'>
        <div className="complaints-item">
          <Truck className="status-icon" />
          <div className="status-content">
            <span className="status-value">{realTimeData.totalEquipment}</span>
            <span className="status-label">Total Equipment</span>
          </div>
        </div>
      </Link>
      <div className="status-item">
        <CheckCircle className="status-icon success" />
        <div className="status-content">
          <span className="status-value">{realTimeData.activeEquipment}</span>
          <span className="status-label">Active Units</span>
        </div>
      </div>
      <Link to="/complaints" className='status-item'>
        <div className="complaints-item">
          <Wrench className="status-icon warning" />
          <div className="status-content">
            <span className="status-value">{realTimeData.pendingMaintenance}</span>
            <span className="status-label">Pending Maintenance</span>
            <br />
            <span className="status-view">Click to view</span>
          </div>
        </div>
      </Link>
      <div className="status-item">
        <AlertTriangle className="status-icon danger" />
        <div className="status-content">
          <span className="status-value">{realTimeData.criticalAlerts}</span>
          <span className="status-label">Critical Alerts</span>
        </div>
      </div>
      <div className="status-item">
        <TrendingUp className="status-icon info" />
        <div className="status-content">
          <span className="status-value">{realTimeData.efficiency}%</span>
          <span className="status-label">Fleet Efficiency</span>
        </div>
      </div>
      <div className="status-item">
        <Package className="status-icon info" />
        <div className="status-content">
          <span className="status-value">{realTimeData?.stockMetrics?.totalStockItems || 0}</span>
          <span className="status-label">Stock Items</span>
        </div>
      </div>
      <div className="status-item">
        <div className="status-icon success">
          QR
        </div>
        <div className="status-content">
          {/* <span className="status-value">{(realTimeData?.stockMetrics?.totalStockValue || 0).toLocaleString()}</span> */}
          <span className="status-label">Stock Value</span>
          <br />
          <span className="status-label">Not implemented</span>
        </div>
      </div>
      <div className="status-item">
        <TrendingDown className="status-icon warning" />
        <div className="status-content">
          <span className="status-value">{realTimeData?.stockMetrics?.lowStockAlerts || 0}</span>
          <span className="status-label">Low Stock Alerts</span>
        </div>
      </div>
      <Link to="/application-hr" className='status-item'>
        <div className="complaints-item">
          <TrendingDown className="status-icon warning" />
          <div className="status-content">
            <span className="status-value">{realTimeData.pendingApplications || 0}</span>
            <span className="status-label">Applications</span>
            <br />
            <span className="status-view">Click to view</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default StatusBar;