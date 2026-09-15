import React, { useCallback, useState } from 'react';
import { FileText } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import DashboardShell from './DashboardShell';
import { DashboardLoading, DashboardError } from './DashboardStates';
import GranularityTabs from './fragments/GranularityTabs';
import BreakdownPanel from './fragments/BreakdownPanel';
import DistributionTreemap from './fragments/DistributionTreemap';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useDashboardBreakdown } from '../hooks/useDashboardBreakdown';
import { useDashboardRealtime } from '../hooks/useDashboardRealtime';
import { toActivityPieData, toActivityBarData, toDirectionSeriesChart, toCollectionTotals } from '../helper/dashboard.chart.helper';
import { COLORS, DEFAULT_GRANULARITY, ANALYTICS_COPY } from '../constants/dashboard.constant';
import './fragments/DashboardPanels.css';

const EmptyState = ({ label }) => (
  <div className="features screen dashboard panel-empty">
    <FileText size={40} />
    <p>{label}</p>
  </div>
);

const Analytics = () => {
  const [granularity, setGranularity] = useState(DEFAULT_GRANULARITY);
  const { stats, loading, error, reload } = useDashboardStats(granularity);
  const { breakdown: stockStatus, loading: stockLoading, reload: reloadStock } = useDashboardBreakdown('stocks', 'status');

  const handleRealtimeUpdate = useCallback(() => {
    reload();
    reloadStock();
  }, [reload, reloadStock]);

  useDashboardRealtime(handleRealtimeUpdate);

  if (loading && !stats) return <DashboardLoading />;
  if (error) return <DashboardError error={error} onRetry={reload} />;

  const pieData = toActivityPieData(stats.series, stats.collections);
  const barData = toActivityBarData(stats.series, stats.collections);
  const directionSeries = toDirectionSeriesChart(stats.series);
  const collectionTotals = toCollectionTotals(stats.series, stats.collections);

  return (
    <DashboardShell title={ANALYTICS_COPY.title} subtitle={ANALYTICS_COPY.subtitle} headerStats={[]}>
      <GranularityTabs active={granularity} onChange={setGranularity} loading={loading} />

      <div className="features screen dashboard panel-grid">
        <div className="features screen dashboard panel-card">
          <div className="features screen dashboard panel-card-header">
            <h3>Activity Distribution</h3>
            <p>Share of records by collection this period</p>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} records`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState label="No activity data for this period" />}
        </div>

        <div className="features screen dashboard panel-card">
          <div className="features screen dashboard panel-card-header">
            <h3>Records by Type</h3>
            <p>Total records per collection this period</p>
          </div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip formatter={(v) => [`${v} records`, 'Count']} />
                <Bar dataKey="count" fill={COLORS.primaryLight} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState label="No data available" />}
        </div>

        <div className="features screen dashboard panel-card panel-span-2">
          <div className="features screen dashboard panel-card-header">
            <h3>Growth vs Loss</h3>
            <p>Per-period growth and loss volume, by classification in the model registry</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={directionSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="growth" fill={COLORS.success} name="Growth" />
              <Bar dataKey="loss" fill={COLORS.danger} name="Loss" />
              <Bar dataKey="neutral" fill={COLORS.info} name="Neutral" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <BreakdownPanel
          title="Stock Status"
          subtitle="Current inventory status overview"
          values={stockStatus?.values}
          loading={stockLoading}
        />

        <DistributionTreemap counts={collectionTotals} collections={stats.collections} />
      </div>
    </DashboardShell>
  );
};

export default Analytics;
