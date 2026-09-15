export const getInitials = (name) => {
  if (!name) return 'OP';
  const parts = name.trim().split(' ');
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

export const isExpired = (dateString) => {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
};

export const getOperatorStatus = (operator) => {
  const docs = [
    operator.passportExpiry,
    operator.qidExpiry,
    operator.licenceExpiry,
    operator.healthCardExpiry,
    operator.labourContractExpiry,
  ];
  if (docs.some(isExpired)) return 'expired';
  if (!operator.isVerified)  return 'pending';
  return 'active';
};

export const getSortIcon = (field, sortField, sortDirection) => {
  if (sortField !== field) return '⇅';
  return sortDirection === 'asc' ? '↑' : '↓';
};

export const toInputDate = (value) =>
  value ? new Date(value).toISOString().split('T')[0] : '';

export const matchesOperatorTab = (operator, tab) => {
  if (tab === 'own') return !operator.hired;
  if (tab === 'hired') return !!operator.hired;
  if (tab === 'mobilized') return operator.status === 'mobilized';
  if (tab === 'demobilized') return operator.status !== 'mobilized';
  return true;
};