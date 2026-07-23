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

  const getLatestApproval = (workItem) => {
    const trail = Array.isArray(workItem?.approvalTrail) ? workItem.approvalTrail : [];
    if (!trail.length) return null;
    return trail.slice().sort((a, b) => new Date(b.approvalDate || 0) - new Date(a.approvalDate || 0))[0];
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  return (
    <div className="completed-work-alert">
      <div className="alert-header">
        <h3 className="alert-title">✓ Completed Work ({completedWorks.length})</h3>
        <button className="alert-close-btn" onClick={onClose}>
          <span className="material-symbols-rounded">close</span>
        </button>
      </div>

      <div className="work-alert-list">
        {completedWorks.map((workItem) => {
          const latestApproval = getLatestApproval(workItem);
          const mechanicName = workItem?.assignedMechanic?.find((m) => m?.mechanicName)?.mechanicName
            || workItem?.assignedMechanic?.[0]?.mechanicName
            || 'N/A';
          const remarks = workItem?.rectificationRemarks || workItem?.remarks || latestApproval?.comments || 'No remarks provided';
          const completedAt = workItem?.updatedAt || latestApproval?.approvalDate || workItem?.createdAt;
          const solutionCount = workItem?.solutions?.length || 0;

          return (
            <div key={workItem._id} className="work-alert-item">
              <div className="work-alert-info">
                <div className="info-row">
                  <span className="info-label">Operator:</span>
                  <span className="info-value">{workItem?.name || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Equipment:</span>
                  <span className="info-value">{workItem?.regNo || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Remarks:</span>
                  <span className="info-value">{remarks}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Completed By:</span>
                  <span className="info-value">{mechanicName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Uploaded Media:</span>
                  <span className="info-value">{solutionCount}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Completed At:</span>
                  <span className="info-value">{formatDate(completedAt)}</span>
                </div>
              </div>

              <button
                className="action-btn view-work"
                onClick={() => navigate(`/complaints/${workItem._id}/${workItem.regNo}`)}
              >
                View Work
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CompletedWorkAlert;