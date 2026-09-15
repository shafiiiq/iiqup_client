import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './Navigator.css';

const Navigator = () => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <div className="shared widget navigator wrapper">
      <div className="shared widget navigator navigation-buttons">
        <button
          className="shared widget navigator nav-btn back-btn"
          onClick={() => navigate(-1)}
          title="Go Back"
        >
          <span className="material-symbols-rounded shared widget navigator main-control main-control-back">
            arrow_back_ios
          </span>
        </button>

        <button
          className="shared widget navigator nav-btn forward-btn"
          onClick={() => navigate(1)}
          title="Go Forward"
        >
          <span className="material-symbols-rounded shared widget navigator main-control main-control-forward">
            arrow_forward_ios
          </span>
        </button>
      </div>

      <div className="shared widget navigator refresh-buttons">
        <button
          className="shared widget navigator nav-btn refresh-btn"
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Refresh Page"
        >
          <span
            className={`material-symbols-rounded shared widget navigator main-control main-control-refresh ${
              isRefreshing ? 'spinning' : ''
            }`}
          >
            refresh
          </span>
        </button>
      </div>
    </div>
  );
};

export default Navigator;