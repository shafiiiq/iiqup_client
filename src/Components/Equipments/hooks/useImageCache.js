// ─────────────────────────────────────────────────────────────────────────────
// useImageCache.js — S3 pre-signed URL cache hook
// Wraps localStorage to avoid re-fetching the same S3 URLs on every render.
// Cache entries expire after CACHE_EXPIRY_HOURS; stale entries are purged on mount.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useCallback } from 'react';
import { apiRequest }             from '../../../utils/api';
import { END_POINT }              from '../../../constants';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_KEY          = 'equipment_images_cache';
const CACHE_EXPIRY_HOURS = 6;
const CACHE_EXPIRY_MS    = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Provides get/set/clear helpers for caching S3 pre-signed image URLs.
 * Also exposes `getMediaUrlWithCache` which fetches from S3 on cache miss.
 *
 * @returns {{
 *   getMediaUrlWithCache: (filePath: string) => Promise<string>,
 *   clearAllCache:        () => void,
 * }}
 */
export const useImageCache = () => {

  // Purge all expired cache entries on mount so localStorage doesn't grow unbounded.
  useEffect(() => {
    clearExpiredEntries();
  }, []);

  // ── Private Helpers ────────────────────────────────────────────────────────

  const getCachedUrl = (filePath) => {
    try {
      const raw  = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;

      const cache = JSON.parse(raw);
      const entry = cache[filePath];
      if (!entry) return null;

      const isExpired = Date.now() > entry.timestamp + CACHE_EXPIRY_MS;
      if (isExpired) {
        // Evict this single stale entry
        delete cache[filePath];
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        return null;
      }

      return entry.url;
    } catch {
      return null;
    }
  };

  const setCachedUrl = (filePath, url) => {
    try {
      const raw   = localStorage.getItem(CACHE_KEY);
      const cache = raw ? JSON.parse(raw) : {};

      cache[filePath] = { url, timestamp: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (err) {
      // If storage is full, wipe the cache rather than fail silently
      if (err.name === 'QuotaExceededError') {
        localStorage.removeItem(CACHE_KEY);
      }
    }
  };

  const clearExpiredEntries = () => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return;

      const cache      = JSON.parse(raw);
      const now        = Date.now();
      let   hasChanges = false;

      Object.keys(cache).forEach((key) => {
        if (now > cache[key].timestamp + CACHE_EXPIRY_MS) {
          delete cache[key];
          hasChanges = true;
        }
      });

      if (hasChanges) localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Corrupt cache — remove entirely
      localStorage.removeItem(CACHE_KEY);
    }
  };

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Returns a usable image URL for the given S3 file path.
   * Serves from localStorage cache when available; fetches a new pre-signed
   * URL from the backend on cache miss and stores it for future calls.
   *
   * @param {string} filePath  — S3 object key
   * @returns {Promise<string>}
   */
  const getMediaUrlWithCache = useCallback(async (filePath) => {
    if (!filePath) return '';

    const cached = getCachedUrl(filePath);
    if (cached) return cached;

    try {
      const response = await apiRequest(
        `${END_POINT}/s3/get-pre-signed-url`,
        'POST',
        { key: filePath, isLong: true }
      );
      const { dataUrl } = await response.json();
      setCachedUrl(filePath, dataUrl);
      return dataUrl;
    } catch {
      return '';
    }
  }, []);

  /**
   * Wipes all three equipment cache keys.
   * Called by the "Clear Cache" button so fresh images are fetched on next load.
   */
  const clearAllCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem('equipment_data_cache');
    localStorage.removeItem('equipment_list_cache');
  }, []);

  return { getMediaUrlWithCache, clearAllCache };
};