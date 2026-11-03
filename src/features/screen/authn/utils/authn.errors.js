export const parseAuthnError = (error) => {
    if (error?.name === 'AbortError') return 'Request timeout. Please try again.';
    if (error?.name === 'TypeError') return 'Unable to connect to server. Please check your network connection.';
    return error?.message || 'An unexpected error occurred.';
};