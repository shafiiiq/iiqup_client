export const HISTORICAL_NAV_TREE = [
  {
    key: 'services',
    label: 'Services',
    children: [
      { key: 'oil-service', label: 'Oil Service', dataKey: 'oilService' },
      { key: 'normal-service', label: 'Normal Service', dataKey: 'normalService' },
      { key: 'major-service', label: 'Major Service', dataKey: 'majorService' },
      { key: 'battery-service', label: 'Battery Service', dataKey: 'batteryService' },
      { key: 'tyre-service', label: 'Tyre Service', dataKey: 'tyreService' },
    ],
  },
  {
    key: 'mobilization',
    label: 'Mobilization',
    children: [
      { key: 'mobilizations', label: 'Mobilizations', dataKey: 'mobilized' },
      { key: 'demobilization', label: 'Demobilization', dataKey: 'demobilized' },
    ],
  },
  {
    key: 'documentations',
    label: 'Documentations',
    children: [
      { key: 'purchaseorder', label: 'Purchase Order', dataKey: 'purchaseorder' },
      { key: 'backcharges', label: 'Backcharges', dataKey: 'backcharge' },
    ],
  },
];

export const findHistoricalLeaf = (groupKey, categoryKey) => {
  const group = HISTORICAL_NAV_TREE.find((g) => g.key === groupKey);
  if (!group) return null;
  const leaf = group.children.find((c) => c.key === categoryKey);
  if (!leaf) return null;
  return { ...leaf, groupLabel: group.label };
};
