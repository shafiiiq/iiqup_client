import React from 'react';

const EquipmentHealth = ({ equipment }) => (
  <div className="health-dashboard">
    <div className="health-header">
      <h3>Equipment Health Monitor</h3>
      <p>Real-time health status of your fleet</p>
    </div>
    <div className="health-grid">
      {equipment.map((item, index) => (
        <HealthCard 
          key={index}
          name={item.name}
          health={item.health}
          status={item.status}
        />
      ))}
    </div>
  </div>
);

const HealthCard = ({ name, health, status }) => (
  <div className="health-card">
    <div className="health-info">
      <h4>{name}</h4>
      <span className={`health-status ${status.toLowerCase()}`}>
        {status}
      </span>
    </div>
    <div className="health-meter">
      <div className="health-bar">
        <div
          className="health-fill"
          style={{
            width: `${health}%`,
            backgroundColor: health > 80 ? '#10b981' :
              health > 60 ? '#f59e0b' : '#ef4444'
          }}
        ></div>
      </div>
      <span className="health-percentage">{health}%</span>
    </div>
  </div>
);

export default EquipmentHealth;