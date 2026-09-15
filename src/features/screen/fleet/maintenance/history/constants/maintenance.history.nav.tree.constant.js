import { MAINTENANCE_HISTORY_TABS } from './maintenance.history.constant';

const formatBadge = (loaded, total, isCurrent) => (isCurrent ? `${loaded}/${total ?? 0}` : String(total ?? 0));

export const buildMaintenanceHistoryNavTree = (tabCounts, current) => {
  const { activeTab, loadedCount } = current;

  return [
    { key: MAINTENANCE_HISTORY_TABS.ALL, label: 'All Services', badge: formatBadge(loadedCount, tabCounts.total, activeTab === MAINTENANCE_HISTORY_TABS.ALL) },
    { key: MAINTENANCE_HISTORY_TABS.NORMAL, label: 'Normal Service', badge: formatBadge(loadedCount, tabCounts.normal, activeTab === MAINTENANCE_HISTORY_TABS.NORMAL) },
    { key: MAINTENANCE_HISTORY_TABS.OIL, label: 'Oil Service', badge: formatBadge(loadedCount, tabCounts.oil, activeTab === MAINTENANCE_HISTORY_TABS.OIL) },
    { key: MAINTENANCE_HISTORY_TABS.MAJOR, label: 'Major Works', badge: formatBadge(loadedCount, tabCounts.major, activeTab === MAINTENANCE_HISTORY_TABS.MAJOR) },
    { key: MAINTENANCE_HISTORY_TABS.TYRE, label: 'Tyre Service', badge: formatBadge(loadedCount, tabCounts.tyre, activeTab === MAINTENANCE_HISTORY_TABS.TYRE) },
    { key: MAINTENANCE_HISTORY_TABS.BATTERY, label: 'Battery Service', badge: formatBadge(loadedCount, tabCounts.battery, activeTab === MAINTENANCE_HISTORY_TABS.BATTERY) },
  ];
};