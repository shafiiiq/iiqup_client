import React from 'react';

const LoadingView = ({ message = 'Loading Fleet Dashboard...', subMessage = 'Fetching real-time data from all systems' }) => (
  <div className="dashboard-container">
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <h2>{message}</h2>
      <p>{subMessage}</p>
    </div>
  </div>
);

export default LoadingView;