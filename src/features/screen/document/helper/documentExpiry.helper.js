import { EXPIRY_BUCKETS } from '../constants/document.constant';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export const groupByExpiryBucket = (documents, now = Date.now()) => {
  const groups = Object.fromEntries(EXPIRY_BUCKETS.map((bucket) => [bucket.key, []]));
  documents.forEach((documentItem) => {
    const daysLeft = (new Date(documentItem.expiryDate).getTime() - now) / MILLISECONDS_PER_DAY;
    const matchingBucket = EXPIRY_BUCKETS.find((bucket) => daysLeft <= bucket.maximumDays);
    if (matchingBucket) groups[matchingBucket.key].push(documentItem);
  });
  return groups;
};