import { SESSION_TOKEN_HEADER_NAME } from './api.client.header';

export const buildRequestHeaders = ({ accessToken, sessionToken, isFormData, customHeaders }) => ({
  Accept: '*/*',
  ...(!isFormData && { 'Content-Type': 'application/json' }),
  ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  ...(sessionToken && { [SESSION_TOKEN_HEADER_NAME]: sessionToken }),
  ...customHeaders,
});