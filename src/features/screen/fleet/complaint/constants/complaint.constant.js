import { Clock } from 'lucide-react';

export const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov', 'avi'];

export const STATUS_CONFIG = {
  resolved: { color: '#22c55e', icon: Clock },
  pending: { color: '#f59e0b', icon: Clock },
  rejected: { color: '#ef4444', icon: Clock },
  'in-progress': { color: '#3b82f6', icon: Clock },
};

export const FALLBACK_IMAGE = 'https://placehold.co/600x400/eeeeee/999999?text=No+Image';
export const REFRESH_INTERVAL_MS = 30000;

export const SHARED_BTN = {
  variant: 'gradient',
  font: 'md',
  animation: '',
  squircle: '4xl',
  height: '38px',
  width: '160px',
  type: 'submit',
  textColor: 'white-200',
  shadowPosition: 'to-bottom',
  shadowColor: 'white-600',
};

export const STATUS_BAR_ITEMS = [
  { key: 'resolved', label: 'Resolved', gradient: 'from-emerald-500 to-green-600', Icon: Clock },
  { key: 'pending', label: 'Pending', gradient: 'from-amber-500 to-orange-600', Icon: Clock },
  { key: 'rejected', label: 'Rejected', gradient: 'from-red-500 to-rose-600', Icon: Clock },
  { key: 'in-progress', label: 'In Progress', gradient: 'from-blue-500 to-sky-600', Icon: Clock },
];

export const isVideoMedia = ({ mimeType, filePath, type } = {}) => {
  if (mimeType) return mimeType.toLowerCase().includes('video');
  if (filePath) return VIDEO_EXTENSIONS.includes(filePath.toLowerCase().split('.').pop());
  return type === 'video';
};

export const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const getStatusColor = (status) =>
  (STATUS_CONFIG[status?.toLowerCase()] || { color: '#64748b' }).color;

export const getStatusIcon = (status) =>
  (STATUS_CONFIG[status?.toLowerCase()] || { icon: Clock }).icon;