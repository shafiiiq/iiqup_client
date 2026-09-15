import React, { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DashboardShell from './DashboardShell';
import GranularityTabs from './fragments/GranularityTabs';
import DataTablePanel from './fragments/DataTablePanel';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useDashboardRecords } from '../hooks/useDashboardRecords';
import { useDashboardRealtime } from '../hooks/useDashboardRealtime';
import { toActivityBarData } from '../helper/dashboard.chart.helper';
import { findHistoricalLeaf } from '../constants/historical.constant';
import { COLORS, DEFAULT_GRANULARITY, HISTORICAL_COPY } from '../constants/dashboard.constant';
import './fragments/DashboardPanels.css';

const SummaryView = ({ granularity, onGranularityChange }) => {
  const { stats, loading, error, reload } = useDashboardStats(granularity);
  useDashboardRealtime(reload);

  if (loading && !stats) return <div className="features screen dashboard panel-empty"><p>Loading…</p></div>;
  if (error) return <div className="features screen dashboard panel-empty"><p>{error}</p></div>;

  const barKeys = stats.collections.map(({ key }) => key);
  const chartData = stats.series.map((point) => ({ label: point.label, ...point.counts }));

  return (
    <div className="features screen dashboard panel-card">
      <div className="features screen dashboard panel-card-header">
        <h3>Activity Over Time</h3>
        <p>Every record, bucketed by the selected calendar period</p>
      </div>

      <GranularityTabs active={granularity} onChange={onGranularityChange} loading={loading} />

      {toActivityBarData(stats.series, stats.collections).length > 0 ? (
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" angle={-45} textAnchor="end" height={70} interval={0} tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Legend wrapperStyle={{ paddingTop: 16 }} />
            {barKeys.map((key, i) => (
              <Bar key={key} dataKey={key} stackId="a" fill={COLORS.chartColors[i % COLORS.chartColors.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="features screen dashboard panel-empty">
          <TrendingUp size={40} />
          <p>No activity recorded for this period</p>
        </div>
      )}
    </div>
  );
};

const CategoryView = ({ group, category, granularity, onGranularityChange }) => {
  const leaf = findHistoricalLeaf(group, category);
  const records = useDashboardRecords(leaf?.dataKey, granularity);

  const handleRealtimeUpdate = useCallback(() => records.fetchPage(records.page), [records]);
  useDashboardRealtime(handleRealtimeUpdate);

  if (!leaf) {
    return <div className="features screen dashboard panel-card"><div className="features screen dashboard panel-empty"><p>Unknown category</p></div></div>;
  }

  return (
    <>
      <div className="features screen dashboard panel-card" style={{ marginBottom: '1.5rem' }}>
        <div className="features screen dashboard panel-card-header">
          <h3>{leaf.label}</h3>
          <p>{leaf.groupLabel} · {records.totalCount} records this period</p>
        </div>
        <GranularityTabs active={granularity} onChange={onGranularityChange} loading={records.loading} />
      </div>

      <DataTablePanel title={leaf.label} subtitle={`Page ${records.page} of ${records.totalPages || 1}`} docs={records.data} />

      {records.totalCount > 0 && (
        <div className="features screen dashboard panel-card">
          <div className="features screen dashboard panel-pagination">
            <button
              type="button"
              className="features screen dashboard panel-pagination-btn"
              disabled={records.page <= 1 || records.loading}
              onClick={() => records.fetchPage(records.page - 1)}
            >
              Previous
            </button>
            <span className="features screen dashboard panel-pagination-status">
              Page {records.page} of {records.totalPages}
            </span>
            <button
              type="button"
              className="features screen dashboard panel-pagination-btn"
              disabled={!records.hasMore || records.loading}
              onClick={() => records.fetchPage(records.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const HistoricalData = () => {
  const { group, category } = useParams();
  const [granularity, setGranularity] = useState(DEFAULT_GRANULARITY);

  return (
    <DashboardShell title={HISTORICAL_COPY.title} subtitle={HISTORICAL_COPY.subtitle} headerStats={[]}>
      {group && category ? (
        <CategoryView group={group} category={category} granularity={granularity} onGranularityChange={setGranularity} />
      ) : (
        <SummaryView granularity={granularity} onGranularityChange={setGranularity} />
      )}
    </DashboardShell>
  );
};

export default HistoricalData;
