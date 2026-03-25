import React from 'react';
import { FileText, Package } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const ChartsSection = ({ analyticsData, barChartData, dashboardData, COLORS }) => {
  const prepareStockStatusData = (stockData) => {
    if (!stockData?.length) return [];
    const statusCount = { in_stock: 0, low_stock: 0, out_of_stock: 0 };
    stockData.forEach(item => {
      const status = item.stockInfo?.status || item.status || 'in_stock';
      statusCount[status]++;
    });
    return [
      { name: 'In Stock',     value: statusCount.in_stock,     color: COLORS.success },
      { name: 'Low Stock',    value: statusCount.low_stock,    color: COLORS.warning },
      { name: 'Out of Stock', value: statusCount.out_of_stock, color: COLORS.danger  },
    ].filter(item => item.value > 0);
  };

  const stockStatusData = prepareStockStatusData(dashboardData.stockData);

  return (
    <>
      <div className="chart-card">
        <div className="chart-header">
          <h3>Activity Distribution</h3>
          <p>Breakdown of all fleet activities</p>
        </div>
        <div className="chart-container">
          {analyticsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData}
                  cx="50%" cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {analyticsData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data"><FileText size={48} /><p>No activity data</p></div>
          )}
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h3>Updates by Type</h3>
          <p>Distribution of updates by category</p>
        </div>
        <div className="chart-container">
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
                <Bar dataKey="count" fill={COLORS.primary} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data"><FileText size={48} /><p>No data available</p></div>
          )}
        </div>
      </div>

      {stockStatusData.length > 0 && (
        <div className="chart-card">
          <div className="chart-header">
            <h3>Stock Status Distribution</h3>
            <p>Current inventory status overview</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stockStatusData}
                  cx="50%" cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {stockStatusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
};

export default ChartsSection;