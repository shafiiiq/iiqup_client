import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const TABLE_ROW_COUNT = 3;
export const BLANK_ROW = { description: '', qty: '', cost: '', total: '' };

export const parseDateParts = (val) => {
  if (!val) return null;
  if (typeof val === 'string' && val.includes('T')) {
    const d = new Date(val);
    if (isNaN(d)) return null;
    return { yyyy: d.getFullYear(), mm: String(d.getMonth() + 1).padStart(2, '0'), dd: String(d.getDate()).padStart(2, '0') };
  }

  const isoMatch = String(val).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return { yyyy: isoMatch[1], mm: isoMatch[2], dd: isoMatch[3] };

  const parts = String(val).split(/[-/.]/).map((p) => p.trim());
  if (parts.length === 3) {
    const [p1, p2, p3] = parts;
    if (p1.length === 4) return { yyyy: p1, mm: p2.padStart(2, '0'), dd: p3.padStart(2, '0') };
    if (p3.length === 4) return { yyyy: p3, mm: p1.padStart(2, '0'), dd: p2.padStart(2, '0') };
  }

  return null;
};

export const toDisplayDate = (val) => {
  const parts = parseDateParts(val);
  if (!parts) return '';
  return `${parts.dd}/${parts.mm}/${parts.yyyy}`;
};

export const toIsoInputDate = (val) => {
  const parts = parseDateParts(val);
  if (!parts) return '';
  return `${parts.yyyy}-${parts.mm}-${parts.dd}`;
};

export const normaliseTableRows = (rows = []) => {
  const padded = [
    ...rows,
    ...Array(Math.max(0, TABLE_ROW_COUNT - rows.length)).fill(null).map(() => ({ ...BLANK_ROW })),
  ];
  return padded.slice(0, TABLE_ROW_COUNT);
};

export const convertImageToBase64 = (url) => new Promise((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    resolve(canvas.toDataURL('image/png'));
  };
  img.onerror = reject;
  img.src = url;
});

export const hideControls = () => {
  const el = document.querySelector('.bcr-controls');
  if (el) el.style.display = 'none';
  return el;
};

export const showControls = (el) => {
  if (el) el.style.display = '';
};

export const buildPdf = async (element) => {
  if (!element || !(element instanceof HTMLElement)) {
    throw new Error('Backcharge document element is not available.');
  }

  if (!document.body.contains(element)) {
    throw new Error('Element is not attached to a Document.');
  }

  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    logging: false,
    allowTaint: false,
    backgroundColor: '#FFFFFF',
    width: element.offsetWidth,
    height: element.offsetHeight,
    scrollX: 0,
    scrollY: 0,
    foreignObjectRendering: false,
    letterRendering: true,
    dpi: 300,
    onclone: (clonedDoc) => {
      clonedDoc.head.querySelectorAll('style, link').forEach((node) => {
        const text = (node.textContent || '').toLowerCase();
        const hasUnsupportedColorFunction = text.includes('color-mix') || text.includes('color(');
        if (hasUnsupportedColorFunction) {
          node.remove();
        }
      });

      clonedDoc.querySelector('.bcr-controls')?.remove();
      clonedDoc.querySelectorAll('*').forEach((el) => {
        el.style.webkitFontSmoothing = 'antialiased';
        el.style.mozOsxFontSmoothing = 'grayscale';
      });
    },
  });

  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: false });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const imgH = (canvas.height * pdfW) / canvas.width;

  if (imgH > pdfH) {
    const scaledW = (canvas.width * pdfH) / canvas.height;
    pdf.addImage(imgData, 'PNG', (pdfW - scaledW) / 2, 0, scaledW, pdfH, '', 'FAST');
  } else {
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, imgH, '', 'FAST');
  }

  return pdf;
};
