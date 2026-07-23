import { API_URI } from '../constants';

/**
 * @param {string} url 
 * @param {string} method 
 * @param {Object} body 
 * @param {Object} customHeaders 
 * @returns {Promise<Response>} 
 */

export const apiRequest = async (url, method = 'GET', body = null, customHeaders = {}, file = null) => {
  const makeRequest = async (token) => {
    const defaultHeaders = {
      "Accept": "*/*",
      'Authorization': `Bearer ${token}`,
      ...customHeaders
    };

    if (!(body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const options = {
      method: method.toUpperCase(),
      headers: defaultHeaders
    };

    if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
      options.body = body instanceof FormData ? body :
        (typeof body === 'string' ? body : JSON.stringify(body));
    }

    return fetch(url, options);
  };

  try {
    let token = localStorage.getItem('auth0token');
    let response = await makeRequest(token);

    if (response.status === 401 || response.status === 403) {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('No refresh token available');
      }

      const refreshResponse = await fetch(`${API_URI}/oauth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshToken })
      });

      const refreshData = await refreshResponse.json();

      if (refreshResponse.ok) {
        localStorage.setItem('auth0token', refreshData.accessToken);
        localStorage.setItem('refresh_token', refreshData.refreshToken);

        response = await makeRequest(refreshData.accessToken);
      } else {
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('Token refresh failed');
      }
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