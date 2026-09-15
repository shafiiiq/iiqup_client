import React, { useCallback, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import DashboardShell from './DashboardShell';
import { DashboardLoading, DashboardError } from './DashboardStates';
import GranularityTabs from './fragments/GranularityTabs';
import BreakdownPanel from './fragments/BreakdownPanel';
import TrendSparklineGrid from './fragments/TrendSparklineGrid';
import CollectionLeaderboard from './fragments/CollectionLeaderboard';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useDashboardBreakdown } from '../hooks/useDashboardBreakdown';
import { useDashboardRealtime } from '../hooks/useDashboardRealtime';
import { toNetScoreChart, toCollectionTotals } from '../helper/dashboard.chart.helper';
import { COLORS, DEFAULT_GRANULARITY, GRAPHS_COPY } from '../constants/dashboard.constant';
import './fragments/DashboardPanels.css';

const Graphs = () => {
  const [granularity, setGranularity] = useState(DEFAULT_GRANULARITY);
  const { stats, loading, error, reload } = useDashboardStats(granularity);
  const { breakdown: stockStatus, loading: stockLoading, reload: reloadStock } = useDashboardBreakdown('stocks', 'status');
  const { breakdown: toolkitStatus, loading: toolkitLoading, reload: reloadToolkit } = useDashboardBreakdown('toolkit', 'status');

  const handleRealtimeUpdate = useCallback(() => {
    reload();
    reloadStock();
    reloadToolkit();
  }, [reload, reloadStock, reloadToolkit]);

  useDashboardRealtime(handleRealtimeUpdate);

  if (loading && !stats) return <DashboardLoading />;
  if (error) return <DashboardError error={error} onRetry={reload} />;

  const chartData = toNetScoreChart(stats.series);
  const finalScore = chartData.length ? chartData[chartData.length - 1].cumulativeNetScore : 0;
  const trendColor = finalScore > 0 ? COLORS.success : finalScore < 0 ? COLORS.danger : COLORS.warning;
  const collectionTotals = toCollectionTotals(stats.series, stats.collections);

  return (
    <DashboardShell title={GRAPHS_COPY.title} subtitle={GRAPHS_COPY.subtitle} headerStats={[]}>
      <GranularityTabs active={granularity} onChange={setGranularity} loading={loading} />

      <div className="features screen dashboard panel-card" style={{ marginBottom: '1.5rem' }}>
        <div
          className="features screen dashboard panel-card-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <div>
            <h3>Company Growth</h3>
            <p>Cumulative net score — growth collections add, loss collections subtract</p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 999,
            background: `${trendColor}22`, border: `1px solid ${trendColor}44`,
          }}>
            <TrendingUp size={16} style={{ color: trendColor }} />
            <span style={{ color: trendColor, fontWeight: 700, fontSize: 13 }}>Net {finalScore}</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="label" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="netScore" fill={COLORS.accent} name="Period Net Score" radius={[6, 6, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="cumulativeNetScore" stroke={COLORS.primaryLight} strokeWidth={3} dot={false} name="Cumulative Net Score" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="features screen dashboard panel-grid">
        <BreakdownPanel title="Stock Health" subtitle="Current stock status distribution" values={stockStatus?.values} loading={stockLoading} />
        <BreakdownPanel title="Toolkit Health" subtitle="Current toolkit status distribution" values={toolkitStatus?.values} loading={toolkitLoading} />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <TrendSparklineGrid series={stats.series} collections={stats.collections} />
      </div>

      <CollectionLeaderboard counts={collectionTotals} collections={stats.collections} />
    </DashboardShell>
  );
};

export default Graphs;
