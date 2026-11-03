export const HEADERLESS_ROUTES = ['/authn', '/', '/not-found', '/splash', '/onboard', '/dashboard', '/analytics', '/historical-data', '/graphs'];
export const HEADERLESS_PREFIXES = ['/historical-data']
export const NAVIGATOR_HIDDEN_ROUTES = ['/authn', '/', '/not-found', '/splash', '/onboard', '/dashboard', '/analytics', '/historical-data', '/graphs'];

export const VALID_ROUTES = [
  '/', '/authn', '/dashboard', '/equipments', '/maintenance/list',
  '/notification', '/stocks', '/stock/parts',
  '/documents', '/backcharge/form', '/backcharge/list', '/backcharge/report', '/backcharge/report',
  '/complaints', '/application-form', '/stock/toolkits',
  '/mechanics', '/mechanics-forms', '/operators', '/live-chat',
  '/splash', '/onboard', '/not-found', '/dev-modal',
  '/maintenance/record', '/order/purchase/list',
  '/fleet/operations', '/batch-service-form', '/order/hire/list',
];

export const VALID_PREFIXES = [
  '/maintenance/list/', '/maintenance/form/', '/maintenance/report/',
  '/equipment-stocks-form/', '/documents/', '/backcharge/report/', '/backcharge/report/',
  '/complaints/', '/order/purchase/form/', '/order/purchase/report/', '/order/purchase/list/', '/batch-service-form',
  '/order/hire/form/', '/order/hire/report/', '/order/hire/list/', '/(signature)/order/hire',
];

export const isValidRoute = (pathname) =>
  VALID_ROUTES.includes(pathname) || VALID_PREFIXES.some((prefix) => pathname.startsWith(prefix));