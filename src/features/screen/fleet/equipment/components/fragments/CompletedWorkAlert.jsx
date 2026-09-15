import { useNavigate } from 'react-router-dom';

function CompletedWorkAlert({ completedWorks, onClose }) {
  const navigate = useNavigate();

  if (!completedWorks.length) return null;

  const getLatestApproval = (workItem) => {
    const trail = Array.isArray(workItem?.approvalTrail) ? workItem.approvalTrail : [];
    if (!trail.length) return null;
    return trail.slice().sort((a, b) => new Date(b.approvalDate || 0) - new Date(a.approvalDate || 0))[0];
  };

  const formatCompletedAt = (value) => {
    if (!value) return 'N/A';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  return (
    <div className="fleet equipment completed-work-alert">
      <div className="fleet equipment alert-header">
        <h3 className="fleet equipment alert-title">✓ Completed Work ({completedWorks.length})</h3>
        <button className="fleet equipment alert-close-btn" onClick={onClose}>
          <span className="material-symbols-rounded">close</span>
        </button>
      </div>

      <div className="fleet equipment work-alert-list">
        {completedWorks.map((workItem) => {
          const latestApproval = getLatestApproval(workItem);
          const mechanicName = workItem?.assignedMechanic?.find(m => m?.mechanicName)?.mechanicName
            || workItem?.assignedMechanic?.[0]?.mechanicName
            || 'N/A';
          const remarks = workItem?.rectificationRemarks || workItem?.remarks || latestApproval?.comments || 'No remarks provided';
          const completedAt = workItem?.updatedAt || latestApproval?.approvalDate || workItem?.createdAt;
          const solutionCount = workItem?.solutions?.length || 0;

          return (
            <div key={workItem._id} className="fleet equipment work-alert-item">
              <div className="fleet equipment work-alert-info">
                <div className="fleet equipment info-row">
                  <span className="fleet equipment info-label">Operator:</span>
                  <span className="fleet equipment info-value">{workItem?.name || 'N/A'}</span>
                </div>
                <div className="fleet equipment info-row">
                  <span className="fleet equipment info-label">Equipment:</span>
                  <span className="fleet equipment info-value">{workItem?.regNo || 'N/A'}</span>
                </div>
                <div className="fleet equipment info-row">
                  <span className="fleet equipment info-label">Remarks:</span>
                  <span className="fleet equipment info-value">{remarks}</span>
                </div>
                <div className="fleet equipment info-row">
                  <span className="fleet equipment info-label">Completed By:</span>
                  <span className="fleet equipment info-value">{mechanicName}</span>
                </div>
                <div className="fleet equipment info-row">
                  <span className="fleet equipment info-label">Uploaded Media:</span>
                  <span className="fleet equipment info-value">{solutionCount}</span>
                </div>
                <div className="fleet equipment info-row">
                  <span className="fleet equipment info-label">Completed At:</span>
                  <span className="fleet equipment info-value">{formatCompletedAt(completedAt)}</span>
                </div>
              </div>

              <button
                className="fleet equipment action-btn view-work"
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