export const buildDefaultItem = (columns, id = 1) => {
  const item = { id };
  columns.forEach((col) => {
    item[col.id] = col.type === 'calculated' ? 0 : col.type === 'number' ? null : '';
  });
  return item;
};

export const buildCustomField = () => ({
  id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  label: '',
  value: '',
});

const SEQUENCE_DIGIT_MAP = { 5: 'A', 6: 'B', 7: 'C', 8: 'D', 9: 'E' };
const SEQUENCE_DIGIT_REVERSE_MAP = { A: '5', B: '6', C: '7', D: '8', E: '9' };

export const encodeSequenceNumber = (number) => {
  const safeNumber = Math.max(0, Math.floor(Number(number) || 0));
  const padded = String(safeNumber).padStart(8, '0').slice(-8);
  return padded
    .split('')
    .map((digit) => SEQUENCE_DIGIT_MAP[digit] ?? digit)
    .join('');
};

export const decodeSequenceNumber = (sequence) => {
  if (!sequence) return 0;
  const digits = sequence
    .split('')
    .map((char) => SEQUENCE_DIGIT_REVERSE_MAP[char] ?? char)
    .join('');
  const parsed = parseInt(digits, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

// Format: ATE-[TYPE]-YYYYMMDD-[8-CHAR-SEQUENCE]
export const generateQuotationRef = (number, type = 'QO') => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const sequence = encodeSequenceNumber(number);
  return `ATE-${type}-${year}${month}${day}-${sequence}`;
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