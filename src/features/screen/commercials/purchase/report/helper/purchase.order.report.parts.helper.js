import { buildOriginalPurchaseOrderDocument, buildAmendedPurchaseOrderDocument } from './purchase.order.report.document.helper';

export const parsePartTokens = (parts, amendmentCount) => {
  const tokens = String(parts || '').split(',').map((token) => token.trim().toLowerCase()).filter(Boolean);
  const expandedTokens = tokens.includes('all')
    ? ['original', ...Array.from({ length: amendmentCount }, (_, index) => String(index + 1))]
    : tokens;
  return [...new Set(expandedTokens)];
};

export const buildReportParts = (purchaseOrder, tokens) => {
  const originalDocument = buildOriginalPurchaseOrderDocument(purchaseOrder);
  const amendmentCount = purchaseOrder.amendments?.length || 0;
  const reportDocuments = [];

  if (tokens.includes('original')) reportDocuments.push({ key: 'original', data: originalDocument });

  tokens
    .map((token) => parseInt(token, 10))
    .filter((amendmentNumber) => Number.isInteger(amendmentNumber) && amendmentNumber >= 1 && amendmentNumber <= amendmentCount)
    .sort((first, second) => first - second)
    .forEach((amendmentNumber) =>
      reportDocuments.push({
        key: `amendment-${amendmentNumber}`,
        data: buildAmendedPurchaseOrderDocument(purchaseOrder, originalDocument, amendmentNumber),
      })
    );

  return reportDocuments;
};