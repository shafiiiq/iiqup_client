export const buildDefaultItem = (columns, id = 1) => {
  const item = { id };
  columns.forEach((col) => {
    item[col.id] = col.type === 'calculated' ? 0 : col.type === 'number' ? null : '';
  });
  return item;
};

export const generateHireOrderRef = (number) => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const padded = String(number).padStart(3, '0');
  return `ATE${padded}/HO/${month}/${year}`;
};

export const formatDate = (dateString) => {
  const now = new Date(dateString);
  const day = String(now.getDate() + 1).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${now.getFullYear()}`;
};

export const formatCurrency = (value) =>
  (value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const filterEditableTerms = (terms = []) => terms.filter((t) => t !== 'Terms & Conditions');

export const itemHasContent = (item, columns) =>
  columns.some((col) => col.type !== 'calculated' && String(item[col.id] ?? '').trim());

export const getAutoCalculateTotal = (columns) =>
  columns.some((c) => c.id === 'quantity') && columns.some((c) => c.id === 'unitPrice');

export const calculateSubtotal = (items) =>
  items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

export const filterCompaniesByField = (companies, field, search) =>
  companies.filter((c) => c[field].toLowerCase().includes(search.toLowerCase()));

export const getModeLabel = (isAmendmentMode, isEditMode) =>
  isAmendmentMode ? 'Amending' : isEditMode ? 'Editing' : 'Creating';

export const getStatusTitle = (saveStatus) =>
  saveStatus.includes('Error') ? 'Error' : saveStatus.includes('Please') ? 'Warning' : 'Success';

export const chunkItems = (items, size) => {
  if (!items.length) return [[]];
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};