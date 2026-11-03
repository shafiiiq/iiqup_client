import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './HireOrderStats.css';

const formatCurrency = (value) =>
  `QAR ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function HireOrderStatsGrowth({ summary, growth, loading }) {
  if (loading || !growth || !summary) {
    return <div className="hire order stats empty"><p>Loading growth data…</p></div>;
  }

  const growthPositive = summary.growthPercent >= 0;
  const trendColor = growthPositive ? '#3fb27f' : '#e0654f';

  return (
    <div className="hire order stats growth">
      <div className="hire order stats chart-card">
        <div className="hire order stats chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3>Cumulative Spend — {growth.rangeLabel}</h3>
            <p>Running total of hire order cost across the selected period</p>
          </div>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 999,
              background: `${trendColor}22`, border: `1px solid ${trendColor}44`,
            }}
          >
            <span style={{ color: trendColor, fontWeight: 700, fontSize: 13 }}>
              {growthPositive ? '+' : ''}{summary.growthPercent.toFixed(1)}% vs previous {summary.rangeLabel}
            </span>
          </div>
        </div>

        {growth.buckets?.length > 0 ? (
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={growth.buckets}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Cumulative Cost']} />
              <Area type="monotone" dataKey="cumulativeTotal" stroke={trendColor} fill={trendColor} fillOpacity={0.25} strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="hire order stats empty"><p>No hire orders for this period</p></div>
        )}
      </div>
    </div>
  );
}

export default HireOrderStatsGrowth;