import { API_URI } from '@/features/core/network/api/api.uri';
import { appendPaginationToUrl, mergePaginationIntoBody } from '@/shared/pagination/pagination.util';

const buildUrl = (path) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const base = API_URI.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
};

export const apiRequest = async (url, method = 'GET', body = null, customHeaders = {}, file = null, pagination = null) => {
  const finalMethod = method.toUpperCase();

  let finalUrl = url;
  let finalBody = body;

  if (pagination) {
    if (finalMethod === 'GET') {
      finalUrl = appendPaginationToUrl(url, pagination);
    } else if (finalMethod === 'POST' || finalMethod === 'PUT') {
      finalBody = mergePaginationIntoBody(body, pagination);
    }
  }

  const makeRequest = async (token) => {
    const defaultHeaders = {
      "Accept": "*/*",
      'Authorization': `Bearer ${token}`,
      ...customHeaders
    };

    if (!(finalBody instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const options = {
      method: finalMethod,
      headers: defaultHeaders
    };

    if (finalBody && (finalMethod === 'POST' || finalMethod === 'PUT')) {
      options.body = finalBody instanceof FormData ? finalBody :
        (typeof finalBody === 'string' ? finalBody : JSON.stringify(finalBody));
    }

    return fetch(buildUrl(finalUrl), options);
  };


  try {
    let token = localStorage.getItem('accessToken');
    let response = await makeRequest(token);

    if (response.status === 401 || response.status === 403) {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('No refresh token available');
      }

      const refreshResponse = await fetch(buildUrl('/authn/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshToken })
      });

      const refreshData = await refreshResponse.json();

      if (refreshResponse.ok) {
        localStorage.setItem('accessToken', refreshData.accessToken);
        localStorage.setItem('refreshToken', refreshData.refreshToken);

        response = await makeRequest(refreshData.accessToken);
      } else {
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('Token refresh failed');
      }
    }

    if (!response.ok) {
      let errorBody = null;
      try {
        errorBody = await response.clone().json();
      } catch {
      }
      throw new Error(errorBody?.message || `Request failed with status ${response.status}`);
    }

    if (response.ok && file) {
      const responseData = await response.json();
      if (responseData.uploadUrl) {
        const s3Response = await fetch(responseData.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type
          },
          body: file
        });

        if (!s3Response.ok) {
          throw new Error(`S3 upload failed: ${s3Response.status} ${s3Response.statusText}`);
        }

        return { ...response, json: () => Promise.resolve(responseData) };
      }
    }

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};