import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import WebSocketService from '../../../websocket/websocket';
import {
  fetchTabData, getBrandMap, addBrandToData, generateRealTimeAnalytics,
} from '../api/dashboard.api';
import {
  getComprehensiveStats, prepareAnalyticsData, prepareBarChartData,
  prepareStockPerformance, prepareToolkitPerformance,
} from '../utils/transformers';
import { TABS } from '../utils/constants';

const INITIAL_DATA = Object.fromEntries([...TABS, 'realTime'].map((k) => [k, null]));

export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState(INITIAL_DATA);
  const [activeTab,     setActiveTabState] = useState(
    () => localStorage.getItem('dashboardActiveTab') || 'daily'
  );
  const [loading,    setLoading]    = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);
  const pendingTabRef = useRef(null);

  // ─── Load a single tab ─────────────────────────────────────────────────────
  const loadTab = useCallback(async (period) => {
    try {
      const tabData  = await fetchTabData(period);
      const brandMap = await getBrandMap();
      if (tabData) addBrandToData(tabData, brandMap);
      return tabData;
    } catch (err) {
      throw err;
    }
  }, []);

  // ─── Load only realtime stats — called by WebSocket event ─────────────────
  const loadRealTimeData = useCallback(async () => {
    try {
      const realTime = await generateRealTimeAnalytics();
      setDashboardData((prev) => ({ ...prev, realTime }));
    } catch (err) {
      console.error('RealTime refresh error:', err);
    }
  }, []);

  // ─── WebSocket listener — refresh realtime on any data change ─────────────
  useEffect(() => {
    const unsub = WebSocketService.on('dashboard_update', ({ collectionKeys }) => {
      loadRealTimeData();

      const currentTab = localStorage.getItem('dashboardActiveTab') || 'daily';
      const tabData    = dashboardData[currentTab];

      const shouldReload = !collectionKeys ||
        collectionKeys.some(key => tabData && tabData[key] !== undefined);

      if (shouldReload) {
        loadTab(currentTab).then((newTabData) => {
          setDashboardData((prev) => ({ ...prev, [currentTab]: newTabData }));
        });
      }
    });
    return unsub;
  }, [loadRealTimeData, loadTab, dashboardData]);

  // ─── Initial load ──────────────────────────────────────────────────────────
  const loadDashboardData = useCallback(async (showRefresh = false) => {
    try {
      showRefresh ? setRefreshing(true) : setLoading(true);
      const currentTab = localStorage.getItem('dashboardActiveTab') || 'daily';
      const tabData    = await loadTab(currentTab);
      const realTime   = await generateRealTimeAnalytics();
      setDashboardData((prev) => ({ ...prev, [currentTab]: tabData, realTime }));
      setError(null);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadTab]);

  // ─── Tab switch ────────────────────────────────────────────────────────────
  const handleTabChange = useCallback(async (newTab) => {
    localStorage.setItem('dashboardActiveTab', newTab);
    if (dashboardData[newTab]) { setActiveTabState(newTab); return; }

    pendingTabRef.current = newTab;
    setTabLoading(true);
    try {
      const tabData = await loadTab(newTab);
      setDashboardData((prev) => ({ ...prev, [newTab]: tabData }));
      setActiveTabState(newTab);
    } catch (err) {
      console.error(`Tab load error (${newTab}):`, err);
    } finally {
      setTabLoading(false);
      pendingTabRef.current = null;
    }
  }, [dashboardData, loadTab]);

  // ─── Mount ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ─── DateTime ─────────────────────────────────────────────────────────────
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [lastUpdated,     setLastUpdated]      = useState('');

  useEffect(() => {
    const tick = () => {
      const now  = new Date();
      const date = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
      });
      setCurrentDateTime(`${date} | ${time}`);
      setLastUpdated(`Last updated: ${time}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const currentData        = useMemo(() => dashboardData[activeTab],               [dashboardData, activeTab]);
  const realTimeData       = useMemo(() => dashboardData.realTime,                 [dashboardData.realTime]);
  const currentStats       = useMemo(() => getComprehensiveStats(currentData),     [currentData]);
  const analyticsData      = useMemo(() => prepareAnalyticsData(currentData),      [currentData]);
  const barChartData       = useMemo(() => prepareBarChartData(currentData),       [currentData]);
  const stockPerformance   = useMemo(() => prepareStockPerformance(currentData),   [currentData]);
  const toolkitPerformance = useMemo(() => prepareToolkitPerformance(currentData), [currentData]);

  return {
    activeTab, dashboardData, loading, tabLoading, refreshing, error,
    currentDateTime, lastUpdated,
    handleTabChange, handleRefresh: () => loadDashboardData(true),
    currentData, realTimeData, currentStats,
    analyticsData, barChartData, stockPerformance, toolkitPerformance,
  };
};