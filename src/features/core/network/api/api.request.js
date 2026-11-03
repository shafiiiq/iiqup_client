import { readStoredAccessToken } from '@/features/core/device/storage/credentials/credentials.user.tokens';
import { readStoredSessionToken } from '@/features/core/device/storage/session/session.user';
import { buildApiUrl } from './api.url';
import { buildRequestHeaders } from './api.headers';
import { buildRequestInit } from './api.request.init';
import { applyPagination } from './api.request.pagination';
import { buildRequestError } from './api.error';
import { completePresignedUpload } from './api.upload.storage';
import { DEFAULT_TIMEOUT_MS, UPLOAD_TIMEOUT_MS, fetchWithTimeout } from './api.timeout.fetch';
import { refreshAccessToken } from './api.token.refresh';
import { SessionExpiredError, expireSession } from './api.session.expired';

const AUTH_FAILURE_STATUSES = [401, 403];

export const apiRequest = async (
  url,
  method = 'GET',
  body = null,
  customHeaders = {},
  file = null,
  pagination = null
) => {
  const requestMethod = method.toUpperCase();
  const { requestPath, requestBody } = applyPagination({ url, method: requestMethod, body, pagination });
  const requestUrl = buildApiUrl(requestPath);
  const isFormData = requestBody instanceof FormData;
  const timeoutMs = isFormData ? UPLOAD_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;

  const send = (accessToken) =>
    fetchWithTimeout(
      requestUrl,
      buildRequestInit(
        requestMethod,
        requestBody,
        buildRequestHeaders({
          accessToken,
          sessionToken: readStoredSessionToken(),
          isFormData,
          customHeaders,
        })
      ),
      timeoutMs
    );

  const accessToken = readStoredAccessToken();
  let response = await send(accessToken);

  if (accessToken && AUTH_FAILURE_STATUSES.includes(response.status)) {
    const refreshedAccessToken = await refreshAccessToken();
    if (!refreshedAccessToken) {
      expireSession();
      throw new SessionExpiredError();
    }
    response = await send(refreshedAccessToken);
  }

  if (!response.ok) throw await buildRequestError(response);

  if (file) return completePresignedUpload(response, file);

  return response;
};