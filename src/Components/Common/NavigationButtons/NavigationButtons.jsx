// ─────────────────────────────────────────────────────────────────────────────
// NavigationButtons.jsx — Browser history navigation controls
// Renders back and forward arrow buttons that mirror the browser's
// native navigation, persisted across the app via absolute positioning.
// ─────────────────────────────────────────────────────────────────────────────

import React       from 'react';
import { useNavigate } from 'react-router-dom';

import ArrowBack    from '../../../assets/images/arrow_back_ios.svg';
import ArrowForward from '../../../assets/images/arrow_forward_ios.svg';

import './NavigationButtons.css';

// ─────────────────────────────────────────────────────────────────────────────
// NavigationButtons Component
// ─────────────────────────────────────────────────────────────────────────────

const NavigationButtons = () => {
  const navigate = useNavigate();

  return (
    <div className="navigation-buttons">
      <button
        className="nav-btn back-btn"
        onClick={() => navigate(-1)}
        title="Go Back"
      >
        <img src={ArrowBack} alt="Back" className="main-control main-control-back" />
      </button>

      <button
        className="nav-btn forward-btn"
        onClick={() => navigate(1)}
        title="Go Forward"
      >
        <img src={ArrowForward} alt="Forward" className="main-control main-control-forward" />
      </button>
    </div>
  );
};

export default NavigationButtons;