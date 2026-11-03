import React, { useState } from 'react';
import Controls from '@/shared/components/widgets/controls/Controls';
import { useBackchargeStats } from '../../hooks/useBackchargeStats';
import BackchargeStatsOverview from './BackchargeStatsOverview';
import BackchargeStatsAnalytics from './BackchargeStatsAnalytics';
import BackchargeStatsGrowth from './BackchargeStatsGrowth';
import { STATS_GRANULARITIES, DEFAULT_STATS_GRANULARITY, STATS_TAB } from '../../constants/backcharge.list.constant';
import './BackchargeStats.css';

function BackchargeStats({ statsTab }) {
  const [granularity, setGranularity] = useState(DEFAULT_STATS_GRANULARITY);
  const { totals, summary, series, growth, loading, error, reload } = useBackchargeStats(granularity);

  return (
    <div className="backcharge stats">
      <Controls
        items={STATS_GRANULARITIES.map((tab) => ({
          key: tab.key,
          text: tab.label,
          onClick: () => setGranularity(tab.key),
          disabled: loading,
          colorScheme: granularity === tab.key ? 'warning-400' : 'primary-500',
          textColor: granularity === tab.key ? 'black-100' : 'white-100',
          font: 'md',
          animation: '',
          squircle: '4xl',
          height: '44px',
        }))}
        justify="start"
      />

      {error ? (
        <div className="backcharge stats error">
          <p>{error}</p>
          <button type="button" onClick={reload}>Retry</button>
        </div>
      ) : statsTab === STATS_TAB.ANALYTICS ? (
        <BackchargeStatsAnalytics series={series} loading={loading} />
      ) : statsTab === STATS_TAB.GROWTH ? (
        <BackchargeStatsGrowth summary={summary} growth={growth} loading={loading} />
      ) : (
        <BackchargeStatsOverview summary={summary} totals={totals} series={series} loading={loading} />
      )}
    </div>
  );
}

export default BackchargeStats;