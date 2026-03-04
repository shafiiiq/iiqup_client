import React from 'react';
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FileText, Package, TrendingUp, DollarSign } from 'lucide-react';

const AnalyticsCharts = ({
  analyticsData,
  barChartData,
  stockData,
  stockMovements,
  trends,
  equipmentPerformance
}) => (
  <>
    <div className="charts-section">
      <ChartCard 
        title="Activity Distribution"
        subtitle="Breakdown of all fleet activities"
        data={analyticsData}
        renderChart={(data) => (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
            <Legend />
          </PieChart>
        )}
        emptyIcon={<FileText size={48} />}
        emptyText="No activity data available for this period"
      />

      <ChartCard 
        title="Updates by Type"
        subtitle="Distribution of updates by category"
        data={barChartData}
        renderChart={(data) => (
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
            <Bar dataKey="count" fill="#1e3a8a" name="Count" />
          </BarChart>
        )}
        emptyIcon={<FileText size={48} />}
        emptyText="No data available for this period"
      />

      {stockData && (
        <ChartCard 
          title="Stock Status Distribution"
          subtitle="Current inventory status overview"
          data={prepareStockStatusData(stockData)}
          renderChart={(data) => (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
              <Legend />
            </PieChart>
          )}
          emptyIcon={<Package size={48} />}
          emptyText="No stock status data available"
        />
      )}
    </div>

    <div className='chart-card-container'>
      <ChartCard 
        fullWidth
        title="Trend Analysis"
        subtitle="Service and maintenance trends across periods"
        data={trends}
        renderChart={(data) => (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="services"
              stackId="1"
              stroke="#1e3a8a"
              fill="#1e3a8a"
              fillOpacity={0.8}
              name="Services"
            />
            <Area
              type="monotone"
              dataKey="maintenance"
              stackId="1"
              stroke="#1e40af"
              fill="#1e40af"
              fillOpacity={0.8}
              name="Maintenance"
            />
          </AreaChart>
        )}
        emptyIcon={<TrendingUp size={48} />}
        emptyText="No trend data available"
      />

      {equipmentPerformance?.length > 0 && (
        <ChartCard 
          fullWidth
          title="Equipment Performance Analysis"
          subtitle="Real-time performance metrics for active equipment"
          large
          data={equipmentPerformance}
          renderChart={(data) => (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="performance" fill="#1e3a8a" name="Performance %" />
              <Bar dataKey="utilization" fill="#06b6d4" name="Utilization %" />
              <Bar dataKey="efficiency" fill="#10b981" name="Efficiency %" />
            </BarChart>
          )}
        />
      )}
    </div>
  </>
);

const ChartCard = ({ 
  title, 
  subtitle, 
  data, 
  renderChart, 
  emptyIcon, 
  emptyText, 
  fullWidth, 
  large 
}) => (
  <div className={`chart-card ${fullWidth ? 'full-width' : ''}`}>
    <div className="chart-header">
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
    <div className={`chart-container ${large ? 'large' : ''}`}>
      {data?.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(data)}
        </ResponsiveContainer>
      ) : (
        <div className="no-data">
          {emptyIcon}
          <p>{emptyText}</p>
        </div>
      )}
    </div>
  </div>
);

const prepareStockStatusData = (stockData) => {
  if (!stockData || !stockData.length) return [];

  const statusCount = {
    'in_stock': 0,
    'low_stock': 0,
    'out_of_stock': 0
  };

  stockData.forEach(item => {
    const status = item.stockInfo?.status || 'in_stock';
    statusCount[status]++;
  });

  return [
    { name: 'In Stock', value: statusCount.in_stock, color: '#10b981' },
    { name: 'Low Stock', value: statusCount.low_stock, color: '#f59e0b' },
    { name: 'Out of Stock', value: statusCount.out_of_stock, color: '#ef4444' }
  ].filter(item => item.value > 0);
};

export default AnalyticsCharts;