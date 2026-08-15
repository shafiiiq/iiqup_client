import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const ErrorView = ({ error, onRetry }) => (
  <div className="dashboard-container">
    <div className="error-container">
      <AlertTriangle size={48} />
      <h2>Dashboard Error</h2>
      <p>{error}</p>
      <button onClick={onRetry} className="retry-button">
        <RefreshCw size={16} />
        Retry
      </button>
    </div>
  </div>
);

export default ErrorView;