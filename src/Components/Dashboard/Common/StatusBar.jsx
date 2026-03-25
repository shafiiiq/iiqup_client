import React from 'react';
import { Truck, CheckCircle, Clock, Wrench, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatusBar = ({ realTimeData }) => {
  if (!realTimeData) return null;

  const items = [
    {
      icon:    <Truck className="status-icon" />,
      value:   realTimeData.totalEquipment,
      label:   'Total Equipment',
      link:    '/equipments',
    },
    {
      icon:    <CheckCircle className="status-icon success" />,
      value:   realTimeData.activeEquipment,
      label:   'Active Units',
      link:    null,
    },
    {
      icon:    <Clock className="status-icon warning" />,
      value:   realTimeData.idleEquipment,
      label:   'Idle Units',
      link:    null,
    },
    {
      icon:    <Wrench className="status-icon danger" />,
      value:   realTimeData.inMaintenance,
      label:   'In Maintenance',
      link:    null,
    },
    {
      icon:    <TrendingUp className="status-icon info" />,
      value:   `${realTimeData.efficiency}%`,
      label:   'Fleet Efficiency',
      link:    null,
    },
  ];

  return (
    <div className="status-bar">
      {items.map(({ icon, value, label, link }) => {
        const content = (
          <div className="complaints-item">
            {icon}
            <div className="status-content">
              <span className="status-value">{value ?? 0}</span>
              <span className="status-label">{label}</span>
              {link && <span className="status-view">Click to view</span>}
            </div>
          </div>
        );

        return link ? (
          <Link key={label} to={link} className="status-item">{content}</Link>
        ) : (
          <div key={label} className="status-item">{content}</div>
        );
      })}
    </div>
  );
};

export default StatusBar;