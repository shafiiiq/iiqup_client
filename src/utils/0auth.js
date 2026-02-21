import { END_POINT } from '../constants';

/**
 * Makes an authenticated API request with automatic token refresh
 * @param {string} url - The API endpoint URL
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object} body - Request body (optional, for POST/PUT)
 * @param {Object} customHeaders - Additional headers (optional)
 * @returns {Promise<Response>} - The fetch response
 */
export const apiRequest = async (url, method = 'GET', body = null, customHeaders = {}, file = null) => {
  const makeRequest = async (token) => {
    const defaultHeaders = {
      "Accept": "*/*",
      'Authorization': `Bearer ${token}`,
      ...customHeaders
    };

    // Only set Content-Type for non-FormData requests
    if (!(body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const options = {
      method: method.toUpperCase(),
      headers: defaultHeaders
    };

    // Add body for POST, PUT methods
    if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
      // For FormData, pass it directly. For other data, stringify if needed
      options.body = body instanceof FormData ? body :
        (typeof body === 'string' ? body : JSON.stringify(body));
    }

    return fetch(url, options);
  };

  try {
    let token = localStorage.getItem('auth0token');
    let response = await makeRequest(token);

    // If token expired, try to refresh
    if (response.status === 401 || response.status === 403) {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('No refresh token available');
      }

      // Try to refresh token
      const refreshResponse = await fetch(`${END_POINT}/0auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshToken })
      });

      // Parse the response ONCE and store it
      const refreshData = await refreshResponse.json();

      if (refreshResponse.ok) {
        localStorage.setItem('auth0token', refreshData.accessToken);
        localStorage.setItem('refresh_token', refreshData.refreshToken);

        // Retry original request with new token
        response = await makeRequest(refreshData.accessToken);
      } else {
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('Token refresh failed');
      }
    }

    // If response contains uploadUrl and file is provided, upload to S3
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

        // Return the original response data after successful S3 upload
        return { ...response, json: () => Promise.resolve(responseData) };
      }
    }

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};