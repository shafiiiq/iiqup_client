import React from 'react';
import { TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { COLORS } from '../utils/constants';
import Loader from '../../../Common/Loader/Loader';

const ComparisonSection = ({ active, onTabChange, loading, chartData }) => {
  const barKeys = chartData.length > 0
    ? Object.keys(chartData[0]).filter((k) => k !== 'label' && k !== 'Total')
    : [];

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>Historical Comparison Analysis</h3>
        <p>Compare activities across different time periods</p>
        <div className="comparison-tabs" style={{ marginTop: '1rem' }}>
          {['days', 'months', 'years'].map((type) => (
            <button
              key={type}
              className={`comparison-tab ${active === type ? 'active' : ''}`}
              onClick={() => onTabChange(type)}
              disabled={loading}
            >
              {type === 'days' ? 'Last 5 Days' : type === 'months' ? 'Last 5 Months' : 'Last 5 Years'}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container large cmp-hd">
        {loading ? (
          <div className="loading-container" style={{ height: 400 }}><Loader /></div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={450}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis />
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: 20 }} />
              {barKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={COLORS.chartColors[index % COLORS.chartColors.length]}
                  stackId="a"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data" style={{ height: 400 }}>
            <TrendingUp size={48} /><p>No comparison data</p>
          </div>
        )}
      </div>

      {!loading && chartData.length > 0 && (
        <div className="comparison-summary">
          <h4>Summary</h4>
          <div className="summary-grid">
            {chartData.map((item, i) => (
              <div key={i} className="comparison-item">
                <div>{item.label}</div>
                <div className="summary-total-highlight">{item.Total}</div>
                <div>Total Activities</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonSection;