import jsPDF from 'jspdf';
import { CATEGORIES, IMAGE_MIME_TYPES } from '../constants/document.constant';

export const isImageFile = (file) =>
  IMAGE_MIME_TYPES.has(file.type.toLowerCase()) || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name);

export const getFileIcon = (filename = '', mimetype = '') => {
  const ext = filename.split('.').pop().toLowerCase();
  const mime = mimetype.toLowerCase();
  if (ext === 'pdf' || mime.includes('pdf')) return 'PdfIcon';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext) || mime.includes('image')) return 'ImageIcon';
  if (['doc', 'docx'].includes(ext) || mime.includes('word')) return 'DocumentIcon';
  if (['xls', 'xlsx'].includes(ext) || mime.includes('spreadsheet')) return 'ExcelIcon';
  if (['ppt', 'pptx'].includes(ext) || mime.includes('presentation')) return 'PowerPointIcon';
  if (['zip', 'rar', '7z'].includes(ext)) return 'ZipIcon';
  if (ext === 'txt' || mime.includes('text')) return 'TextFileIcon';
  return 'AttachmentIcon';
};

export const getCategoryLabel = (cat) =>
  CATEGORIES.find((c) => c.value === cat)?.label || cat?.toUpperCase() || cat;

export const sortByUploadDate = (docs) =>
  [...docs].sort((a, b) => new Date(b.uploadDate || 0) - new Date(a.uploadDate || 0));

export const convertImageToPDF = (imageFile) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        try {
          const pdf = new jsPDF();
          const pdfW = pdf.internal.pageSize.getWidth();
          const pdfH = pdf.internal.pageSize.getHeight();
          const ratio = Math.min(pdfW / img.width, pdfH / img.height);
          const fw = img.width * ratio;
          const fh = img.height * ratio;
          pdf.addImage(e.target.result, 'JPEG', (pdfW - fw) / 2, (pdfH - fh) / 2, fw, fh);
          const name = imageFile.name.replace(/\.[^/.]+$/, '.pdf');
          resolve(new File([pdf.output('blob')], name, { type: 'application/pdf', lastModified: Date.now() }));
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(imageFile);
  });

export const buildDocumentViewNavTree = (groupedDocuments) => {
  const categories = Object.keys(groupedDocuments || {});
  if (!categories.length) return [];

  const allDocumentsCount = categories.reduce((total, category) => total + groupedDocuments[category].length, 0);

  const categoryNodes = categories.map((category) => {
    const documentsInCategory = groupedDocuments[category] || [];
    const documentsByType = documentsInCategory.reduce((acc, document) => {
      const documentType = document.documentType || 'Unknown';
      if (!acc[documentType]) acc[documentType] = [];
      acc[documentType].push(document);
      return acc;
    }, {});

    const documentTypeNodes = Object.entries(documentsByType).map(([documentType, documents]) => {
      const isSplitOrMerged = documentType.includes('(Split)') || documentType.includes('(Merged)');
      if (isSplitOrMerged) {
        return { key: documentType, label: documentType, badge: documents.length };
      }

      const children = [{ key: 'latest', label: 'Latest', badge: 1 }];
      if (documents.length > 1) children.push({ key: 'old', label: 'Old', badge: documents.length - 1 });

      return { key: documentType, label: documentType, badge: documents.length, children };
    });

    return { key: category, label: getCategoryLabel(category), badge: documentsInCategory.length, children: documentTypeNodes };
  });

  return [
    { key: 'all', label: 'All Documents', badge: allDocumentsCount },
    ...categoryNodes,
  ];
};

export const getFileExtension = (filename = '') => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

export const buildDisplayFileName = (doc) => {
  const baseName = doc.displayFileName || doc.documentType || doc.fileName;
  const extension = getFileExtension(doc.fileName);
  const alreadyHasExtension = extension && baseName.toLowerCase().endsWith(`.${extension}`);
  return extension && !alreadyHasExtension ? `${baseName}.${extension}` : baseName;
};