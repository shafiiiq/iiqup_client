import React from 'react';
import { Layers, TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import './SpotlightRow.css';

const ICONS = { Layers, TrendingUp, TrendingDown, Trophy };

const SpotlightRow = ({ items }) => (
  <div className="features screen dashboard spotlight-row">
    {items.map((item) => {
      const Icon = ICONS[item.icon] || Layers;
      return (
        <div key={item.key} className={`features screen dashboard spotlight-card tone-${item.tone || 'neutral'}`}>
          <Icon size={18} />
          <span className="features screen dashboard spotlight-value">{item.value}</span>
          <span className="features screen dashboard spotlight-label">{item.label}</span>
        </div>
      );
    })}
  </div>
);

export default SpotlightRow;
