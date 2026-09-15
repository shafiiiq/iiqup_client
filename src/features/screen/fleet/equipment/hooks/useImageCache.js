import { useEffect, useCallback } from 'react';
import { apiRequest } from '@/features/core/network/api/api.request';
import { EQUIPMENT_IMAGE_CACHE_KEY, EQUIPMENT_IMAGE_CACHE_EXPIRY_MS, EQUIPMENT_STALE_CACHE_KEYS } from '../constants/equipment.constant';

const readCache = () => {
  const raw = localStorage.getItem(EQUIPMENT_IMAGE_CACHE_KEY);
  return raw ? JSON.parse(raw) : {};
};

const writeCache = (cache) => localStorage.setItem(EQUIPMENT_IMAGE_CACHE_KEY, JSON.stringify(cache));

const getCachedUrl = (filePath) => {
  try {
    const cache = readCache();
    const entry = cache[filePath];
    if (!entry) return null;

    if (Date.now() > entry.timestamp + EQUIPMENT_IMAGE_CACHE_EXPIRY_MS) {
      delete cache[filePath];
      writeCache(cache);
      return null;
    }

    return entry.url;
  } catch {
    return null;
  }
};

const setCachedUrl = (filePath, url) => {
  try {
    const cache = readCache();
    cache[filePath] = { url, timestamp: Date.now() };
    writeCache(cache);
  } catch (err) {
    if (err.name === 'QuotaExceededError') localStorage.removeItem(EQUIPMENT_IMAGE_CACHE_KEY);
  }
};

const purgeExpiredEntries = () => {
  try {
    const cache = readCache();
    const now = Date.now();
    let hasChanges = false;

    Object.keys(cache).forEach((key) => {
      if (now > cache[key].timestamp + EQUIPMENT_IMAGE_CACHE_EXPIRY_MS) {
        delete cache[key];
        hasChanges = true;
      }
    });

    if (hasChanges) writeCache(cache);
  } catch {
    localStorage.removeItem(EQUIPMENT_IMAGE_CACHE_KEY);
  }
};

export const useImageCache = () => {
  useEffect(() => {
    purgeExpiredEntries();
  }, []);

  const getMediaUrlWithCache = useCallback(async (filePath) => {
    if (!filePath) return '';

    const cached = getCachedUrl(filePath);
    if (cached) return cached;

    try {
      const response = await apiRequest(`/s3/pre-signed-url`, 'POST', { key: filePath, isLong: true });
      const { dataUrl } = await response.json();
      setCachedUrl(filePath, dataUrl);
      return dataUrl;
    } catch {
      return '';
    }
  }, []);

  const clearAllCache = useCallback(() => {
    localStorage.removeItem(EQUIPMENT_IMAGE_CACHE_KEY);
    EQUIPMENT_STALE_CACHE_KEYS.forEach(key => localStorage.removeItem(key));
  }, []);

  return { getMediaUrlWithCache, clearAllCache };
};