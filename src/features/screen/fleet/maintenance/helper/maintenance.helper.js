import { OIL_SERVICE_TYPES, SERVICE_TYPE_LABELS } from '../constants/maintenance.constant';

export const isOilOrNormalService = (serviceType) => OIL_SERVICE_TYPES.includes(serviceType);

export const getServiceTypeLabel = (serviceType) => SERVICE_TYPE_LABELS[serviceType] || 'Service';

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : dateString;
};

export const getTodayIsoDate = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};