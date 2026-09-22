import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useMiniStats } from '../../hooks/useMiniStats';
import './MiniStatCards.css';

const CARDS = [
  { key: 'purchase', label: 'Purchase Orders', color: '#7c9cf5' },
  { key: 'hire', label: 'Hire Orders', color: '#3fb27f' },
  { key: 'quotation', label: 'Quotation', color: '#f5c451' },
  { key: 'backcharge', label: 'Backcharge', color: '#e0654f' },
];

const formatCurrency = (value) =>
  `QAR ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const MiniStatCard = ({ label, color, data }) => {
  if (!data) return null;
  const { summary, series } = data;
  const growth = summary?.growthPercent ?? 0;
  const positive = growth >= 0;
  const chartData = (series?.buckets || []).map((b) => ({ value: b.total }));

  return (
    <div className="features screen dashboard mini-stat-card">
      <div className="features screen dashboard mini-stat-top">
        <span className="features screen dashboard mini-stat-label">{label}</span>
        <span className={`features screen dashboard mini-stat-rate ${positive ? 'up' : 'down'}`}>
          {positive ? '+' : ''}{growth.toFixed(1)}%
        </span>
      </div>
      <span className="features screen dashboard mini-stat-value">{formatCurrency(summary?.totalCost)}</span>
      <div className="features screen dashboard mini-stat-chart">
        <ResponsiveContainer width="100%" height={32}>
          <AreaChart data={chartData}>
            <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.25} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const MiniStatCards = () => {
  const { data, loading } = useMiniStats();
  if (loading) return null;

  return (
    <div className="features screen dashboard mini-stat-cards">
      {CARDS.map((card) => (
        <MiniStatCard key={card.key} label={card.label} color={card.color} data={data[card.key]} />
      ))}
    </div>
  );
};

export default MiniStatCards;