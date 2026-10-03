export const splitIntoChunks = (items, chunkSize) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
};

export const waitForMilliseconds = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export const runWithConcurrency = async (items, concurrencyLimit, worker) => {
  let nextIndex = 0;
  let hasFailed = false;

  const runNextItems = async () => {
    while (nextIndex < items.length && !hasFailed) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      try {
        await worker(items[currentIndex]);
      } catch (error) {
        hasFailed = true;
        throw error;
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrencyLimit, items.length) }, runNextItems));
};

export const putBlobWithProgress = ({ url, blob, onProgress }) =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', url);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded);
    };
    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(`Part upload failed with status ${request.status}`));
        return;
      }
      const entityTag = request.getResponseHeader('ETag');
      if (!entityTag) {
        reject(new Error('Storage did not expose the ETag header. Update the bucket CORS settings.'));
        return;
      }
      resolve(entityTag);
    };
    request.onerror = () => reject(new Error('Network error while uploading part'));
    request.send(blob);
  });