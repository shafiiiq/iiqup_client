import React, { useCallback, useMemo, useState } from 'react';
import DashboardShell from './DashboardShell';
import MiniStatCards from './fragments/MiniStatCards';
import { DashboardLoading, DashboardError } from './DashboardStates';
import GranularityTabs from './fragments/GranularityTabs';
import SpotlightRow from './fragments/SpotlightRow';
import ProjectTimeBar from './fragments/ProjectTimeBar';
import RadialScoreChart from './fragments/RadialScoreChart';
import ActivityHeatStrip from './fragments/ActivityHeatStrip';
import MetricsGrid from './fragments/MetricsGrid';
import TrendSparklineGrid from './fragments/TrendSparklineGrid';
import CollectionLeaderboard from './fragments/CollectionLeaderboard';
import BreakdownPanel from './fragments/BreakdownPanel';
import RecentActivityPanel from './fragments/RecentActivityPanel';
import { useDashboardNumbers } from '../hooks/useDashboardNumbers';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useDashboardTotals } from '../hooks/useDashboardTotals';
import { useDashboardBreakdown } from '../hooks/useDashboardBreakdown';
import { useDashboardRecent } from '../hooks/useDashboardRecent';
import { useDashboardRealtime } from '../hooks/useDashboardRealtime';
import { DEFAULT_GRANULARITY, WELCOME_COPY } from '../constants/dashboard.constant';
import './fragments/DashboardPanels.css';

const Dashboard = () => {
  const [granularity, setGranularity] = useState(DEFAULT_GRANULARITY);

  const { numbers, loading: numbersLoading, error, reload: reloadNumbers } = useDashboardNumbers(granularity);
  const { stats, loading: statsLoading, reload: reloadStats } = useDashboardStats(granularity);
  const { totals, reload: reloadTotals } = useDashboardTotals();
  const { breakdown: equipmentStatus, loading: equipmentLoading, reload: reloadEquipment } = useDashboardBreakdown('equipment', 'status');
  const { breakdown: stockStatus, loading: stockLoading, reload: reloadStock } = useDashboardBreakdown('stocks', 'status');
  const { breakdown: toolkitStatus, loading: toolkitLoading, reload: reloadToolkit } = useDashboardBreakdown('toolkit', 'status');
  const { items: recentItems, loading: recentLoading, reload: reloadRecent } = useDashboardRecent(10);

  const handleRealtimeUpdate = useCallback(() => {
    reloadNumbers();
    reloadStats();
    reloadTotals();
    reloadEquipment();
    reloadStock();
    reloadToolkit();
    reloadRecent();
  }, [reloadNumbers, reloadStats, reloadTotals, reloadEquipment, reloadStock, reloadToolkit, reloadRecent]);

  useDashboardRealtime(handleRealtimeUpdate);

  const busiestBucket = useMemo(() => {
    if (!stats?.series?.length) return null;
    return stats.series.reduce((max, point) => (point.total > (max?.total ?? -1) ? point : max), null);
  }, [stats]);

  if (numbersLoading && !numbers) return <DashboardLoading />;
  if (error) return <DashboardError error={error} onRetry={reloadNumbers} />;

  const headerStats = numbers ? [
    { key: 'total', label: 'This Period', value: numbers.total, icon: 'Layers' },
    { key: 'growth', label: 'Growth', value: numbers.directionTotals.growth, icon: 'TrendingUp' },
    { key: 'loss', label: 'Loss', value: numbers.directionTotals.loss, icon: 'TrendingDown' },
  ] : [];

  const spotlightItems = numbers ? [
    { key: 'all-time', label: 'All-Time Records', value: totals?.total ?? '—', icon: 'Layers', tone: 'dark' },
    { key: 'net-score', label: 'Net Score This Period', value: numbers.netScore, icon: 'TrendingUp', tone: numbers.netScore >= 0 ? 'growth' : 'loss' },
    { key: 'busiest', label: busiestBucket ? `Busiest: ${busiestBucket.label}` : 'Busiest Period', value: busiestBucket?.total ?? 0, icon: 'Trophy', tone: 'neutral' },
    { key: 'collections', label: 'Collections Tracked', value: numbers.collections.length, icon: 'Layers', tone: 'neutral' },
  ] : [];

  return (
    <DashboardShell title={WELCOME_COPY.title} subtitle={WELCOME_COPY.subtitle} headerStats={headerStats} headerExtra={<MiniStatCards />}>
      <GranularityTabs active={granularity} onChange={setGranularity} loading={numbersLoading} />

      {spotlightItems.length > 0 && <SpotlightRow items={spotlightItems} />}

      {numbers && <ProjectTimeBar directionTotals={numbers.directionTotals} netScore={numbers.netScore} />}

      <div className="features screen dashboard panel-grid">
        <RadialScoreChart growth={numbers?.directionTotals.growth ?? 0} loss={numbers?.directionTotals.loss ?? 0} />
        {stats && <ActivityHeatStrip series={stats.series} />}
      </div>

      {numbers && <MetricsGrid numbers={numbers} />}

      {stats && (
        <div className="features screen dashboard panel-grid">
          <div className="features screen dashboard panel-span-2">
            <TrendSparklineGrid series={stats.series} collections={stats.collections} />
          </div>
        </div>
      )}

      <div className="features screen dashboard panel-grid-3">
        <BreakdownPanel title="Equipment Status" subtitle="Live breakdown" values={equipmentStatus?.values} loading={equipmentLoading} />
        <BreakdownPanel title="Stock Status" subtitle="Live breakdown" values={stockStatus?.values} loading={stockLoading} />
        <BreakdownPanel title="Toolkit Status" subtitle="Live breakdown" values={toolkitStatus?.values} loading={toolkitLoading} />
      </div>

      {numbers && (
        <div className="features screen dashboard panel-grid">
          <CollectionLeaderboard counts={numbers.counts} collections={numbers.collections} />
          <RecentActivityPanel items={recentItems} loading={recentLoading} />
        </div>
      )}
    </DashboardShell>
  );
};

export default Dashboard;
