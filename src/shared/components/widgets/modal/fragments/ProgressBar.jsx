import React from 'react';

const ProgressBar = ({ progress, progressText, accentColor }) => {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="shared widget modal progress-section">
      <div className="shared widget modal progress-bar">
        <div
          className="shared widget modal progress-fill"
          style={{ width: `${clamped}%`, background: `linear-gradient(90deg, ${accentColor}, white)` }}
        />
      </div>
      <div className="shared widget modal progress-meta">
        <span className="shared widget modal progress-percentage">{Math.round(clamped)}%</span>
        {progressText && <span className="shared widget modal progress-label">{progressText}</span>}
      </div>
    </div>
  );
};

export default ProgressBar;
