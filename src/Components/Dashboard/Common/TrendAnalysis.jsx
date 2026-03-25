import React from 'react';
import { TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { COLORS } from '../utils/constants';

const TrendAnalysis = ({ realTimeData, stockPerformance, toolkitPerformance }) => {
  const trendKeys = realTimeData?.trends?.length > 0
    ? Object.keys(realTimeData.trends[0]).filter((k) => k !== 'period' && k !== 'total')
    : [];

  return (
    <>
      <div className="chart-card">
        <div className="chart-header">
          <h3>Trend Analysis</h3>
          <p>Activity trends across all periods</p>
        </div>
        <div className="chart-container">
          {trendKeys.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={realTimeData.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                {trendKeys.map((key, index) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stackId="1"
                    stroke={COLORS.chartColors[index % COLORS.chartColors.length]}
                    fill={COLORS.chartColors[index % COLORS.chartColors.length]}
                    fillOpacity={0.8}
                    name={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data"><TrendingUp size={48} /><p>No trend data</p></div>
          )}
        </div>
      </div>

      {stockPerformance.length > 0 && (
        <div className="chart-card">
          <div className="chart-header">
            <h3>Stock Performance Analysis</h3>
            <p>Current stock levels and utilization metrics</p>
          </div>
          <div className="chart-container large">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stockPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="currentStock" fill={COLORS.primary} name="Current Stock" />
                <Bar dataKey="minThreshold" fill={COLORS.warning} name="Min Threshold" />
                <Bar dataKey="utilization"  fill={COLORS.success} name="Utilization %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {toolkitPerformance.length > 0 && (
        <div className="chart-card">
          <div className="chart-header">
            <h3>Toolkit Performance Analysis</h3>
            <p>Toolkit status and availability metrics</p>
          </div>
          <div className="chart-container large">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={toolkitPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalStock"   fill={COLORS.accent}  name="Total Stock"    />
                <Bar dataKey="variants"     fill={COLORS.info}    name="Variants"       />
                <Bar dataKey="availability" fill={COLORS.success} name="Availability %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
};

export default TrendAnalysis;