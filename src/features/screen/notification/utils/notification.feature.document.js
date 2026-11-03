import { apiRequest } from '@/features/core/network/api/api.request';

const documentUrlCache = new Map();

const buildVersionedPdfPath = (link) => {
  if (!link.pdfVersion) return link.pdfPath;
  const separator = link.pdfPath.includes('?') ? '&' : '?';
  return `${link.pdfPath}${separator}version=${encodeURIComponent(link.pdfVersion)}`;
};

export const featureLinkDocumentKey = (link) =>
  `notification-feature:${link.featureKey}:${link.reference}:${link.pdfVersion ?? 'latest'}`;

export const loadFeatureLinkDocument = (link) => {
  const documentKey = featureLinkDocumentKey(link);
  const cachedUrlPromise = documentUrlCache.get(documentKey);
  if (cachedUrlPromise) return cachedUrlPromise;

  const urlPromise = (async () => {
    const response = await apiRequest(buildVersionedPdfPath(link));
    if (!response.ok) throw new Error('Document unavailable');
    return URL.createObjectURL(await response.blob());
  })().catch((error) => {
    documentUrlCache.delete(documentKey);
    throw error;
  });

  documentUrlCache.set(documentKey, urlPromise);
  return urlPromise;
};