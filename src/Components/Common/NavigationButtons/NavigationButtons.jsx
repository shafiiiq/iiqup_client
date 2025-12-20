import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NavigationButtons.css';

const NavigationButtons = () => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  const goForward = () => {
    navigate(1);
  };

  return (
    <div className="navigation-buttons">
      <button
        className="nav-btn back-btn"
        onClick={goBack}
        title="Go Back"
      >
        <span class="material-symbols-rounded">
          arrow_back_ios
        </span>
      </button>
      <button
        className="nav-btn forward-btn"
        onClick={goForward}
        title="Go Forward"
      >
        <span class="material-symbols-rounded">
          arrow_forward_ios
        </span>
      </button>
    </div>
  );
};

export default NavigationButtons;