export const readResponseBody = async (response, fallbackMessage) => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || fallbackMessage);
  return body;
};