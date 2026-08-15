export const generateLpoRef = (lpoNumber) => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const padded = String(lpoNumber).padStart(3, '0');
  return `ATE${padded}/SP/${month}/${year}`;
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
