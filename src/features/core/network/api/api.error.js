export const buildRequestError = async (response) => {
  let errorBody = null;
  try {
    errorBody = await response.clone().json();
  } catch {
    errorBody = null;
  }
  const requestError = new Error(errorBody?.message || `Request failed with status ${response.status}`);
  requestError.status = response.status;
  requestError.body = errorBody;
  return requestError;
};