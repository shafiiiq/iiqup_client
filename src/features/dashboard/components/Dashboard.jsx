import React, { useEffect, useRef } from 'react';

import { useDashboard }   from '../hooks/useDashboard';
import { useComparison }  from '../hooks/useComparison';
import { formatDateTime } from '../utils/formatters';
import { getActivityContent }         from '../utils/transformers';
import { COLORS }                     from '../utils/constants';

import DashboardHeader    from './DashboardHeader';
import StatusBar          from './StatusBar';
import DashboardTabs      from './DashboardTabs';
import MetricsGrid        from './MetricsGrid';
import ChartsSection      from './ChartsSection';
import TrendAnalysis      from './TrendAnalysis';
import CompanyPerformance from './CompanyPerformance';
import ComparisonSection  from './ComparisonSection';
import ActivityTimeline   from './ActivityTimeline';
import DataTable          from './DataTable';
import { StockHealthMonitor, ToolkitStatusMonitor } from './HealthMonitors';
import SummaryInsights    from './SummaryInsights';
import ErrorView          from './ErrorView';
import LoadingView        from './LoadingView';
import Notifications      from '@features/notification/components/Notification';
import LiveChat           from '@/features/chat/components/LiveChat';
import './Dashboard.css';

const Dashboard = () => {
  const notificationContainerRef = useRef(null);
  const statusBarRef             = useRef(null);
  const dashboardHeaderRef       = useRef(null);
  const dashboardTabsRef         = useRef(null);

  const {
    activeTab, dashboardData, loading, tabLoading, refreshing, error,
    currentDateTime, lastUpdated,
    currentData, realTimeData, currentStats,
    analyticsData, barChartData, stockPerformance, toolkitPerformance,
    handleTabChange, handleRefresh,
  } = useDashboard();

  const comparison = useComparison();
  useEffect(() => { comparison.load('days'); }, [comparison]);

  if (loading) return <LoadingView />;
  if (error)   return <ErrorView error={error} onRetry={handleRefresh} />;

  const SKIP_KEYS = new Set(['counts', 'total', '_id', '__v', '_counts', '_total']);
  const activityCollections = currentData
    ? Object.entries(currentData).filter(
        ([key, value]) => !SKIP_KEYS.has(key) && Array.isArray(value) && value.length > 0
      )
    : [];

  return (
    <div className="dashboard-container">
      <LiveChat />

      <div
        className="live-auto-monitor-hero"
        style={{ position: 'absolute', width: '42%', height: '35rem', right: 0, paddingInline: '1rem' }}
      >
        <div className="dsh-auto-wraper-live" ref={notificationContainerRef}>
          <div className="dsh-auto-roller-controller">
            <div className="dsh-roler-move">
              <Notifications islivemodeON scrollContainerRef={notificationContainerRef} />
            </div>
          </div>
        </div>
      </div>

      <div ref={dashboardHeaderRef}>
        <DashboardHeader
          title="Fleet Management Dashboard"
          subtitle="Real-time Fleet Analytics & Monitoring"
          currentDateTime={currentDateTime}
          refreshing={refreshing}
          handleRefresh={handleRefresh}
        />
      </div>

      <div ref={statusBarRef}>
        <StatusBar realTimeData={realTimeData} />
      </div>

      <div ref={dashboardTabsRef}>
        <DashboardTabs
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          loading={tabLoading}
        />
      </div>

      <MetricsGrid currentStats={currentStats} realTimeData={realTimeData} />

      <div className="dsh-full-section">

        <ChartsSection
          analyticsData={analyticsData}
          barChartData={barChartData}
          dashboardData={{ stockData: currentData?.stocks }}
          COLORS={COLORS}
        />

        <CompanyPerformance dashboardData={dashboardData} />

        <TrendAnalysis
          realTimeData={realTimeData}
          stockPerformance={stockPerformance}
          toolkitPerformance={toolkitPerformance}
        />

        <ComparisonSection
          active={comparison.active}
          onTabChange={comparison.load}
          loading={comparison.loading}
          chartData={comparison.chartData}
        />

        <div className="rec-stock-tool">
          {activityCollections.map(([key, docs]) => (
            <ActivityTimeline
              key={key}
              isHalf
              title={`Recent ${key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()} Activities`}
              subtitle={`${docs.length} records this period`}
              data={[...docs].slice(0, 15).reverse().map((d) => ({
                ...d,
                id:      d._id,
                date:    d.updatedAt || d.createdAt,
                content: key,
              }))}
              formatDateTime={formatDateTime}
              getActivityContent={getActivityContent}
              COLORS={COLORS}
              markerColor={COLORS.chartColors[
                activityCollections.findIndex(([k]) => k === key) % COLORS.chartColors.length
              ]}
            />
          ))}
        </div>

        <DataTable currentData={currentData} />

        <StockHealthMonitor   stockHealth={realTimeData?.stockHealth}     />
        <ToolkitStatusMonitor toolkitStatus={realTimeData?.toolkitStatus} />

        <SummaryInsights
          activeTab={activeTab}
          lastUpdated={lastUpdated}
          currentStats={currentStats}
          realTimeData={realTimeData}
        />

      </div>
    </div>
  );
};

export default Dashboard;