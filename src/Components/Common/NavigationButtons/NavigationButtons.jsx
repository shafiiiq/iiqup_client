import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NavigationButtons.css';
import ArrowForward from '../../../assets/images/arrow_forward_ios.svg'
import ArrowBack from '../../../assets/images/arrow_back_ios.svg'

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
        <img src={ArrowBack} alt="B" className='main-control main-control-back' />
      </button>
      <button
        className="nav-btn forward-btn"
        onClick={goForward}
        title="Go Forward"
      >
        <img src={ArrowForward} alt="F" className='main-control main-control-forward' />
      </button>
    </div>
  );
};

export default NavigationButtons;