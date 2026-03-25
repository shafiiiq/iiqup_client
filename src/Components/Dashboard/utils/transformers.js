import { COLORS } from './constants';

const SKIP_KEYS = new Set(['counts', 'total', '_id', '__v']);

const toLabel = (key) =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();

const hyphenToLabel = (key) =>
  key.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export const getComprehensiveStats = (data) => {
  if (!data) return { total: 0, collections: {}, rawKeys: [] };

  const SKIP_KEYS = new Set(['counts', 'total', '_id', '__v', '_counts', '_total']);

  const collections = {};
  const rawKeys = [];

  if (data._counts) {
    Object.entries(data._counts).forEach(([key, count]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
      collections[label] = count;
      rawKeys.push(key);
    });
  } else {
    Object.entries(data).forEach(([key, value]) => {
      if (!SKIP_KEYS.has(key) && Array.isArray(value)) {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
        collections[label] = value.length;
        rawKeys.push(key);
      }
    });
  }

  return {
    total: data._total || Object.values(collections).reduce((s, n) => s + n, 0),
    collections,
    rawKeys,
  };
};

export const prepareAnalyticsData = (data) => {
  if (!data) return [];
  return Object.entries(data)
    .filter(([key, value]) => !SKIP_KEYS.has(key) && Array.isArray(value) && value.length > 0)
    .map(([key, value], i) => ({
      name:  toLabel(key),
      value: value.length,
      color: COLORS.chartColors[i % COLORS.chartColors.length],
    }));
};

export const prepareBarChartData = (data) => {
  if (!data) return [];
  return Object.entries(data)
    .filter(([key, value]) => !SKIP_KEYS.has(key) && Array.isArray(value) && value.length > 0)
    .map(([key, value]) => ({
      name:  toLabel(key),
      count: value.length,
    }));
};

export const prepareStockPerformance = (data) => {
  if (!data?.stocks) return [];
  return data.stocks.slice(0, 15).map((s) => ({
    name:         s.product      || 'Unknown',
    currentStock: s.stockCount   || 0,
    minThreshold: s.minThreshold || 0,
    utilization:  s.stockCount > 0
      ? Math.min((s.stockCount / (s.maxThreshold || s.minThreshold * 2 || 1)) * 100, 100)
      : 0,
  }));
};

export const prepareToolkitPerformance = (data) => {
  if (!data?.toolkit) return [];
  return data.toolkit.slice(0, 15).map((t) => ({
    name:         t.name          || 'Unknown',
    totalStock:   t.totalStock    || 0,
    variants:     t.variants?.length || 0,
    availability: t.overallStatus === 'available' ? 100 : t.overallStatus === 'low' ? 50 : 10,
  }));
};

export const prepareComparisonChartData = (comparisonData, period) => {
  if (!comparisonData) return [];

  // New backend structure uses 'slices', old used 'comparison'
  const items = comparisonData.slices || comparisonData.comparison || [];
  if (!items.length) return [];

  return items.map((item) => {
    const label = item.label || item.date || item.month || String(item.year);

    const collections = {};
    Object.entries(item.counts || item.collections || {}).forEach(([key, value]) => {
      const displayLabel = key.includes('-') 
        ? key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
      collections[displayLabel] = value || 0;
    });

    return { label, ...collections, Total: item.total };
  });
};

export const generateTrendsData = (data) => {
  const periods = ['daily', 'weekly', 'monthly', 'yearly'];
  const labels  = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

  const allKeys = new Set();
  periods.forEach((p) => {
    if (data[p]) {
      Object.entries(data[p]).forEach(([key, value]) => {
        if (!SKIP_KEYS.has(key) && Array.isArray(value)) allKeys.add(key);
      });
    }
  });

  return periods.map((p, i) => {
    const point = { period: labels[i] };
    allKeys.forEach((key) => { point[key] = data[p]?.[key]?.length || 0; });
    return point;
  });
};

// ─── Company performance progressive line ─────────────────────────────────────
// Buckets ALL documents from ALL collections by week → cumulative total
// This shows where the company is going over time
export const prepareCompanyPerformance = (allPeriodsData) => {
  const allDocs = [];

  Object.values(allPeriodsData).forEach((periodData) => {
    if (!periodData) return;
    Object.entries(periodData).forEach(([key, value]) => {
      if (!SKIP_KEYS.has(key) && Array.isArray(value)) {
        value.forEach((doc) => {
          if (doc.createdAt) allDocs.push({ date: doc.createdAt, collection: key });
        });
      }
    });
  });

  if (!allDocs.length) return [];

  allDocs.sort((a, b) => new Date(a.date) - new Date(b.date));

  const buckets = {};
  allDocs.forEach(({ date, collection }) => {
    const d    = new Date(date);
    const year = d.getFullYear();
    const week = Math.ceil((d - new Date(year, 0, 1)) / 604800000);
    const key  = `${year}-W${String(week).padStart(2, '0')}`;

    if (!buckets[key]) buckets[key] = { week: key, total: 0 };
    buckets[key].total++;
    buckets[key][toLabel(collection)] = (buckets[key][toLabel(collection)] || 0) + 1;
  });

  let cumulative = 0;
  return Object.values(buckets).map((b) => {
    cumulative += b.total;
    return { ...b, cumulative };
  });
};

const isDateValue = (key, value) => {
  if (typeof value !== 'string') return false;
  const keyLower = key.toLowerCase();
  if (keyLower.includes('date') || keyLower.includes('at')) return true;
  return /^\d{4}-\d{2}-\d{2}/.test(value);
};

const formatDate = (value) => {
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const day   = d.getDate();
    const month = d.toLocaleString('default', { month: 'long' });
    const year  = String(d.getFullYear()).slice(2);
    return `${day} ${month} ${year}`;
  } catch {
    return value;
  }
};

export const getActivityContent = (update) => {
  const SKIP_FIELDS = new Set([
    '_id', '__v', 'createdAt', 'updatedAt', 'content',
    '_collection', '_label', 'source', 'id',
  ]);

  const fields = Object.entries(update)
    .filter(([key, value]) =>
      !SKIP_FIELDS.has(key) &&
      value !== null &&
      value !== undefined &&
      value !== '' &&
      !Array.isArray(value) &&
      typeof value !== 'object'
    )
    .map(([key, value]) => {
      const label      = toLabel(key);
      const displayVal = (() => {
        if (value === true  || value === 'true')  return 'Yes';
        if (value === false || value === 'false') return 'No';
        if (isDateValue(key, String(value))) return formatDate(value);
        return value;
      })();
      return `<span style="font-size:1.2rem"><span style="color:var(--color-text-secondary)">${label}:</span> <span style="color:var(--color-text-primary)">${displayVal}</span></span>`;
    });

  return `
    <div style="display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:6px">
      ${fields.join('')}
    </div>
  `;
};