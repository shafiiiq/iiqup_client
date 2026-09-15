import React from 'react';
import { toDisplayLabel } from '../../helper/dashboard.format.helper';
import { DIRECTION_COLOR } from '../../constants/dashboard.constant';
import './DashboardPanels.css';
import './CollectionLeaderboard.css';

const CollectionLeaderboard = ({ counts, collections }) => {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0) || 1;
  const rows = [...collections]
    .map((entry) => ({ ...entry, count: counts[entry.key] || 0 }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="features screen dashboard panel-card">
      <div className="features screen dashboard panel-card-header">
        <h3>Collection Leaderboard</h3>
        <p>Ranked by volume this period</p>
      </div>

      <div className="features screen dashboard leaderboard-list">
        {rows.map((row, index) => {
          const percent = Math.round((row.count / total) * 100);
          return (
            <div key={row.key} className="features screen dashboard leaderboard-row">
              <span className="features screen dashboard leaderboard-rank">{index + 1}</span>
              <div className="features screen dashboard leaderboard-info">
                <div className="features screen dashboard leaderboard-top">
                  <span className="features screen dashboard leaderboard-name">{toDisplayLabel(row.label)}</span>
                  <span className="features screen dashboard leaderboard-count">{row.count}</span>
                </div>
                <div className="features screen dashboard leaderboard-bar">
                  <div
                    className="features screen dashboard leaderboard-bar-fill"
                    style={{ width: `${percent}%`, background: DIRECTION_COLOR[row.direction] }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CollectionLeaderboard;
