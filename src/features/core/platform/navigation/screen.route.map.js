export const WEB_SCREEN_ROUTE_BUILDERS = {
  complaintList: () => '/complaints',
  purchaseOrderList: (documentId) => `/order/purchase/report/${encodeURIComponent(documentId)}`,
  hireOrderList: (documentId) => `/order/hire/report/${encodeURIComponent(documentId)}`,
  quotationList: (documentId) => `/quotation/report/${encodeURIComponent(documentId)}`,
  backchargeList: (documentId) => `/backcharge/report/${encodeURIComponent(documentId)}`,
};