export const PDF_EDITOR_FONTS = [
  { value: 'Helvetica', label: 'Helvetica (Sans-serif)', css: 'Helvetica, Arial, sans-serif' },
  { value: 'Times', label: 'Times (Serif)', css: '"Times New Roman", Times, serif' },
  { value: 'Courier', label: 'Courier (Monospace)', css: '"Courier New", Courier, monospace' },
];

export const TEXT_LINE_HEIGHT_RATIO = 1.2;

export const PDF_EDITOR_DEFAULT_SIZES = {
  text: { w: 0.3, h: 0.05 },
  rect: { w: 0.25, h: 0.12 },
  ellipse: { w: 0.25, h: 0.12 },
  line: { w: 0.25, h: 0.01 },
};

const MAXIMUM_IMAGE_DIMENSION = 1800;

export const clampNumber = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export const getFontCss = (family) => (PDF_EDITOR_FONTS.find((font) => font.value === family) || PDF_EDITOR_FONTS[0]).css;

export const createPdfElement = (type, page, box) => {
  const base = {
    id: `element-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    page,
    type,
    ...box,
  };
  if (type === 'text') {
    return { ...base, text: '', fontFamily: 'Helvetica', bold: false, italic: false, size: 14, color: '#000000' };
  }
  if (type === 'rect' || type === 'ellipse') {
    return { ...base, strokeColor: '#d32f2f', strokeWidth: 2, fillColor: null, opacity: 1 };
  }
  if (type === 'line') {
    return { ...base, strokeColor: '#d32f2f', strokeWidth: 2, opacity: 1, flip: false };
  }
  return { ...base, opacity: 1 };
};

export const readImageFile = (file) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const ratio = Math.min(1, MAXIMUM_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * ratio));
      const height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(image, 0, 0, width, height);
      const isJpeg = file.type === 'image/jpeg';
      const dataUrl = canvas.toDataURL(isJpeg ? 'image/jpeg' : 'image/png', 0.9);
      URL.revokeObjectURL(objectUrl);
      resolve({ dataUrl, width, height });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('This image cannot be read'));
    };
    image.src = objectUrl;
  });