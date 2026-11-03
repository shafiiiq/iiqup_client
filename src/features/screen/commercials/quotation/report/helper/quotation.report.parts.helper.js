import { DEFAULT_COLUMNS, DEFAULT_QUOTATION_DATA } from '../constants/quotation.report.constant';

export const parsePartTokens = (parts, amendmentCount) => {
  const tokens = String(parts || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  const expanded = tokens.includes('all')
    ? ['original', ...Array.from({ length: amendmentCount }, (_, i) => String(i + 1))]
    : tokens;
  return [...new Set(expanded)];
};

const buildOriginal = (q) => ({
  vendor: q.company?.vendor || '',
  date: q.date || '',
  quotationRef: q.quotationRef || '',
  attention: q.company?.attention || '',
  designation: q.company?.designation || '',
  location: q.location || '',
  customFields: q.customFields || [],
  requestText: q.requestText || '',
  noticeText: q.noticeText || '',
  priceStatementText: q.priceStatementText || '',
  contactText: q.contactText || '',
  items: q.items || [],
  columns: q.columns?.length ? q.columns : DEFAULT_COLUMNS,
  totalAmount: q.totalAmount || 0,
  discount: q.discount || 0,
  showDiscountInTotal: q.showDiscountInTotal ?? true,
  showTotalRow: q.showTotalRow ?? true,
  termsAndConditions: (q.termsAndConditions || []).filter((t) => t !== 'Terms & Conditions'),
  signatures: q.signatures || DEFAULT_QUOTATION_DATA.signatures,
  isAmendment: false,
});

const buildAmendment = (q, base, number) => {
  const latest = q.amendments[number - 1];
  return {
    ...base,
    signatures: latest.amendedSignatures || q.signatures || DEFAULT_QUOTATION_DATA.signatures,
    vendor: latest.amendedCompany?.vendor || q.company?.vendor || '',
    attention: latest.amendedCompany?.attention || q.company?.attention || '',
    designation: latest.amendedCompany?.designation || q.company?.designation || '',
    location: latest.amendedLocation || q.location || '',
    customFields: latest.amendedCustomFields?.length ? latest.amendedCustomFields : (q.customFields || []),
    requestText: latest.amendedRequestText || q.requestText || '',
    noticeText: latest.amendedNoticeText || q.noticeText || '',
    priceStatementText: latest.amendedPriceStatementText || q.priceStatementText || '',
    contactText: latest.amendedContactText || q.contactText || '',
    items: latest.amendedItems?.length ? latest.amendedItems : q.items || [],
    columns: latest.amendedColumns?.length ? latest.amendedColumns : base.columns,
    totalAmount: latest.amendedTotalAmount ?? q.totalAmount ?? 0,
    discount: latest.amendedDiscount ?? q.discount ?? 0,
    showTotalRow: latest.amendedShowTotalRow ?? q.showTotalRow ?? true,
    termsAndConditions: (latest.amendedTermsAndConditions?.length ? latest.amendedTermsAndConditions : q.termsAndConditions || []).filter((t) => t !== 'Terms & Conditions'),
    isAmendment: true,
    amendmentDate: new Date(latest.amendmentDate).toLocaleDateString('en-GB'),
    amendmentNumber: number,
  };
};

export const buildReportParts = (q, tokens) => {
  const base = buildOriginal(q);
  const count = q.amendments?.length || 0;
  const docs = [];
  if (tokens.includes('original')) docs.push({ key: 'original', data: base });
  tokens
    .map((t) => parseInt(t, 10))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= count)
    .sort((a, b) => a - b)
    .forEach((n) => docs.push({ key: `amendment-${n}`, data: buildAmendment(q, base, n) }));
  return docs;
};