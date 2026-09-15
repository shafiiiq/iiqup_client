import React from 'react';
import './ProjectTimeBar.css';

const ProjectTimeBar = ({ directionTotals, netScore }) => {
  const total = directionTotals.growth + directionTotals.loss + directionTotals.neutral;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  const segments = [
    { key: 'growth', label: 'Growth', percent: pct(directionTotals.growth), tone: 'accent' },
    { key: 'neutral', label: 'Neutral', percent: pct(directionTotals.neutral), tone: 'track' },
    { key: 'loss', label: 'Loss', percent: pct(directionTotals.loss), tone: 'dark' },
  ];

  return (
    <div className="features screen dashboard project-time-bar">
      <span className="features screen dashboard project-time-bar-label">Growth vs Loss</span>

      <div className="features screen dashboard project-time-bar-track">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className={`features screen dashboard project-time-bar-segment tone-${segment.tone}`}
            style={{ flexGrow: Math.max(segment.percent, 2) }}
          >
            {segment.percent > 0 && <span>{segment.percent}%</span>}
          </div>
        ))}
      </div>

      <div className="features screen dashboard project-time-bar-output">
        <span className="features screen dashboard project-time-bar-output-label">Net Score</span>
        <span className="features screen dashboard project-time-bar-output-pill">{netScore}</span>
      </div>
    </div>
  );
};

export default ProjectTimeBar;
