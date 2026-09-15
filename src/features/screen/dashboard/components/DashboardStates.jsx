import React from 'react';
import { RefreshCw } from 'lucide-react';
import './DashboardShell.css';

export const DashboardLoading = () => (
  <div className="features screen dashboard dashboard-shell">
    <main className="features screen dashboard dashboard-main">
      <div className="features screen dashboard dashboard-loading">
        <div className="features screen dashboard dashboard-spinner" />
        <p>Loading fleet data…</p>
      </div>
    </main>
  </div>
);

export const DashboardError = ({ error, onRetry }) => (
  <div className="features screen dashboard dashboard-shell">
    <main className="features screen dashboard dashboard-main">
      <div className="features screen dashboard dashboard-error">
        <p>{error || 'Something went wrong loading the dashboard.'}</p>
        {onRetry && (
          <button type="button" className="features screen dashboard dashboard-retry-btn" onClick={onRetry}>
            <RefreshCw size={14} style={{ marginRight: 6 }} />
            Retry
          </button>
        )}
      </div>
    </main>
  </div>
);
