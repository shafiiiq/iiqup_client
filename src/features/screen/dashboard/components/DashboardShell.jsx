import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Tabs from '@/shared/components/widgets/tabs/Tabs';
import WelcomeHeader from './fragments/WelcomeHeader';
import './DashboardShell.css';
import { HISTORICAL_NAV_TREE } from '../constants/historical.constant';

const PRIMARY_ITEMS = [
  { key: 'home', label: 'Home', componentIcon: 'IconlyHome', path: '/' },
  { key: 'dashboard', label: 'Dashboard', componentIcon: 'IconlyCategory', path: '/dashboard' },
  { key: 'analytics', label: 'Analytics', componentIcon: 'IconlyChart', path: '/analytics' },
  { key: 'graphs', label: 'Graphs', componentIcon: 'IconlyGraph', path: '/graphs' },
  { key: 'historical', label: 'Historical Data', componentIcon: 'IconlyHistory', path: '/historical-data' },
];

const RESOURCE_ITEMS = [
  { key: 'equipments', label: 'Equipments', componentIcon: 'CraneIcon', path: '/equipments' },
  { key: 'operators', label: 'Operators', componentIcon: 'Iconly3user', path: '/operators' },
  { key: 'mechanics', label: 'Mechanics', componentIcon: 'IconlyFace', path: '/mechanics' },
  { key: 'stock-parts', label: 'Spare Parts', componentIcon: 'IconlyBuy', path: '/stock/parts' },
  { key: 'stock-toolkits', label: 'Safety Items', componentIcon: 'JacketIcon', path: '/stock/toolkits' },
  { key: 'documents', label: 'Documents', componentIcon: 'DocumentIcon', path: '/documents' },
  { key: 'purchase-orders', label: 'Purchase Orders', componentIcon: 'IconlyBag2', path: '/order/purchase/list' },
  { key: 'hire-orders', label: 'Hire Orders', componentIcon: 'BrandIcon', path: '/order/hire/list' },
  { key: 'backcharges', label: 'Backcharges', componentIcon: 'ReturnIcon', path: '/backcharge/list' },
  { key: 'quotations', label: 'Quotations', componentIcon: 'IconlyPaper', path: '/quotation/list' },
];

const ALL_ITEMS = [...PRIMARY_ITEMS, ...RESOURCE_ITEMS];

const TAB_ITEMS = [
  ...PRIMARY_ITEMS.filter((item) => item.key !== 'historical').map(({ key, label, componentIcon }) => ({ key, label, iconName: componentIcon })),
  {
    key: 'historical',
    label: 'Historical Data',
    iconName: 'IconlyHistory',
    children: HISTORICAL_NAV_TREE.map((group) => ({
      key: group.key,
      label: group.label,
      children: group.children.map((leaf) => ({ key: `${group.key}__${leaf.key}`, label: leaf.label })),
    })),
  },
  {
    key: 'resources',
    label: 'Resources',
    iconName: 'FolderIcon',
    children: RESOURCE_ITEMS.map(({ key, label, componentIcon }) => ({ key, label, iconName: componentIcon })),
  },
];

const findActiveItem = (pathname) =>
  ALL_ITEMS.find((item) => item.path === pathname) ||
  PRIMARY_ITEMS.find((item) => item.key === 'dashboard');

const buildActivePath = (activeItem, pathname) => {
  const historicalMatch = pathname.match(/^\/historical-data\/([^/]+)\/([^/]+)$/);
  if (historicalMatch) {
    const [, group, category] = historicalMatch;
    return ['historical', group, `${group}__${category}`];
  }

  return RESOURCE_ITEMS.some((item) => item.key === activeItem.key)
    ? ['resources', activeItem.key]
    : [activeItem.key];
};

const DashboardShell = ({ title, subtitle, headerStats, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

    const activeItem = findActiveItem(location.pathname);
  const activePath = buildActivePath(activeItem, location.pathname);

  const handleSelect = (path) => {
    const key = path[path.length - 1];

    if (path[0] === 'historical' && key.includes('__')) {
      const [group, category] = key.split('__');
      navigate(`/historical-data/${group}/${category}`);
      return;
    }

    const item = ALL_ITEMS.find((i) => i.key === key);
    if (item) navigate(item.path);
  };

  return (
    <div className="features screen dashboard dashboard-shell">
      <div
        className={`features screen dashboard dashboard-tabs ${collapsed ? 'features screen dashboard dashboard-tabs-collapsed' : ''}`}
      >
        <Tabs
          items={TAB_ITEMS}
          activePath={activePath}
          onSelect={handleSelect}
          showSearch={true}
          maxHeight="calc(100vh - 2rem)"
          collapsed={collapsed}
          onToggleCollapse={setCollapsed}
        />
      </div>
      <main className="features screen dashboard dashboard-main">
        <WelcomeHeader title={title} subtitle={subtitle} stats={headerStats} />
        {children}
      </main>
    </div>
  );
};

export default DashboardShell;