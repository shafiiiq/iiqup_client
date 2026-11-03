import { appendPaginationToUrl, mergePaginationIntoBody } from '@/shared/pagination/pagination.util';

export const applyPagination = ({ url, method, body, pagination }) => {
  if (!pagination) return { requestPath: url, requestBody: body };
  if (method === 'GET') return { requestPath: appendPaginationToUrl(url, pagination), requestBody: body };
  if (method === 'POST' || method === 'PUT') {
    return { requestPath: url, requestBody: mergePaginationIntoBody(body, pagination) };
  }
  return { requestPath: url, requestBody: body };
};