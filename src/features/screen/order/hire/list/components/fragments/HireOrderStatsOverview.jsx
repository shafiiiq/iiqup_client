import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './HireOrderStats.css';

const formatCurrency = (value) =>
  `QAR ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function HireOrderStatsOverview({ summary, totals, series, loading }) {
  if (loading || !summary || !totals) {
    return <div className="hire order stats empty"><p>Loading statistics…</p></div>;
  }

  const growthPositive = summary.growthPercent >= 0;

  return (
    <div className="hire order stats overview">
      <div className="hire order stats cards">
        <div className="hire order stats card primary">
          <span className="hire order stats card-label">{summary.rangeLabel} Cost</span>
          <span className="hire order stats card-value">{formatCurrency(summary.totalCost)}</span>
          <span className="hire order stats card-sub">{summary.totalCount} hire order{summary.totalCount === 1 ? '' : 's'}</span>
        </div>

        <div className={`hire order stats card ${growthPositive ? 'growth-up' : 'growth-down'}`}>
          <span className="hire order stats card-label">Growth vs Previous {summary.rangeLabel}</span>
          <span className="hire order stats card-value">{growthPositive ? '+' : ''}{summary.growthPercent.toFixed(1)}%</span>
          <span className="hire order stats card-sub">Previous: {formatCurrency(summary.previousTotalCost)}</span>
        </div>

        <div className="hire order stats card">
          <span className="hire order stats card-label">All-Time Total Cost</span>
          <span className="hire order stats card-value">{formatCurrency(totals.totalCost)}</span>
          <span className="hire order stats card-sub">{totals.totalCount} hire orders</span>
        </div>

        <div className="hire order stats card">
          <span className="hire order stats card-label">Average Cost / Purchase Order ({summary.rangeLabel})</span>
          <span className="hire order stats card-value">{formatCurrency(summary.averageCost)}</span>
        </div>

        <div className="hire order stats card">
          <span className="hire order stats card-label">All-Time Average Cost / Purchase Order</span>
          <span className="hire order stats card-value">{formatCurrency(totals.averageCost)}</span>
        </div>
      </div>

      <div className="hire order stats chart-card">
        <div className="hire order stats chart-header">
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
          <div className="hire order stats empty"><p>No hire orders for this period</p></div>
        )}
      </div>
    </div>
  );
}

export default HireOrderStatsOverview;