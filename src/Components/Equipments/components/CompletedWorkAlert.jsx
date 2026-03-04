// ─────────────────────────────────────────────────────────────────────────────
// CompletedWorkAlert.jsx — Banner showing complaints that reached "completed"
// status and need acknowledgement. Dismissed by the user via the close button.
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom';

/**
 * @param {{
 *   completedWorks: Array,
 *   onClose:        () => void,
 * }} props
 */
function CompletedWorkAlert({ completedWorks, onClose }) {
  const navigate = useNavigate();

  if (!completedWorks.length) return null;

  return (
    <div className="completed-work-alert">
      <div className="alert-header">
        <h3 className="alert-title">✓ Completed Work ({completedWorks.length})</h3>
        <button className="alert-close-btn" onClick={onClose}>
          <span className="material-symbols-rounded">close</span>
        </button>
      </div>

      <div className="work-alert-list">
        {completedWorks.map((workItem) => (
          <div key={workItem._id} className="work-alert-item">
            <div className="work-alert-info">
              <div className="info-row">
                <span className="info-label">Operator:</span>
                <span className="info-value">{workItem.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Equipment:</span>
                <span className="info-value">{workItem.regNo || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Comments:</span>
                <span className="info-value">{workItem.approvalTrail[1].comments || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Completed By:</span>
                <span className="info-value">{workItem.assignedMechanic?.mechanicName || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Registered Time:</span>
                <span className="info-value">{workItem.createdAt || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Completed Time:</span>
                <span className="info-value">{workItem.createdAt || 'N/A'}</span>
              </div>
            </div>

            <button
              className="action-btn view-work"
              onClick={() => navigate(`/complaints/${workItem._id}/${workItem.regNo}`)}
            >
              View Work
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CompletedWorkAlert;