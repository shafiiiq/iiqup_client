import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  ComposedChart, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { COLORS } from '../utils/constants';
import { prepareCompanyPerformance } from '../utils/transformers';

const CompanyPerformance = ({ dashboardData }) => {
  const perfData = useMemo(() => prepareCompanyPerformance(dashboardData), [dashboardData]);

  const { direction, pct } = useMemo(() => {
    if (perfData.length < 4) return { direction: 'neutral', pct: 0 };
    const mid   = Math.floor(perfData.length / 2);
    const first = perfData.slice(0, mid).reduce((s, d) => s + d.total, 0);
    const last  = perfData.slice(mid).reduce((s, d)  => s + d.total, 0);
    if (first === 0) return { direction: 'neutral', pct: 0 };
    const change = ((last - first) / first) * 100;
    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'neutral',
      pct:       Math.abs(change).toFixed(1),
    };
  }, [perfData]);

  const collectionKeys = useMemo(() => {
    if (!perfData.length) return [];
    return Object.keys(perfData[0]).filter(k => k !== 'week' && k !== 'total' && k !== 'cumulative');
  }, [perfData]);

  const TrendIcon  = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
  const trendColor = direction === 'up' ? COLORS.success : direction === 'down' ? COLORS.danger : COLORS.warning;

  if (!perfData.length) return null;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3>Growth</h3>
            <p>Cumulative activity growth — where the company is headed</p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 12,
            background: `${trendColor}22`, border: `1px solid ${trendColor}44`,
          }}>
            <TrendIcon size={18} style={{ color: trendColor }} />
            <span style={{ color: trendColor, fontWeight: 600, fontSize: 14 }}>
              {direction === 'neutral' ? 'Stable' : `${pct}% ${direction === 'up' ? 'growth' : 'decline'}`}
            </span>
          </div>
        </div>
      </div>

      <div className="chart-container large">
        <ResponsiveContainer width="100%" height={420}>
          <ComposedChart data={perfData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="week" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip contentStyle={{
              background: 'var(--color-background-secondary)',
              border: '1px solid var(--color-border-tertiary)',
              borderRadius: 8,
            }} />
            <Legend />
            <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke={COLORS.primaryLight} strokeWidth={3} dot={false} name="Cumulative Total" />
            <Area yAxisId="left" type="monotone" dataKey="total" stroke={COLORS.accent} fill={COLORS.accent} fillOpacity={0.15} strokeWidth={2} name="Weekly Activity" />
            {collectionKeys.map((key, i) => (
              <Line key={key} yAxisId="left" type="monotone" dataKey={key} stroke={COLORS.chartColors[i % COLORS.chartColors.length]} strokeWidth={1.5} dot={false} strokeOpacity={0.7} name={key} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CompanyPerformance;