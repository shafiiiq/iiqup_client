import React from 'react';
import { FileText } from 'lucide-react';
import { toDisplayLabel, formatDateTime } from '../../helper/dashboard.format.helper';
import { COLORS } from '../../constants/dashboard.constant';
import './DashboardPanels.css';
import './RecentActivityPanel.css';

const RecentActivityPanel = ({ items, loading }) => (
  <div className="features screen dashboard panel-card">
    <div className="features screen dashboard panel-card-header">
      <h3>Recent Activity</h3>
      <p>Latest records across every tracked collection</p>
    </div>

    {loading ? (
      <div className="features screen dashboard panel-empty"><p>Loading…</p></div>
    ) : items.length === 0 ? (
      <div className="features screen dashboard panel-empty">
        <FileText size={40} />
        <p>No activity recorded yet</p>
      </div>
    ) : (
      <ul className="features screen dashboard recent-activity-list">
        {items.map((item, index) => {
          const dt = formatDateTime(item.createdAt);
          return (
            <li key={item._id || index} className="features screen dashboard recent-activity-item">
              <span
                className="features screen dashboard recent-activity-dot"
                style={{ background: COLORS.chartColors[index % COLORS.chartColors.length] }}
              />
              <div className="features screen dashboard recent-activity-body">
                <div className="features screen dashboard recent-activity-top">
                  <span className="features screen dashboard recent-activity-type">{toDisplayLabel(item._collection)}</span>
                  <span className="features screen dashboard recent-activity-time">{dt.date} · {dt.time}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

export default RecentActivityPanel;
