export const DEFAULT_TIMEOUT_MS = 15000;
export const UPLOAD_TIMEOUT_MS = 120000;

export const fetchWithTimeout = async (url, init, timeoutMs = DEFAULT_TIMEOUT_MS, externalSignal) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromExternalSignal = () => controller.abort();

  if (externalSignal?.aborted) controller.abort();
  externalSignal?.addEventListener('abort', abortFromExternalSignal);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', abortFromExternalSignal);
  }
};