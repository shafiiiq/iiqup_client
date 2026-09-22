import React, { useState } from 'react';
import useHireOrderStats from '../../hooks/useHireOrderStats';
import HireOrderStatsOverview from './HireOrderStatsOverview';
import HireOrderStatsAnalytics from './HireOrderStatsAnalytics';
import HireOrderStatsGrowth from './HireOrderStatsGrowth';
import { STATS_GRANULARITIES, DEFAULT_STATS_GRANULARITY, STATS_TAB } from '../../constants/hire.order.list.constant';
import './HireOrderStats.css';
import Controls from '@/shared/components/widgets/controls/Controls';

function HireOrderStats({ statsTab }) {
    const [granularity, setGranularity] = useState(DEFAULT_STATS_GRANULARITY);
    const { totals, summary, series, growth, loading, error, reload } = useHireOrderStats(granularity);

    return (
        <div className="hire order stats">
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
                <div className="hire order stats error">
                    <p>{error}</p>
                    <button type="button" onClick={reload}>Retry</button>
                </div>
            ) : statsTab === STATS_TAB.ANALYTICS ? (
                <HireOrderStatsAnalytics series={series} loading={loading} />
            ) : statsTab === STATS_TAB.GROWTH ? (
                <HireOrderStatsGrowth summary={summary} growth={growth} loading={loading} />
            ) : (
                <HireOrderStatsOverview summary={summary} totals={totals} series={series} loading={loading} />
            )}
        </div>
    );
}

export default HireOrderStats;