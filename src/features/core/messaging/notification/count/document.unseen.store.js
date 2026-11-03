import { useSyncExternalStore } from 'react';

const EMPTY_COUNTS = { bySource: {}, referencesBySource: {}, total: 0 };

let documentUnseenCounts = EMPTY_COUNTS;
const listeners = new Set();

const normalizeCount = (count) => {
  const value = Number(count);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
};

const normalizeCounts = (counts) => ({
  bySource: Object.fromEntries(
    Object.entries(counts.bySource ?? {}).map(([key, count]) => [key, normalizeCount(count)])
  ),
  referencesBySource: Object.fromEntries(
    Object.entries(counts.referencesBySource ?? {}).map(([key, references]) => [
      key,
      Array.isArray(references) ? references.map(String) : [],
    ])
  ),
  total: normalizeCount(counts.total),
});

const isSameList = (firstList, secondList) =>
  firstList.length === secondList.length && firstList.every((value, index) => value === secondList[index]);

const isSameCounts = (firstCounts, secondCounts) => {
  if (firstCounts.total !== secondCounts.total) return false;
  const countKeys = Object.keys(firstCounts.bySource);
  if (countKeys.length !== Object.keys(secondCounts.bySource).length) return false;
  if (!countKeys.every((key) => firstCounts.bySource[key] === secondCounts.bySource[key])) return false;
  const referenceKeys = Object.keys(firstCounts.referencesBySource);
  if (referenceKeys.length !== Object.keys(secondCounts.referencesBySource).length) return false;
  return referenceKeys.every((key) =>
    isSameList(firstCounts.referencesBySource[key], secondCounts.referencesBySource[key] ?? [])
  );
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const documentUnseenStore = {
  getCounts: () => documentUnseenCounts,
  getTotal: () => documentUnseenCounts.total,
  isUnseen: (sourceKey, reference) =>
    (documentUnseenCounts.referencesBySource[sourceKey] ?? []).includes(reference),
  setCounts: (counts) => {
    const nextCounts = normalizeCounts(counts);
    if (isSameCounts(nextCounts, documentUnseenCounts)) return;
    documentUnseenCounts = nextCounts;
    listeners.forEach((listener) => listener());
  },
  removeReference: (sourceKey, reference) => {
    const references = documentUnseenCounts.referencesBySource[sourceKey] ?? [];
    if (!references.includes(reference)) return;
    const sourceCount = documentUnseenCounts.bySource[sourceKey] ?? references.length;
    documentUnseenStore.setCounts({
      bySource: { ...documentUnseenCounts.bySource, [sourceKey]: Math.max(0, sourceCount - 1) },
      referencesBySource: {
        ...documentUnseenCounts.referencesBySource,
        [sourceKey]: references.filter((value) => value !== reference),
      },
      total: Math.max(0, documentUnseenCounts.total - 1),
    });
  },
  reset: () => documentUnseenStore.setCounts(EMPTY_COUNTS),
  subscribe,
};

export const useDocumentUnseenCounts = () => useSyncExternalStore(subscribe, documentUnseenStore.getCounts);

export const useDocumentUnseenTotal = () => useSyncExternalStore(subscribe, documentUnseenStore.getTotal);

export const useIsDocumentUnseen = (sourceKey, reference) =>
  useSyncExternalStore(subscribe, () => documentUnseenStore.isUnseen(sourceKey, reference));