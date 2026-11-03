import { API_URI } from '@/features/core/network/api/api.uri';

export const buildApiUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;
  const baseUrl = API_URI.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};