import { EQUIPMENT_TABS, EQUIPMENT_STATUS_FILTERS, EQUIPMENT_ALL_SITES_FILTER } from './equipment.constant';

const formatBadge = (loaded, total, isCurrent) =>
  isCurrent ? `${loaded}/${total}` : String(total);

export const buildEquipmentNavTree = (tabCounts, current) => {
  const { activeTab, statusFilter, loadedCount, loadedSiteCount, siteFilter } = current;
  const isOwnTab = activeTab === EQUIPMENT_TABS.EQUIPMENT_BASED;
  const isSiteTab = activeTab === EQUIPMENT_TABS.SITE_BASED;
  const siteList = tabCounts.siteList || [];

  return [
    {
      key: EQUIPMENT_TABS.EQUIPMENT_BASED,
      label: 'Own Equipments',
      badge: formatBadge(loadedCount, tabCounts.own.total, isOwnTab && statusFilter === EQUIPMENT_STATUS_FILTERS.ALL),
      children: [
        { key: 'all', label: 'All', badge: formatBadge(loadedCount, tabCounts.own.total, isOwnTab && statusFilter === EQUIPMENT_STATUS_FILTERS.ALL) },
        { key: 'active', label: 'Active', badge: formatBadge(loadedCount, tabCounts.own.active, isOwnTab && statusFilter === EQUIPMENT_STATUS_FILTERS.ACTIVE) },
        { key: 'idle', label: 'Idle', badge: formatBadge(loadedCount, tabCounts.own.idle, isOwnTab && statusFilter === 'idle') },
        { key: 'maintenance', label: 'Maintenance', badge: formatBadge(loadedCount, tabCounts.own.maintenance, isOwnTab && statusFilter === 'maintenance') },
        { key: 'sold', label: 'Sold', badge: formatBadge(loadedCount, tabCounts.own.sold, isOwnTab && statusFilter === 'sold') },
      ],
    },
    { key: EQUIPMENT_TABS.HIRED, label: 'Hired', badge: formatBadge(loadedCount, tabCounts.hired, activeTab === EQUIPMENT_TABS.HIRED) },
    { key: EQUIPMENT_TABS.LEASED, label: 'Leased to Client', badge: formatBadge(loadedCount, tabCounts.leased, activeTab === EQUIPMENT_TABS.LEASED) },
    {
      key: EQUIPMENT_TABS.SITE_BASED,
      label: 'View By Sites',
      badge: formatBadge(loadedSiteCount, tabCounts.sites, isSiteTab),
      children: [
        {
          key: EQUIPMENT_ALL_SITES_FILTER,
          label: 'All Sites',
          badge: formatBadge(loadedSiteCount, tabCounts.sites, isSiteTab && siteFilter === EQUIPMENT_ALL_SITES_FILTER),
        },
        ...siteList.map(({ site, count }) => ({
          key: site,
          label: site,
          badge: formatBadge(loadedCount, count, isSiteTab && siteFilter === site),
        })),
      ],
    },
    { key: EQUIPMENT_TABS.ANSARI_STAFF, label: 'Ansari Staff', badge: formatBadge(loadedCount, tabCounts.ansariStaff, activeTab === EQUIPMENT_TABS.ANSARI_STAFF) },
    { key: EQUIPMENT_TABS.RECORDS, label: 'Records' },
  ];
};