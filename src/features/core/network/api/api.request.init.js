const METHODS_WITH_BODY = ['POST', 'PUT', 'PATCH', 'DELETE'];

const serializeBody = (body) => {
  if (body instanceof FormData || typeof body === 'string') return body;
  return JSON.stringify(body);
};

export const buildRequestInit = (method, body, headers) => {
  const requestInit = { method, headers };
  if (body && METHODS_WITH_BODY.includes(method)) requestInit.body = serializeBody(body);
  return requestInit;
};