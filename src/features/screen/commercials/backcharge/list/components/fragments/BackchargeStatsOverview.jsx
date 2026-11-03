import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './BackchargeStats.css';

const formatCurrency = (value) =>
  `QAR ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function BackchargeStatsOverview({ summary, totals, series, loading }) {
  if (loading || !summary || !totals) {
    return <div className="backcharge stats empty"><p>Loading statistics…</p></div>;
  }

  const growthPositive = summary.growthPercent >= 0;

  return (
    <div className="backcharge stats overview">
      <div className="backcharge stats cards">
        <div className="backcharge stats card primary">
          <span className="backcharge stats card-label">{summary.rangeLabel} Cost</span>
          <span className="backcharge stats card-value">{formatCurrency(summary.totalCost)}</span>
          <span className="backcharge stats card-sub">{summary.totalCount} report{summary.totalCount === 1 ? '' : 's'}</span>
        </div>

        <div className={`backcharge stats card ${growthPositive ? 'growth-up' : 'growth-down'}`}>
          <span className="backcharge stats card-label">Growth vs Previous {summary.rangeLabel}</span>
          <span className="backcharge stats card-value">{growthPositive ? '+' : ''}{summary.growthPercent.toFixed(1)}%</span>
          <span className="backcharge stats card-sub">Previous: {formatCurrency(summary.previousTotalCost)}</span>
        </div>

        <div className="backcharge stats card">
          <span className="backcharge stats card-label">All-Time Total Cost</span>
          <span className="backcharge stats card-value">{formatCurrency(totals.totalCost)}</span>
          <span className="backcharge stats card-sub">{totals.totalCount} reports</span>
        </div>

        <div className="backcharge stats card">
          <span className="backcharge stats card-label">Average Cost / Report ({summary.rangeLabel})</span>
          <span className="backcharge stats card-value">{formatCurrency(summary.averageCost)}</span>
        </div>

        <div className="backcharge stats card">
          <span className="backcharge stats card-label">All-Time Average Cost / Report</span>
          <span className="backcharge stats card-value">{formatCurrency(totals.averageCost)}</span>
        </div>

        <div className="backcharge stats card">
          <span className="backcharge stats card-label">Total Deductions ({summary.rangeLabel})</span>
          <span className="backcharge stats card-value">{formatCurrency(summary.totalDeduction)}</span>
        </div>

        <div className="backcharge stats card">
          <span className="backcharge stats card-label">All-Time Total Deductions</span>
          <span className="backcharge stats card-value">{formatCurrency(totals.totalDeduction)}</span>
        </div>
      </div>

      <div className="backcharge stats chart-card">
        <div className="backcharge stats chart-header">
          <h3>Cost Breakdown — {series?.rangeLabel}</h3>
          <p>Total spend per bucket for the selected period</p>
        </div>
        {series?.buckets?.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={series.buckets} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Cost']} />
              <Bar dataKey="total" fill="#f5c451" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="backcharge stats empty"><p>No backcharge reports for this period</p></div>
        )}
      </div>
    </div>
  );
}

export default BackchargeStatsOverview;