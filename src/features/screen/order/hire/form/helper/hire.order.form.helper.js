export const buildDefaultItem = (columns, id = 1) => {
  const item = { id };
  columns.forEach((col) => {
    item[col.id] = col.type === 'calculated' ? 0 : col.type === 'number' ? null : '';
  });
  return item;
};

export const encodeSequenceNumber = (number) => {
  const safeNumber = Math.max(0, Math.floor(Number(number) || 0));
  return String(safeNumber).padStart(3, '0');
};

export const decodeSequenceNumber = (sequence) => {
  if (!sequence) return 0;
  const parsed = parseInt(sequence, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const generateHireOrderRef = (number) => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `ATE-LPO-${day}${month}${year}-${encodeSequenceNumber(number)}`;
};

export const getNextHireOrderNumber = (latestRef) => {
  if (!latestRef || !latestRef.startsWith('ATE-LPO-')) return 1;
  return decodeSequenceNumber(latestRef.split('-').pop()) + 1;
};

export const buildCustomField = () => ({
  id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  label: '',
  value: '',
});

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