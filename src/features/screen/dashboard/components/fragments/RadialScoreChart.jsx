import React from 'react';
import { COLORS } from '../../constants/dashboard.constant';
import './DashboardPanels.css';
import './RadialScoreChart.css';

const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const RadialScoreChart = ({ growth, loss }) => {
  const total = growth + loss;
  const percent = total ? Math.round((growth / total) * 100) : 100;
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;

  return (
    <div className="features screen dashboard panel-card">
      <div className="features screen dashboard panel-card-header">
        <h3>Growth Ratio</h3>
        <p>Share of growth activity vs loss activity this period</p>
      </div>
      <div className="features screen dashboard radial-score-dial">
        <svg viewBox="0 0 160 160" width="160" height="160">
          <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="#f0ebdd" strokeWidth="12" />
          <circle
            cx="80"
            cy="80"
            r={RADIUS}
            fill="none"
            stroke={percent >= 50 ? COLORS.success : COLORS.danger}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform="rotate(-90 80 80)"
          />
        </svg>
        <div className="features screen dashboard radial-score-copy">
          <span className="features screen dashboard radial-score-value">{percent}%</span>
          <span className="features screen dashboard radial-score-label">Growth</span>
        </div>
      </div>
    </div>
  );
};

export default RadialScoreChart;
