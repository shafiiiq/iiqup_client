import { toDisplayLabel } from './dashboard.format.helper';
import { COLORS } from '../constants/dashboard.constant';

export const toBucketTotalsChart = (series) =>
  series.map((point) => ({ label: point.label, total: point.total }));

export const toNetScoreChart = (series) =>
  series.map((point) => ({
    label: point.label,
    netScore: point.netScore,
    cumulativeNetScore: point.cumulativeNetScore,
  }));

export const toCollectionTotals = (series, collections) => {
  const totals = {};
  collections.forEach(({ key }) => { totals[key] = 0; });
  series.forEach((point) => {
    Object.entries(point.counts).forEach(([key, count]) => {
      totals[key] = (totals[key] || 0) + count;
    });
  });
  return totals;
};

export const toActivityPieData = (series, collections) => {
  const totals = toCollectionTotals(series, collections);
  return collections
    .map(({ key, label }, index) => ({
      name: label,
      value: totals[key] || 0,
      color: COLORS.chartColors[index % COLORS.chartColors.length],
    }))
    .filter((slice) => slice.value > 0);
};

export const toActivityBarData = (series, collections) => {
  const totals = toCollectionTotals(series, collections);
  return collections
    .map(({ key, label }) => ({ name: label, count: totals[key] || 0 }))
    .filter((bar) => bar.count > 0);
};

export const toDirectionSeriesChart = (series) =>
  series.map((point) => ({
    label: point.label,
    growth: point.directionTotals?.growth || 0,
    loss: point.directionTotals?.loss || 0,
    neutral: point.directionTotals?.neutral || 0,
  }));

export const toBreakdownPieData = (values) =>
  values
    .filter((entry) => entry.count > 0)
    .map((entry, index) => ({
      name: toDisplayLabel(String(entry.value)),
      value: entry.count,
      color: COLORS.chartColors[index % COLORS.chartColors.length],
    }));
