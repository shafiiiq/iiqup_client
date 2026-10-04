import pdfjsLib, { safeDestroy } from './pdfClient';

const RENDER_SCALE = 2;
const JPEG_QUALITY = 0.92;

export const renderPdfToJpegFiles = async ({ url, baseName, onProgress }) => {
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) throw new Error('Failed to download the PDF');
  const loadingTask = pdfjsLib.getDocument({ data: await response.arrayBuffer() });
  try {
    const pdf = await loadingTask.promise;
    const files = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport }).promise;
      const blob = await new Promise((resolve, reject) =>
        canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('Could not create image'))), 'image/jpeg', JPEG_QUALITY)
      );
      files.push(new File([blob], `${baseName} - Page ${pageNumber}.jpg`, { type: 'image/jpeg' }));
      canvas.width = 0;
      page.cleanup();
      if (onProgress) onProgress(pageNumber / pdf.numPages);
    }
    return files;
  } finally {
    safeDestroy(loadingTask);
  }
};