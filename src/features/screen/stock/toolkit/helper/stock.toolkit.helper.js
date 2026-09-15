export const calculateStatus = (stockCount, minStockLevel) => {
  if (stockCount <= 0) return 'out';
  if (stockCount < minStockLevel) return 'low';
  return 'available';
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

export const getUniqueValues = (variants, key) => {
  if (!variants || variants.length === 0) return [];
  const values = [...new Set(variants.map(v => v[key]))].sort();
  values.unshift(`All ${key}`);

  return values.map(v => ({
    value: v === `All ${key}` ? 'all' : v,
    label: v
  }));
};