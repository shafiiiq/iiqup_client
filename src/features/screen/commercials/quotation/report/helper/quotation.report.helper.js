import { DEFAULT_COLUMNS, DEFAULT_QUOTATION_DATA } from '../constants/quotation.report.constant';

export const buildReportViews = (q) => {
  const builtData = {
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
  };

  let amendmentData = null;
  if (q.isAmendmented && q.amendments?.length) {
    const latest = q.amendments[q.amendments.length - 1];
    amendmentData = {
      ...builtData,
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
      columns: latest.amendedColumns?.length ? latest.amendedColumns : builtData.columns,
      totalAmount: latest.amendedTotalAmount ?? q.totalAmount ?? 0,
      discount: latest.amendedDiscount ?? q.discount ?? 0,
      showTotalRow: latest.amendedShowTotalRow ?? q.showTotalRow ?? true,
      termsAndConditions: (latest.amendedTermsAndConditions?.length ? latest.amendedTermsAndConditions : q.termsAndConditions || []).filter((t) => t !== 'Terms & Conditions'),
      isAmendment: true,
      amendmentDate: new Date(latest.amendmentDate).toLocaleDateString('en-GB'),
      amendmentNumber: q.amendments.length,
    };
  }

  return { builtData, amendmentData };
};

export const formatCurrency = (value) =>
  (value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const isTermHeading = (term) => typeof term === 'string' && term.startsWith('## ');

export const getTermText = (term) => (isTermHeading(term) ? term.slice(3) : term);

export const buildTermNumbers = (terms) => {
  let count = 0;
  return terms.map((term) => (isTermHeading(term) ? null : ++count));
};

export const splitHeaderLabel = (label = '') => {
  if (!label) return [label];
  const slashIndex = label.indexOf('/');
  if (slashIndex !== -1 && slashIndex < label.length - 1) {
    return [label.slice(0, slashIndex + 1), label.slice(slashIndex + 1).trim()];
  }
  if (label.length > 18) {
    const mid = Math.floor(label.length / 2);
    let breakAt = label.lastIndexOf(' ', mid);
    if (breakAt === -1) breakAt = label.indexOf(' ', mid);
    if (breakAt !== -1) return [label.slice(0, breakAt).trim(), label.slice(breakAt).trim()];
  }
  return [label];
};