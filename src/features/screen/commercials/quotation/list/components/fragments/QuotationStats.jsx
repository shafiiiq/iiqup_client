import React, { useState } from 'react';
import useQuotationStats from '../../hooks/useQuotationStats';
import QuotationStatsOverview from './QuotationStatsOverview';
import QuotationStatsAnalytics from './QuotationStatsAnalytics';
import QuotationStatsGrowth from './QuotationStatsGrowth';
import { STATS_GRANULARITIES, DEFAULT_STATS_GRANULARITY, STATS_TAB } from '../../constants/quotation.list.constant';
import './QuotationStats.css';
import Controls from '@/shared/components/widgets/controls/Controls';

function QuotationStats({ statsTab }) {
    const [granularity, setGranularity] = useState(DEFAULT_STATS_GRANULARITY);
    const { totals, summary, series, growth, loading, error, reload } = useQuotationStats(granularity);

    return (
        <div className="quotation list stats">
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
                <div className="quotation list stats error">
                    <p>{error}</p>
                    <button type="button" onClick={reload}>Retry</button>
                </div>
            ) : statsTab === STATS_TAB.ANALYTICS ? (
                <QuotationStatsAnalytics series={series} loading={loading} />
            ) : statsTab === STATS_TAB.GROWTH ? (
                <QuotationStatsGrowth summary={summary} growth={growth} loading={loading} />
            ) : (
                <QuotationStatsOverview summary={summary} totals={totals} series={series} loading={loading} />
            )}
        </div>
    );
}

export default QuotationStats;