import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './QuotationStats.css';

const formatCurrency = (value) =>
  `QAR ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function QuotationStatsOverview({ summary, totals, series, loading }) {
  if (loading || !summary || !totals) {
    return <div className="purchase order stats empty"><p>Loading statistics…</p></div>;
  }

  const growthPositive = summary.growthPercent >= 0;

  return (
    <div className="purchase order stats overview">
      <div className="purchase order stats cards">
        <div className="purchase order stats card primary">
          <span className="purchase order stats card-label">{summary.rangeLabel} Cost</span>
          <span className="purchase order stats card-value">{formatCurrency(summary.totalCost)}</span>
          <span className="purchase order stats card-sub">{summary.totalCount} purchase order{summary.totalCount === 1 ? '' : 's'}</span>
        </div>

        <div className={`purchase order stats card ${growthPositive ? 'growth-up' : 'growth-down'}`}>
          <span className="purchase order stats card-label">Growth vs Previous {summary.rangeLabel}</span>
          <span className="purchase order stats card-value">{growthPositive ? '+' : ''}{summary.growthPercent.toFixed(1)}%</span>
          <span className="purchase order stats card-sub">Previous: {formatCurrency(summary.previousTotalCost)}</span>
        </div>

        <div className="purchase order stats card">
          <span className="purchase order stats card-label">All-Time Total Cost</span>
          <span className="purchase order stats card-value">{formatCurrency(totals.totalCost)}</span>
          <span className="purchase order stats card-sub">{totals.totalCount} purchase orders</span>
        </div>

        <div className="purchase order stats card">
          <span className="purchase order stats card-label">Average Cost / Purchase Order ({summary.rangeLabel})</span>
          <span className="purchase order stats card-value">{formatCurrency(summary.averageCost)}</span>
        </div>

        <div className="purchase order stats card">
          <span className="purchase order stats card-label">All-Time Average Cost / Purchase Order</span>
          <span className="purchase order stats card-value">{formatCurrency(totals.averageCost)}</span>
        </div>
      </div>

      <div className="purchase order stats chart-card">
        <div className="purchase order stats chart-header">
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
          <div className="purchase order stats empty"><p>No purchase orders for this period</p></div>
        )}
      </div>
    </div>
  );
}

export default QuotationStatsOverview;