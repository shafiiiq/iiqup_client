import React from 'react';
import { Truck, CheckCircle, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import './WelcomeHeader.css';

const ICONS = { Truck, CheckCircle, TrendingUp, TrendingDown, Layers };

const WelcomeHeader = ({ title, subtitle, stats, extra }) => (
  <div className="features screen dashboard welcome-header">
    <div className="features screen dashboard welcome-header-copy">
      <h1 className="features screen dashboard welcome-header-title">{title}</h1>
      <p className="features screen dashboard welcome-header-subtitle">{subtitle}</p>
    </div>

    <div className="features screen dashboard welcome-header-right">
      {extra}
      {!!stats?.length && (
        <div className="features screen dashboard welcome-header-stats">
          {stats.map((stat) => {
            const Icon = ICONS[stat.icon] || Layers;
            return (
              <div key={stat.key} className="features screen dashboard welcome-header-stat">
                <div className="features screen dashboard welcome-header-stat-label">
                  <Icon size={15} strokeWidth={2} />
                  <span>{stat.label}</span>
                </div>
                <span className="features screen dashboard welcome-header-stat-value">{stat.value}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

export default WelcomeHeader;
