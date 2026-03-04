import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import './Documents.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/api';
import jsPDF from 'jspdf';
import DevModal from '../../common/DevModal/DevModal';
import { useHeaderTitle } from '../../context/HeaderTitleContext';
import Button from '../../common/Button/Button';
import Input from '../../common/Input/Input';
import PDFPreviewModal from '../../common/PDFPreviewModal/PDFPreviewModal';
import Loader from '../../common/Loader/Loader';

// ─── Static config ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'certificate',   label: 'Certificates'       },
  { value: 'inspection',    label: 'Inspections'        },
  { value: 'specification', label: 'Specifications'     },
  { value: 'handover',      label: 'Handover Documents' },
  { value: 'manual',        label: 'Manuals'            },
  { value: 'warranty',      label: 'Warranty'           },
];

const FALLBACK_DOC_TYPES = [
  'Hand Over', 'Hook Rope Certificate', 'Rope Inspection Certificate',
  'Crane Oil Specification', 'Maintenance Certificate', 'Safety Inspection',
  'Calibration Certificate', 'Operating Manual', 'Warranty Document', 'Installation Certificate',
];

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']);

const EMPTY_FORM = {
  documentType: '',
  description:  '',
  uploadDate:   new Date().toISOString().split('T')[0],
  category:     'certificate',
  expiry:       new Date().toISOString().split('T')[0],
  date:         new Date().toISOString().split('T')[0],
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const isImageFile = (file) =>
  IMAGE_MIME_TYPES.has(file.type.toLowerCase()) || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name);

const getFileIcon = (filename = '', mimetype = '') => {
  const ext  = filename.split('.').pop().toLowerCase();
  const mime = mimetype.toLowerCase();
  if (ext === 'pdf'  || mime.includes('pdf'))           return 'picture_as_pdf';
  if (['jpg','jpeg','png','gif','bmp','webp'].includes(ext) || mime.includes('image')) return 'image';
  if (['doc','docx'].includes(ext) || mime.includes('word'))        return 'description';
  if (['xls','xlsx'].includes(ext) || mime.includes('spreadsheet')) return 'table_chart';
  if (['ppt','pptx'].includes(ext) || mime.includes('presentation')) return 'slideshow';
  if (['zip','rar','7z'].includes(ext))                 return 'folder_zip';
  if (ext === 'txt'  || mime.includes('text'))          return 'text_fields';
  return 'attach_file';
};

const getCategoryLabel = (cat) =>
  CATEGORIES.find(c => c.value === cat)?.label || cat?.toUpperCase() || cat;

const sortByUploadDate = (docs) =>
  [...docs].sort((a, b) => new Date(b.uploadDate || 0) - new Date(a.uploadDate || 0));

const convertImageToPDF = (imageFile) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload  = (e) => {
      const img   = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload  = () => {
        try {
          const pdf   = new jsPDF();
          const pdfW  = pdf.internal.pageSize.getWidth();
          const pdfH  = pdf.internal.pageSize.getHeight();
          const ratio = Math.min(pdfW / img.width, pdfH / img.height);
          const fw    = img.width  * ratio;
          const fh    = img.height * ratio;
          pdf.addImage(e.target.result, 'JPEG', (pdfW - fw) / 2, (pdfH - fh) / 2, fw, fh);
          const name = imageFile.name.replace(/\.[^/.]+$/, '.pdf');
          resolve(new File([pdf.output('blob')], name, { type: 'application/pdf', lastModified: Date.now() }));
        } catch (err) { reject(err); }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(imageFile);
  });

// ─── Component ────────────────────────────────────────────────────────────────

function DocumentDetails() {
  const { type, id }                          = useParams();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();

  const [activeTab,          setActiveTab]          = useState('add');
  const [sourceType,         setSourceType]         = useState('');
  const [sourceData,         setSourceData]         = useState(null);

  const [formData,           setFormData]           = useState(EMPTY_FORM);
  const [docTypeInput,       setDocTypeInput]       = useState('');
  const [documentTypes,      setDocumentTypes]      = useState([]);
  const [selectedFile,       setSelectedFile]       = useState(null);
  const [previewImage,       setPreviewImage]       = useState(null);
  const [isDragging,         setIsDragging]         = useState(false);
  const [isLoading,          setIsLoading]          = useState(false);
  const [message,            setMessage]            = useState({ text: '', type: '' });
  const [uploadProgress,     setUploadProgress]     = useState(0);
  const [showProgressModal,  setShowProgressModal]  = useState(false);

  const [documentsList,      setDocumentsList]      = useState([]);
  const [currentView,        setCurrentView]        = useState('categories');
  const [currentPath,        setCurrentPath]        = useState([{ name: 'Documents', view: 'categories' }]);
  const [currentCategory,    setCurrentCategory]    = useState(null);
  const [currentDocType,     setCurrentDocType]     = useState(null);

  const [selectionMode,      setSelectionMode]      = useState(false);
  const [selectedDocuments,  setSelectedDocuments]  = useState([]);

  const [showDeleteModal,    setShowDeleteModal]    = useState(false);
  const [deleteDocumentId,   setDeleteDocumentId]   = useState(null);
  const [deleteDocumentName, setDeleteDocumentName] = useState('');

  const [renamingDocId,      setRenamingDocId]      = useState(null);
  const [newFileName,        setNewFileName]        = useState('');

  const [showSplitModal,     setShowSplitModal]     = useState(false);
  const [splitDocument,      setSplitDocument]      = useState(null);
  const [splitDocumentUrl,   setSplitDocumentUrl]   = useState(null);
  const [splitDocumentName,  setSplitDocumentName]  = useState('');

  // ─── Derived ───────────────────────────────────────────────────────────────

  const groupedDocuments = useMemo(() =>
    documentsList.reduce((acc, doc) => {
      const cat = doc.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(doc);
      return acc;
    }, {}),
  [documentsList]);

  // ─── Header ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!sourceData) {
      setHeaderTitle(null); setHeaderSubtitle(null);
      return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
    }
    const title = activeTab === 'add' ? 'Upload Document' : 'View Document';
    const subtitles = {
      equipment:      `${sourceData.machine || 'Equipment'}    - ${sourceData.regNo   || id}`,
      operator:       `${sourceData.name    || 'Operator'}     - ${sourceData.qatarId || id}`,
      mechanic:       `${sourceData.name    || 'Mechanic'}     - ${id}`,
      'office-staff': `${sourceData.name    || 'Office Staff'} - ${sourceData.email   || id}`,
    };
    setHeaderTitle(title);
    setHeaderSubtitle(subtitles[sourceType] ?? id);
    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [sourceData, sourceType, id, activeTab, setHeaderTitle, setHeaderSubtitle]);

  // ─── File processing ───────────────────────────────────────────────────────

  const processFile = useCallback(async (file) => {
    try {
      if (isImageFile(file)) {
        setMessage({ text: 'Converting image to PDF...', type: 'info' });
        const converted = await convertImageToPDF(file);
        setSelectedFile(converted);
        const reader = new FileReader();
        reader.onloadend = () => setPreviewImage(reader.result);
        reader.readAsDataURL(file);
        setMessage({ text: 'Image converted to PDF successfully!', type: 'success' });
      } else {
        setSelectedFile(file);
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => setPreviewImage(reader.result);
          reader.readAsDataURL(file);
        } else {
          setPreviewImage(null);
        }
      }
    } catch (err) {
      setMessage({ text: `Error processing file: ${err.message}`, type: 'error' });
    }
  }, []);

  // ─── Document-level drag (add tab only) ────────────────────────────────────

  useEffect(() => {
    if (activeTab !== 'add') return;
    const onOver  = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const onLeave = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (e.target === document.body || !document.body.contains(e.relatedTarget)) setIsDragging(false);
    };
    const onDrop = (e) => {
      e.preventDefault(); e.stopPropagation(); setIsDragging(false);
      const f = e.dataTransfer.files?.[0]; if (f) processFile(f);
    };
    document.addEventListener('dragover',  onOver);
    document.addEventListener('dragleave', onLeave);
    document.addEventListener('drop',      onDrop);
    return () => {
      document.removeEventListener('dragover',  onOver);
      document.removeEventListener('dragleave', onLeave);
      document.removeEventListener('drop',      onDrop);
      setIsDragging(false);
    };
  }, [activeTab, processFile]);

  // ─── Fetch source entity ───────────────────────────────────────────────────

  useEffect(() => {
    if (!type || !id) return;
    const ENDPOINTS = {
      equipment:      `${END_POINT}/equipments/get-equipment/${id}`,
      operator:       `${END_POINT}/operators/get-operator/${id}`,
      mechanic:       `${END_POINT}/mechanics/get-mechanic/${id}`,
      'office-staff': `${END_POINT}/users/get-user/${id}`,
    };
    const run = async () => {
      try {
        setSourceType(type);
        const url = ENDPOINTS[type]; if (!url) return;
        const res  = await apiRequest(url, 'GET');
        const data = await res.json();
        setSourceData(data.data || data);
      } catch (err) { console.error('Error fetching source data:', err); }
    };
    run();
    fetchDocumentTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, id]);

  // ─── Fetch docs when switching to view tab ─────────────────────────────────

  useEffect(() => {
    if (activeTab !== 'view' || !type || !id) return;
    setCurrentView('categories');
    setCurrentPath([{ name: 'Documents', view: 'categories' }]);
    setCurrentCategory(null);
    setCurrentDocType(null);
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, type, id]);

  // ─── API ───────────────────────────────────────────────────────────────────

  const fetchDocumentTypes = async () => {
    try {
      const res  = await apiRequest(`${END_POINT}/documents/get-all-documents-types`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const types = data.documents?.map(d => d.documentType?.trim()).filter(Boolean) ?? [];
      setDocumentTypes(types.length ? [...new Set(types)].sort() : FALLBACK_DOC_TYPES);
    } catch { setDocumentTypes(FALLBACK_DOC_TYPES); }
  };

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest(`${END_POINT}/documents/get-documents/${sourceType || type}/${id}`, 'GET');
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      const out = [];
      data.documents?.forEach(doc => {
        doc.files?.forEach(file => {
          out.push({
            _id: file._id, sourceId: doc.SourceId,
            sourceType: doc.documentSource?.[0]?.source,
            documentType: doc.documentType,
            fileName: file.filename, displayFileName: file.displayFileName,
            filePath: file.path, mimetype: file.mimetype,
            date: file.date, expiry: file.expiry,
            uploadDate: file.uploadedAt || file.createdAt,
            createdAt: file.createdAt, updatedAt: file.updatedAt,
            description: doc.description || '', category: doc.category || 'other',
          });
        });
      });
      setDocumentsList(out);
    } catch (err) {
      setMessage({ text: `Error: ${err.message}`, type: 'error' });
    } finally { setIsLoading(false); }
  };

  // ─── Form ──────────────────────────────────────────────────────────────────

  const handleInputChange   = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleDocTypeChange = (e) => { setDocTypeInput(e.target.value); setFormData(p => ({ ...p, documentType: e.target.value })); };
  const handleFileChange    = async (e) => { const f = e.target.files?.[0]; if (f) processFile(f); };
  const handleReset         = () => { setFormData(EMPTY_FORM); setDocTypeInput(''); setSelectedFile(null); setPreviewImage(null); setMessage({ text: '', type: '' }); };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedFile || !id || !sourceType || !formData.documentType) {
      setMessage({ text: 'Please fill all required fields and select a file', type: 'error' }); return;
    }
    setIsLoading(true); setMessage({ text: '', type: '' });
    setShowProgressModal(true); setUploadProgress(0);
    const iv = setInterval(() => setUploadProgress(p => p >= 90 ? p : p + Math.random() * 15), 150);
    try {
      const res = await apiRequest(`${END_POINT}/documents/upload-document`, 'POST', {
        sourceId: id, sourceType, documentType: formData.documentType,
        fileName: selectedFile.name, mimeType: selectedFile.type,
        description: formData.description, category: formData.category,
        date: formData.date, expiry: formData.expiry,
      });
      const result = await res.json();
      if (result.status !== 200) throw new Error(result.message || 'Upload failed');
      const s3 = await fetch(result.uploadUrl, { method: 'PUT', body: selectedFile, headers: { 'Content-Type': selectedFile.type } });
      if (!s3.ok) throw new Error(`S3 upload failed: ${s3.status}`);
      clearInterval(iv); setUploadProgress(100);
      setMessage({ text: 'Document uploaded successfully!', type: 'success' });
      if (!documentTypes.includes(formData.documentType))
        setDocumentTypes(p => [...p, formData.documentType].sort());
      setTimeout(() => { setShowProgressModal(false); setUploadProgress(0); handleReset(); }, 2000);
    } catch (err) {
      clearInterval(iv);
      setMessage({ text: `Error: ${err.message}`, type: 'error' });
      setTimeout(() => { setShowProgressModal(false); setUploadProgress(0); }, 3000);
    } finally { setIsLoading(false); }
  };

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleView = async (documentId, fileName) => {
    const isIOS     = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    try {
      setMessage({ text: 'Opening document...', type: 'info' });
      if (isIOS) {
        window.location.href = `${END_POINT}/documents/view/${documentId}`;
        setMessage({ text: "Document opened. Use Safari's share button to save if needed.", type: 'success' });
        return;
      }
      const res    = await apiRequest(`${END_POINT}/documents/view/${documentId}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data   = await res.json();
      const s3Res  = await apiRequest(`${END_POINT}/s3/get-pre-signed-url`, 'POST', { key: data.document.filePath, isLong: false });
      const s3Data = await s3Res.json();
      const url    = s3Data.dataUrl;
      const mime   = data.document.mimetype.toLowerCase();
      if (isAndroid) {
        if (mime.includes('pdf')) { if (!window.open(url, '_blank')) window.location.href = url; }
        else if (mime.includes('image')) {
          const win = window.open();
          if (win) win.document.write(`<html><head><title>${fileName}</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh}img{max-width:100%;max-height:100vh;object-fit:contain}</style></head><body><img src="${url}" alt="${fileName}"></body></html>`);
          else window.location.href = url;
        } else { window.location.href = url; }
      } else {
        if (!window.open(url, '_blank')) { setMessage({ text: 'Popup blocked. Please allow popups and try again.', type: 'error' }); return; }
      }
      setMessage({ text: 'Document opened successfully.', type: 'success' });
    } catch (err) { setMessage({ text: `Error viewing: ${err.message}`, type: 'error' }); }
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      setMessage({ text: 'Preparing download...', type: 'info' });
      const res    = await apiRequest(`${END_POINT}/documents/download/${documentId}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data   = await res.json();
      const s3Res  = await apiRequest(`${END_POINT}/s3/get-pre-signed-url`, 'POST', { key: data.document.filePath, isLong: false });
      const s3Data = await s3Res.json();
      const fr     = await fetch(s3Data.dataUrl);
      if (!fr.ok) throw new Error(`Failed to fetch file: ${fr.status}`);
      const url  = URL.createObjectURL(await fr.blob());
      const link = Object.assign(document.createElement('a'), { href: url, download: fileName, style: 'display:none' });
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setMessage({ text: 'Download completed!', type: 'success' });
    } catch (err) { setMessage({ text: `Error downloading: ${err.message}`, type: 'error' }); }
  };

  const handleDelete = async () => {
    if (!deleteDocumentId) return;
    try {
      setMessage({ text: 'Deleting document...', type: 'info' }); setShowDeleteModal(false);
      const res = await apiRequest(`${END_POINT}/documents/delete/${deleteDocumentId}`, 'DELETE');
      if (!res.ok) { const r = await res.json(); throw new Error(r.message || 'Delete failed'); }
      setMessage({ text: 'Document deleted successfully!', type: 'success' });
      setDeleteDocumentId(null); setDeleteDocumentName('');
      fetchDocuments();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) { setMessage({ text: `Error deleting: ${err.message}`, type: 'error' }); }
  };

  const handleSaveRename = async (docId) => {
    if (!newFileName.trim()) { setMessage({ text: 'File name cannot be empty', type: 'error' }); return; }
    try {
      const res    = await apiRequest(`${END_POINT}/documents/rename-file/${docId}`, 'PUT', { newFileName: newFileName.trim() });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Rename failed');
      setMessage({ text: 'File renamed successfully!', type: 'success' });
      setRenamingDocId(null); setNewFileName(''); fetchDocuments();
    } catch (err) { setMessage({ text: `Error: ${err.message}`, type: 'error' }); }
  };

  const handleSplitPDF = async (documentId, fileName, filePath) => {
    try {
      const res  = await apiRequest(`${END_POINT}/s3/get-pre-signed-url`, 'POST', { key: filePath, isLong: false });
      const data = await res.json();
      setSplitDocument(documentId); setSplitDocumentUrl(data.dataUrl); setSplitDocumentName(fileName); setShowSplitModal(true);
    } catch { setMessage({ text: 'Failed to load PDF preview', type: 'error' }); }
  };

  const handleMergePages = async (documentId, pageNumbers) => {
    try {
      const res    = await apiRequest(`${END_POINT}/documents/split-pdf`, 'POST', { sourceId: id, sourceType, documentId, splitOptions: { pages: pageNumbers, splitType: 'specific' }, category: currentCategory === 'all' ? 'merged' : currentCategory });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Merge failed');
      setMessage({ text: `Merged ${pageNumbers.length} pages successfully!`, type: 'success' });
      setShowSplitModal(false); fetchDocuments();
    } catch (err) { setMessage({ text: `Error: ${err.message}`, type: 'error' }); }
  };

  const handleSplitAllPages = async (documentId, totalPages) => {
    try {
      const res    = await apiRequest(`${END_POINT}/documents/split-pdf`, 'POST', { sourceId: id, sourceType, documentId, splitOptions: { pages: [1], splitType: 'every' }, category: currentCategory === 'all' ? 'split' : currentCategory });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Split failed');
      setMessage({ text: `Split all ${totalPages} pages successfully!`, type: 'success' });
      setShowSplitModal(false); fetchDocuments();
    } catch (err) { setMessage({ text: `Error: ${err.message}`, type: 'error' }); }
  };

  const handleMergePDFs = async () => {
    if (selectedDocuments.length < 2) { setMessage({ text: 'Please select at least 2 PDFs to merge', type: 'error' }); return; }
    try {
      const res    = await apiRequest(`${END_POINT}/documents/merge-pdfs`, 'POST', { sourceId: id, sourceType, documentIds: selectedDocuments, category: currentCategory === 'all' ? 'merged' : currentCategory, documentType: 'Merged Document' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Merge failed');
      setMessage({ text: 'PDFs merged successfully!', type: 'success' });
      setTimeout(() => { setSelectionMode(false); setSelectedDocuments([]); fetchDocuments(); }, 2000);
    } catch (err) { setMessage({ text: `Error: ${err.message}`, type: 'error' }); }
  };

  // ─── Navigation ────────────────────────────────────────────────────────────

  const navigateToAllDocuments = () => {
    setCurrentCategory('all'); setCurrentView('allDocsFiles');
    setCurrentPath([{ name: 'Documents', view: 'categories' }, { name: 'All Documents', view: 'allDocsFiles', category: 'all' }]);
  };

  const navigateToCategory = (category) => {
    setCurrentCategory(category); setCurrentView('docTypes');
    setCurrentPath([{ name: 'Documents', view: 'categories' }, { name: getCategoryLabel(category), view: 'docTypes', category }]);
  };

  const navigateToDocType = (docType) => {
    const isSM = docType.includes('(Split)') || docType.includes('(Merged)');
    const view = isSM ? 'files' : 'subfolders';
    setCurrentDocType({ name: docType }); setCurrentView(view);
    setCurrentPath([
      { name: 'Documents', view: 'categories' },
      { name: getCategoryLabel(currentCategory), view: 'docTypes', category: currentCategory },
      { name: docType, view, category: currentCategory, docType },
    ]);
  };

  const navigateToSubfolder = (docType, isLatest) => {
    setCurrentDocType({ name: docType, isLatest }); setCurrentView('files');
    setCurrentPath([
      { name: 'Documents', view: 'categories' },
      { name: getCategoryLabel(currentCategory), view: 'docTypes', category: currentCategory },
      { name: docType, view: 'subfolders', category: currentCategory, docType },
      { name: isLatest ? 'Latest' : 'Old', view: 'files', category: currentCategory, docType, isLatest },
    ]);
  };

  const navigateToPath = (i) => {
    const t = currentPath[i];
    setCurrentPath(p => p.slice(0, i + 1));
    ({ categories: () => { setCurrentView('categories'); setCurrentCategory(null); setCurrentDocType(null); },
       docTypes:   () => { setCurrentView('docTypes');   setCurrentCategory(t.category); setCurrentDocType(null); },
       subfolders: () => { setCurrentView('subfolders'); setCurrentCategory(t.category); setCurrentDocType({ name: t.docType }); },
       files:      () => { setCurrentView('files');      setCurrentCategory(t.category); setCurrentDocType({ name: t.docType, isLatest: t.isLatest }); },
    })[t.view]?.();
  };

  const goBack = () => { if (currentPath.length > 1) navigateToPath(currentPath.length - 2); };

  // ─── Shared button presets ─────────────────────────────────────────────────

  const TAB_BTN  = { variant: 'gradient', font: 'md', animation: '', squircle: '4xl', width: '50%', height: '48px', type: 'submit', shadowPosition: 'to-bottom', shadowColor: 'white-600' };
  const FILE_BTN = { variant: 'gradient', font: 'lg', type: 'button', squircle: '4xl' };

  // ─── Document card ─────────────────────────────────────────────────────────

  const DocCard = ({ doc, showSplit = false }) => (
    <div className={`doc-details-grid-item-wrapper ${selectedDocuments.includes(doc._id) ? 'selected' : ''}`}>
      <div className="doc-details-file-actions">
        <Button {...FILE_BTN} text="Rename" width="33%" height="40px" colorScheme="orange-600" textColor="white-900" squircle="6xl"
          onClick={() => { setRenamingDocId(doc._id); setNewFileName((doc.displayFileName || doc.fileName).replace(/\.[^/.]+$/, '')); }} />
        <Button {...FILE_BTN} text="Delete" width="33%" height="40px" colorScheme="red-600"    textColor="white-900" squircle="6xl"
          onClick={() => { setDeleteDocumentId(doc._id); setDeleteDocumentName(doc.displayFileName || doc.fileName); setShowDeleteModal(true); }} />
      </div>
      <div className="doc-details-grid-item"
        onClick={() => selectionMode && setSelectedDocuments(p => p.includes(doc._id) ? p.filter(d => d !== doc._id) : [...p, doc._id])}>
        {selectionMode && (
          <div className="doc-details-selection-checkbox">
            <input type="checkbox" readOnly checked={selectedDocuments.includes(doc._id)} onChange={() => {}} />
          </div>
        )}
        <div className="doc-details-file-icon">
          <span className="material-symbols-rounded">{getFileIcon(doc.fileName, doc.mimetype)}</span>
        </div>
        <div className="doc-details-item-name">{doc.displayFileName || doc.documentType}</div>
        <div className="doc-details-item-info">Issued: {doc.date}</div>
        <div className="doc-details-item-info">Expiry: {doc.expiry}</div>
      </div>
      {!selectionMode && (
        <div className="doc-details-file-actions">
          <Button {...FILE_BTN} text="View"     width="100px" height="40px" colorScheme="amber-600"  textColor="white-900" onClick={() => handleView(doc._id, doc.fileName)} />
          <Button {...FILE_BTN} text="Download" width="190px" height="40px" colorScheme="blue-600"   textColor="white-900" onClick={() => handleDownload(doc._id, doc.fileName)} />
          {showSplit && <Button {...FILE_BTN} text="Split" width="100px" height="40px" colorScheme="purple-600" textColor="white-900" onClick={() => handleSplitPDF(doc._id, doc.fileName, doc.filePath)} />}
        </div>
      )}
    </div>
  );

  const EmptyState = ({ icon = '📄', title = 'No Files', msg = 'No files found.' }) => (
    <div className="doc-details-empty-state">
      <div className="doc-details-empty-icon">{icon}</div>
      <h3>{title}</h3><p>{msg}</p>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`doc-details-container ${isDragging ? 'dragging-active' : ''}`}>

      <div className="doc-details-tabs">
        <Button {...TAB_BTN} text="Add Document"   onClick={() => setActiveTab('add')}  colorScheme={activeTab === 'add'  ? 'amber-300' : 'amber-900'} textColor={activeTab === 'add'  ? 'black-300' : 'white-900'} />
        <Button {...TAB_BTN} text="View Documents" onClick={() => setActiveTab('view')} colorScheme={activeTab === 'view' ? 'amber-400' : 'amber-900'} textColor={activeTab === 'view' ? 'black-300' : 'white-900'} />
      </div>

      {message.text && <div className={`doc-details-message ${message.type}`}>{message.text}</div>}

      <DevModal isOpen={showProgressModal} type="progress" title="Uploading Document"
        message={selectedFile ? `Uploading: ${selectedFile.name}` : 'Uploading to cloud storage...'}
        progress={uploadProgress} progressText="Processing..." />

      {/* ── ADD TAB ── */}
      {activeTab === 'add' && (
        <div className="doc-details-form-container">
          <form className="doc-details-form-split">
            <div className="doc-details-form-left">
              <div className="doc-details-form-group">
                <Input type="select" id="category" name="category" value={formData.category}
                  onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                  placeholder="Select category" required options={CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
                  colorScheme="yellow-300" textColor="black-100" label="Category" labelBgColor="transparent"
                  labelSize="3xl" labelColor="yellow-300" variant="gradient" width="100%" height="57px"
                  squircle="4xl" fontWeight="500" inputPaddingInline="2xl" inputPaddingBlock="xl" />
              </div>
              <div className="doc-details-form-group">
                <Input type="search-select" id="documentType" name="documentType" value={docTypeInput}
                  onChange={handleDocTypeChange} placeholder="Type to search or add new document type" required
                  options={documentTypes.map(t => ({ value: t, label: t }))}
                  colorScheme="yellow-300" textColor="black-100" label="Document Type" labelBgColor="transparent"
                  labelSize="3xl" labelColor="yellow-300" placeholderColor="black-100" variant="gradient"
                  width="100%" height="57px" squircle="4xl" fontWeight="500" inputPaddingInline="2xl" inputPaddingBlock="xl" />
              </div>
              <div className="doc-details-form-group">
                <Input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange}
                  placeholder="Select issue date" required colorScheme="yellow-300" textColor="black-100"
                  label="Date of Issue" labelBgColor="transparent" labelSize="3xl" labelColor="yellow-300"
                  variant="gradient" width="100%" height="57px" squircle="4xl" fontWeight="500"
                  inputPaddingInline="2xl" inputPaddingBlock="xl" iconRight="calendar_today" />
              </div>
              <div className="doc-details-form-group">
                <Input type="date" id="expiry" name="expiry" value={formData.expiry} onChange={handleInputChange}
                  placeholder="Select expiry date" required colorScheme="yellow-300" textColor="black-100"
                  label="Date of Expiry" labelBgColor="transparent" labelSize="3xl" labelColor="yellow-300"
                  variant="gradient" width="100%" height="57px" squircle="4xl" fontWeight="500"
                  inputPaddingInline="2xl" inputPaddingBlock="xl" iconRight="event" />
              </div>
              <div className="doc-details-form-group doc-details-form-group-wide">
                <Input type="textarea" id="description" name="description" value={formData.description}
                  onChange={handleInputChange} placeholder="Enter document description (optional)" rows={10}
                  colorScheme="yellow-300" textColor="black-100" label="Description" labelBgColor="transparent"
                  labelSize="3xl" labelColor="yellow-300" placeholderColor="black-100" variant="gradient"
                  width="100%" squircle="4xl" fontWeight="500" inputPaddingInline="2xl" inputPaddingBlock="xl" />
              </div>
            </div>

            <div className="doc-details-form-right">
              <div className="doc-details-file-upload-section">
                <div className={`doc-details-drop-zone ${isDragging ? 'dragging' : ''}`}
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                  onDragOver={(e)  => { e.preventDefault(); e.stopPropagation(); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                  onDrop={(e)      => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}>
                  <div className="doc-details-drop-content">
                    <div className="doc-details-drop-icon"><span className="material-symbols-rounded">files</span></div>
                    <p className="doc-details-drop-text">Drag and drop your file here</p>
                    <p className="doc-details-drop-or">or</p>
                    <input type="file" id="document-file" onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp" style={{ display: 'none' }} required />
                    <div onClick={() => document.getElementById('document-file').click()}>
                      <Button text="Browse Files" colorScheme="purple-600" variant="gradient" font="md"
                        animation="" squircle="3xl" width="auto" height="44px" type="button"
                        textColor="white-900" shadowPosition="to-bottom" shadowColor="purple-800" />
                    </div>
                  </div>
                  {previewImage && <div className="doc-details-preview"><img src={previewImage} alt="Preview" /></div>}
                </div>
                {selectedFile && <div className="doc-details-file-info">Selected: {selectedFile.name}</div>}
              </div>
            </div>

            <div className="doc-details-form-actions">
              <Button text="Reset" onClick={handleReset} colorScheme="red-800" variant="gradient" font="md"
                animation="" squircle="4xl" width="200px" height="48px" type="button"
                textColor="white-900" shadowPosition="to-bottom" shadowColor="white-600" />
              <Button text={isLoading ? 'Uploading...' : 'Upload Document'} onClick={handleSubmit}
                colorScheme={isLoading ? 'lime-900' : 'lime-600'} variant="gradient" font="md" animation=""
                squircle="4xl" width="200px" height="48px" type={isLoading ? 'disabled' : 'submit'}
                textColor="white-900" shadowPosition="to-bottom" shadowColor="white-600" />
            </div>
          </form>
        </div>
      )}

      {/* ── VIEW TAB ── */}
      {activeTab === 'view' && (
        <div className="doc-details-view-container">
          {isLoading ? <Loader /> : (
            <div className="doc-details-file-explorer">
              <div className="doc-details-explorer-toolbar">
                <div className="doc-details-breadcrumb">
                  {currentPath.map((item, i) => (
                    <div key={i} className="doc-details-breadcrumb-item">
                      {i > 0 && <span className="doc-details-breadcrumb-separator">›</span>}
                      {i === currentPath.length - 1
                        ? <span className="doc-details-breadcrumb-current">📁 {item.name}</span>
                        : <span className="doc-details-breadcrumb-link" onClick={() => navigateToPath(i)}>📁 {item.name}</span>}
                    </div>
                  ))}
                </div>
                {currentPath.length > 1 && <button onClick={goBack} className="doc-details-back-btn">← Back</button>}
              </div>

              <div className="doc-details-explorer-content">

                {/* CATEGORIES */}
                {currentView === 'categories' && (
                  <div className="doc-details-grid-container">
                    {Object.keys(groupedDocuments).length > 0 ? (
                      <>
                        <div className="doc-details-grid-item doc-details-all-docs-item" onClick={navigateToAllDocuments}>
                          <div className="doc-details-folder-icon">📚</div>
                          <div className="doc-details-item-name">All Documents</div>
                          <div className="doc-details-item-info">{documentsList.length} document{documentsList.length !== 1 ? 's' : ''}</div>
                          <div className="doc-details-all-badge">ALL</div>
                        </div>
                        {Object.entries(groupedDocuments).map(([cat, docs]) => (
                          <div key={cat} className="doc-details-grid-item" onClick={() => navigateToCategory(cat)}>
                            <div className="doc-details-folder-icon">📁</div>
                            <div className="doc-details-item-name">{getCategoryLabel(cat)}</div>
                            <div className="doc-details-item-info">{docs.length} document{docs.length !== 1 ? 's' : ''}</div>
                          </div>
                        ))}
                      </>
                    ) : <EmptyState icon="📂" title="Nothing Found" msg="No files" />}
                  </div>
                )}

                {/* DOC TYPES */}
                {currentView === 'docTypes' && currentCategory && (() => {
                  const byType = (groupedDocuments[currentCategory] || []).reduce((acc, doc) => {
                    const t = doc.documentType || 'Unknown';
                    if (!acc[t]) acc[t] = []; acc[t].push(doc); return acc;
                  }, {});
                  return (
                    <div className="doc-details-grid-container">
                      {Object.keys(byType).length > 0
                        ? Object.entries(byType).map(([dt, docs]) => (
                            <div key={dt} className="doc-details-grid-item" onClick={() => navigateToDocType(dt)}>
                              <div className="doc-details-folder-icon">📁</div>
                              <div className="doc-details-item-name">{dt}</div>
                              <div className="doc-details-item-info">{docs.length} document{docs.length !== 1 ? 's' : ''}</div>
                            </div>
                          ))
                        : <EmptyState icon="📁" title="No Document Types" msg="No document types found in this category." />}
                    </div>
                  );
                })()}

                {/* SUBFOLDERS */}
                {currentView === 'subfolders' && currentCategory && currentDocType && (() => {
                  const sorted = sortByUploadDate(
                    (groupedDocuments[currentCategory] || []).filter(d => (d.documentType || 'Unknown') === currentDocType.name)
                  );
                  return (
                    <div className="doc-details-grid-container">
                      {sorted.length === 0
                        ? <EmptyState icon="📁" title="No Documents" msg="No documents found for this document type." />
                        : <>
                            <div className="doc-details-grid-item" onClick={() => navigateToSubfolder(currentDocType.name, true)}>
                              <div className="doc-details-folder-icon">📁</div>
                              <div className="doc-details-item-name">Latest</div>
                              <div className="doc-details-item-info">1 document</div>
                              <div className="doc-details-latest-badge">LATEST</div>
                            </div>
                            {sorted.length > 1 && (
                              <div className="doc-details-grid-item" onClick={() => navigateToSubfolder(currentDocType.name, false)}>
                                <div className="doc-details-folder-icon">📁</div>
                                <div className="doc-details-item-name">Old</div>
                                <div className="doc-details-item-info">{sorted.length - 1} document{sorted.length - 1 !== 1 ? 's' : ''}</div>
                                <div className="doc-details-old-badge">OLD</div>
                              </div>
                            )}
                          </>}
                    </div>
                  );
                })()}

                {/* ALL DOCS FILES */}
                {currentView === 'allDocsFiles' && (
                  <>
                    <div className="doc-details-selection-toolbar">
                      <Button {...FILE_BTN} squircle="4xl" width="auto" height="40px"
                        text={selectionMode ? 'Cancel Selection' : 'Select Multiple'}
                        colorScheme={selectionMode ? 'red-600' : 'blue-600'} textColor="white-900"
                        onClick={() => { setSelectionMode(p => !p); setSelectedDocuments([]); }} />
                      {selectionMode && selectedDocuments.length >= 2 && (
                        <Button {...FILE_BTN} squircle="4xl" width="auto" height="40px"
                          text={`Merge ${selectedDocuments.length} PDFs`} colorScheme="green-600"
                          textColor="white-900" onClick={handleMergePDFs} />
                      )}
                    </div>
                    <div className="doc-details-grid-container">
                      {sortByUploadDate(documentsList).length > 0
                        ? sortByUploadDate(documentsList).map(doc => <DocCard key={doc._id} doc={doc} showSplit />)
                        : <EmptyState />}
                    </div>
                  </>
                )}

                {/* CATEGORY FILES */}
                {currentView === 'files' && currentCategory && currentDocType && (() => {
                  const isSM = currentDocType.name.includes('(Split)') || currentDocType.name.includes('(Merged)');
                  const sorted = sortByUploadDate(
                    (groupedDocuments[currentCategory] || []).filter(d => (d.documentType || 'Unknown') === currentDocType.name)
                  );
                  const show = isSM ? sorted : currentDocType.isLatest ? sorted.slice(0, 1) : sorted.slice(1);
                  return (
                    <div className="doc-details-grid-container">
                      {show.length > 0
                        ? show.map(doc => <DocCard key={doc._id} doc={doc} />)
                        : <EmptyState msg="No files found in this folder." />}
                    </div>
                  );
                })()}

              </div>
            </div>
          )}
        </div>
      )}

      {showSplitModal && (
        <PDFPreviewModal isOpen={showSplitModal} onClose={() => setShowSplitModal(false)}
          documentId={splitDocument} documentUrl={splitDocumentUrl} fileName={splitDocumentName}
          onMergePages={handleMergePages} onSplitAll={handleSplitAllPages} />
      )}

      <DevModal isOpen={!!renamingDocId} type="form" title="Rename File"
        message="Enter a new name for this file" buttonText="Save" secondaryButtonText="Cancel"
        onButtonClick={() => handleSaveRename(renamingDocId)}
        onSecondaryClick={() => { setRenamingDocId(null); setNewFileName(''); }}
        formFields={[{ name: 'fileName', label: 'File Name', type: 'text', placeholder: 'Enter new file name', required: true }]}
        formValues={{ fileName: newFileName }}
        onFormChange={(_, value) => setNewFileName(value)} />

      <DevModal isOpen={showDeleteModal} type="error" title="Delete Document"
        message={`Are you sure you want to delete "${deleteDocumentName}"? This action cannot be undone.`}
        buttonText="Delete" secondaryButtonText="Cancel"
        onButtonClick={handleDelete}
        onSecondaryClick={() => { setShowDeleteModal(false); setDeleteDocumentId(null); setDeleteDocumentName(''); }} />
    </div>
  );
}

export default DocumentDetails;