import { MAINTENANCE_LIST_TABS } from './maintenance.list.constant';

const formatBadge = (loadedCount, totalCount, isCurrentTab) =>
  isCurrentTab ? `${loadedCount}/${totalCount ?? 0}` : String(totalCount ?? 0);

export const buildMaintenanceListNavTree = (tabCounts, { activeTab, loadedCount }) => [
  { key: MAINTENANCE_LIST_TABS.ALL, label: 'All Services', badge: formatBadge(loadedCount, tabCounts.total, activeTab === MAINTENANCE_LIST_TABS.ALL) },
  { key: MAINTENANCE_LIST_TABS.NORMAL, label: 'Normal Service', badge: formatBadge(loadedCount, tabCounts.normal, activeTab === MAINTENANCE_LIST_TABS.NORMAL) },
  { key: MAINTENANCE_LIST_TABS.OIL, label: 'Oil Service', badge: formatBadge(loadedCount, tabCounts.oil, activeTab === MAINTENANCE_LIST_TABS.OIL) },
  { key: MAINTENANCE_LIST_TABS.MAJOR, label: 'Major Works', badge: formatBadge(loadedCount, tabCounts.major, activeTab === MAINTENANCE_LIST_TABS.MAJOR) },
  { key: MAINTENANCE_LIST_TABS.TYRE, label: 'Tyre Service', badge: formatBadge(loadedCount, tabCounts.tyre, activeTab === MAINTENANCE_LIST_TABS.TYRE) },
  { key: MAINTENANCE_LIST_TABS.BATTERY, label: 'Battery Service', badge: formatBadge(loadedCount, tabCounts.battery, activeTab === MAINTENANCE_LIST_TABS.BATTERY) },
];