import { API_URI }  from '../../../constants';
import { apiRequest } from '../../../utils/api';
import { TAB_CACHE_TTL, COMPARISON_CACHE_TTL, EQUIPMENT_CACHE_TTL } from '../utils/constants';

// ─── Period map ───────────────────────────────────────────────────────────────
const PERIOD_MAP = {
  daily:   'today',
  weekly:  'week',
  monthly: 'month',
  yearly:  'year',
};

// ─── Comparison range builders ────────────────────────────────────────────────
const COMP_RANGE_MAP = {
  days: () => Array.from({ length: 5 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    const e = new Date(d); e.setHours(23,59,59,999);
    return { label: d.toISOString().split('T')[0], start: d.toISOString(), end: e.toISOString() };
  }).reverse(),
  months: () => Array.from({ length: 5 }, (_, i) => {
    const s = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
    const e = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0, 23,59,59,999);
    return { label: s.toLocaleString('default', { month: 'long', year: 'numeric' }), start: s.toISOString(), end: e.toISOString() };
  }).reverse(),
  years: () => Array.from({ length: 5 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { label: String(y), start: new Date(y,0,1).toISOString(), end: new Date(y,11,31,23,59,59,999).toISOString() };
  }).reverse(),
};

// ─── Caches ───────────────────────────────────────────────────────────────────
const _tabCache = {
  data:       { daily: null, weekly: null, monthly: null, yearly: null },
  timestamps: { daily: 0,    weekly: 0,    monthly: 0,    yearly: 0    },
};

const _compCache = {
  data:       { days: null, months: null, years: null },
  timestamps: { days: 0,    months: 0,    years: 0    },
};

let _equipmentCache     = null;
let _equipmentCacheTime = 0;

// ─── Tab data — records for charts/tables (capped per collection) ─────────────
export const fetchTabData = async (period = 'daily', forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && _tabCache.data[period] && now - _tabCache.timestamps[period] < TAB_CACHE_TTL)
    return _tabCache.data[period];

  const res    = await apiRequest(`${API_URI}/dashboard/historical?period=${PERIOD_MAP[period]}`, 'GET');
  const result = await res.json();

  const tabData = {
    ...result.data?.records,  // collection arrays (capped) for table display
    _counts: result.data?.counts,  // exact counts for metrics/charts
    _total:  result.data?.total,
  };

  _tabCache.data[period]       = tabData;
  _tabCache.timestamps[period] = now;
  return tabData;
};

// ─── Real time analytics — backend does ALL processing, frontend just displays ─
export const generateRealTimeAnalytics = async () => {
  const res    = await apiRequest(`${API_URI}/dashboard/realtime-stats`);
  const result = await res.json();
  const d      = result.data || {};

  return {
    totalEquipment:     d.equipment?.total       || 0,
    activeEquipment:    d.equipment?.active      || 0,
    idleEquipment:      d.equipment?.idle        || 0,
    inMaintenance:      d.equipment?.maintenance || 0,
    pendingMaintenance: d.pendingComplaints      || 0,
    criticalAlerts:     d.criticalAlerts         || 0,
    efficiency:         d.efficiency?.pct        || 95,
    trends:             d.trends                 || [],
    stockHealth:        d.stockHealth            || [],
    toolkitStatus:      d.toolkitStatus          || [],
    performanceMetrics: d.performanceMetrics     || [],
    todayCounts:        d.todayCounts            || {},
  };
};

// ─── Brand enrichment for maintenance/tyre tables ────────────────────────────
const getEquipmentData = async () => {
  const now = Date.now();
  if (!_equipmentCache || now - _equipmentCacheTime > EQUIPMENT_CACHE_TTL) {
    const res = await apiRequest(`${API_URI}/equipments/get-equipments`);
    _equipmentCache = await res.json();
    _equipmentCacheTime = now;
  }
  return _equipmentCache;
};

export const getBrandMap = async () => {
  const equipData = await getEquipmentData();
  const map = new Map();
  (equipData.data || []).forEach((eq) => map.set(eq.regNo.toString(), eq.brand));
  return map;
};

export const addBrandToData = (dataset, brandMap) => {
  dataset?.maintenanceHistory?.forEach((m) => {
    m.brand = brandMap.get(m.regNo?.toString()) || 'Unknown';
  });
  dataset?.tyreHistory?.forEach((t) => {
    t.brand = brandMap.get(t.equipmentNo?.toString()) || 'Unknown';
  });
};

// ─── Comparison ───────────────────────────────────────────────────────────────
export const fetchComparisonData = async (type) => {
  const now = Date.now();
  if (_compCache.data[type] && now - _compCache.timestamps[type] < COMPARISON_CACHE_TTL)
    return _compCache.data[type];

  const ranges = COMP_RANGE_MAP[type]();
  const res    = await apiRequest(`${API_URI}/dashboard/comparison`, 'POST', { ranges });
  if (!res.ok) throw new Error(`Failed to fetch ${type} comparison`);
  const result = await res.json();
  _compCache.data[type]       = result.data;
  _compCache.timestamps[type] = now;
  return result.data;
};

// ─── Cache clear ──────────────────────────────────────────────────────────────
export const clearAllCaches = () => {
  _equipmentCache     = null;
  _equipmentCacheTime = 0;
  Object.keys(_tabCache.data).forEach((k)  => { _tabCache.data[k]  = null; _tabCache.timestamps[k]  = 0; });
  Object.keys(_compCache.data).forEach((k) => { _compCache.data[k] = null; _compCache.timestamps[k] = 0; });
};