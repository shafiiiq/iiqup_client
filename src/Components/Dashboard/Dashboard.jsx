import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react';

// Import API functions
import {
  fetchDashboardData,
  getComprehensiveStats,
  prepareAnalyticsData,
  prepareStockPerformance,
  prepareToolkitPerformance,
  prepareBarChartData,
  getActivityContent,
} from './dashboardApi';

// Import components
import DashboardHeader from './DashboardHeader';
import StatusBar from './Common/StatusBar';
import DashboardTabs from './Common/DashboardTabs';
import MetricsGrid from './Common/MetricsGrid';
import ChartsSection from './Common/ChartsSection';
import ActivityTimeline from './Common/ActivityTimeline';
import DataTable from './Common/DataTable';
import SummaryInsights from './Common/SummaryInsights';
import './Dashboard.css';
import { formatDate, formatDateTime, getStatusColor, COLORS } from './utils/dasboard-utils';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    daily: null,
    weekly: null,
    monthly: null,
    yearly: null,
    realTime: null
  });

  const [activeTab, setActiveTab] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Real-time clock and date
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };

      const dateString = now.toLocaleDateString('en-US', dateOptions);
      const timeString = now.toLocaleTimeString('en-US', timeOptions);

      setCurrentDateTime(`${dateString} | ${timeString}`);
      setLastUpdated(`Last updated: ${timeString}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch dashboard data wrapper
  const loadDashboardData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      setLoading(!showRefresh);

      const data = await fetchDashboardData();      

      setDashboardData(data);
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      loadDashboardData(true);
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Manual refresh
  const handleRefresh = () => {
    loadDashboardData(true);
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    return dashboardData[activeTab];
  };

  const currentData = getCurrentData();
  const currentStats = getComprehensiveStats(currentData);
  const analyticsData = prepareAnalyticsData(currentData);
  const stockPerformance = prepareStockPerformance(currentData);
  const toolkitPerformance = prepareToolkitPerformance(currentData);
  const barChartData = prepareBarChartData(currentData);
  const realTimeData = dashboardData.realTime;

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading Fleet Dashboard...</h2>
          <p>Fetching real-time data from all systems</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-container">
          <AlertTriangle size={48} />
          <h2>Dashboard Error</h2>
          <p>{error}</p>
          <button onClick={() => loadDashboardData()} className="retry-button">
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <DashboardHeader
        title="Fleet Management Dashboard"
        subtitle="Real-time Fleet Analytics & Monitoring"
        currentDateTime={currentDateTime}
        refreshing={refreshing}
        handleRefresh={handleRefresh}
      />

      <StatusBar realTimeData={realTimeData} />

      <DashboardTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={['daily', 'weekly', 'monthly', 'yearly']}
      />

      <MetricsGrid
        currentStats={currentStats}
        realTimeData={realTimeData}
        COLORS={COLORS}
      />

      <ChartsSection
        analyticsData={analyticsData}
        barChartData={barChartData}
        dashboardData={dashboardData}
        COLORS={COLORS}
      />

      <div className='chart-card-container'>
        <div className="chart-card full-width">
          <div className="chart-header">
            <h3>Trend Analysis</h3>
            <p>Service, maintenance, stock and toolkit trends across periods</p>
          </div>
          <div className="chart-container">
            {realTimeData?.trends?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={realTimeData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="services"
                    stackId="1"
                    stroke={COLORS.primaryLight}
                    fill={COLORS.primaryLight}
                    fillOpacity={0.8}
                    name="Services"
                  />
                  <Area
                    type="monotone"
                    dataKey="maintenance"
                    stackId="1"
                    stroke={COLORS.success}
                    fill={COLORS.success}
                    fillOpacity={0.8}
                    name="Maintenance"
                  />
                  <Area
                    type="monotone"
                    dataKey="battery"
                    stackId="1"
                    stroke={COLORS.accent}
                    fill={COLORS.accent}
                    fillOpacity={0.8}
                    name="Battery"
                  />
                  <Area
                    type="monotone"
                    dataKey="tyre"
                    stackId="1"
                    stroke={COLORS.infoLight}
                    fill={COLORS.infoLight}
                    fillOpacity={0.8}
                    name="Tyre"
                  />
                  <Area
                    type="monotone"
                    dataKey="stocks"
                    stackId="1"
                    stroke={COLORS.warning}
                    fill={COLORS.warning}
                    fillOpacity={0.8}
                    name="Stock Items"
                  />
                  <Area
                    type="monotone"
                    dataKey="toolkit"
                    stackId="1"
                    stroke={COLORS.danger}
                    fill={COLORS.danger}
                    fillOpacity={0.8}
                    name="Toolkit Items"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">
                <TrendingUp size={48} />
                <p>No trend data available</p>
              </div>
            )}
          </div>
        </div>

        {stockPerformance.length > 0 && (
          <div className="chart-card full-width">
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
                  <Bar dataKey="utilization" fill={COLORS.success} name="Utilization %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {toolkitPerformance.length > 0 && (
          <div className="chart-card full-width">
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
                  <Bar dataKey="totalStock" fill={COLORS.accent} name="Total Stock" />
                  <Bar dataKey="variants" fill={COLORS.info} name="Variants" />
                  <Bar dataKey="availability" fill={COLORS.success} name="Availability %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <ActivityTimeline
        currentData={currentData}
        formatDateTime={formatDateTime}
        getActivityContent={getActivityContent}
        COLORS={COLORS}
        isHalf={false}
      />

      <DataTable
        currentData={currentData}
        formatDate={formatDate}
      />

      <div className="rec-stock-tool">
        {/* Stock Activity Timeline */}
        {currentData?.stocks && currentData.stocks.length > 0 && (
          <ActivityTimeline
            isHalf={true}
            title="Recent Stock Activities"
            subtitle="Latest stock movements and updates"
            data={currentData.stocks.slice(0, 15).reverse().map(stock => ({
              id: stock._id,
              date: stock.updatedAt || stock.createdAt,
              content: 'stocks',
              ...stock
            }))}
            formatDateTime={formatDateTime}
            getActivityContent={getActivityContent}
            COLORS={COLORS}
            markerColor={COLORS.warning}
          />
        )}

        {/* Toolkit Activity Timeline */}
        {currentData?.toolkit && currentData.toolkit.length > 0 && (
          <ActivityTimeline
            isHalf={true}
            title="Recent Toolkit Activities"
            subtitle="Latest toolkit updates and status changes"
            data={currentData.toolkit.slice(0, 15).reverse().map(toolkit => ({
              id: toolkit._id,
              date: toolkit.updatedAt || toolkit.createdAt,
              content: 'toolkit',
              ...toolkit
            }))}
            formatDateTime={formatDateTime}
            getActivityContent={getActivityContent}
            COLORS={COLORS}
            markerColor={COLORS.danger}
          />
        )}
      </div>


      {/* Stock Health Monitor */}
      {realTimeData?.stockHealth?.length > 0 && (
        <div className="health-dashboard">
          <div className="health-header">
            <h3>Stock Health Monitor</h3>
            <p>Real-time stock levels and status</p>
          </div>
          <div className="health-grid">
            {realTimeData.stockHealth.map((stock, index) => (
              <div key={index} className="health-card">
                <div className="health-info">
                  <h4>{stock.name} - {stock.serialNumber}</h4>
                  <span className={`health-status ${stock.status.toLowerCase().replace('_', '-')}`}>
                    {stock.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="health-meter">
                  <div className="health-bar">
                    <div
                      className="health-fill"
                      style={{
                        width: `${stock.health}%`,
                        backgroundColor: getStatusColor(stock.status)
                      }}
                    ></div>
                  </div>
                  <span className="health-percentage">{stock.currentStock}/{stock.minThreshold}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolkit Status Monitor */}
      {realTimeData?.toolkitStatus?.length > 0 && (
        <div className="health-dashboard">
          <div className="health-header">
            <h3>Toolkit Status Monitor</h3>
            <p>Real-time toolkit availability and status</p>
          </div>
          <div className="health-grid">
            {realTimeData.toolkitStatus.map((toolkit, index) => (
              <div key={index} className="health-card">
                <div className="health-info">
                  <h4>{toolkit.name}</h4>
                  <span className={`health-status ${toolkit.status.toLowerCase()}`}>
                    {toolkit.status.toUpperCase()}
                  </span>
                </div>
                <div className="health-meter">
                  <div className="health-bar">
                    <div
                      className="health-fill"
                      style={{
                        width: `${toolkit.totalStock > 0 ? 100 : 0}%`,
                        backgroundColor: getStatusColor(toolkit.status)
                      }}
                    ></div>
                  </div>
                  <span className="health-percentage">{toolkit.totalStock} items ({toolkit.variants} variants)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SummaryInsights
        activeTab={activeTab}
        lastUpdated={lastUpdated}
        currentStats={currentStats}
        realTimeData={realTimeData}
      />
    </div>
  );
};

export default Dashboard;