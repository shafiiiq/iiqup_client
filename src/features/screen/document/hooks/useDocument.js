import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchDocumentTypes as fetchDocumentTypesAPI,
  fetchDocumentsBySource,
  fetchSourceEntity,
  uploadDocument,
  getDocumentViewData,
  getDocumentDownloadData,
  getSignedUrl,
  splitPdfDocument,
  splitAllPdfPages,
  mergePdfDocuments,
  deleteDocument,
  renameDocument,
} from '../api/document.api';
import { useHeaderTitle } from '@/shared/context/TitleContext';
import { EMPTY_FORM, FALLBACK_DOC_TYPES } from '../constants/document.constant';
import { isImageFile, sortByUploadDate, convertImageToPDF, getCategoryLabel } from '../helper/document.helper';

export const useDocument = ({ type, id } = {}) => {
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();

  const [activeTab, setActiveTab] = useState('add');
  const [sourceType, setSourceType] = useState('');
  const [sourceData, setSourceData] = useState(null);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [docTypeInput, setDocTypeInput] = useState('');
  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);

  const [documentsList, setDocumentsList] = useState([]);
  const [currentView, setCurrentView] = useState('categories');
  const [currentPath, setCurrentPath] = useState([{ name: 'Documents', view: 'categories' }]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentDocType, setCurrentDocType] = useState(null);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDocumentId, setDeleteDocumentId] = useState(null);
  const [deleteDocumentName, setDeleteDocumentName] = useState('');

  const [renamingDocId, setRenamingDocId] = useState(null);
  const [newFileName, setNewFileName] = useState('');

  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitDocument, setSplitDocument] = useState(null);
  const [splitDocumentUrl, setSplitDocumentUrl] = useState(null);
  const [splitDocumentName, setSplitDocumentName] = useState('');

  const showToast = (message, type = 'success') => setToast({ isOpen: true, message, type });

  const groupedDocuments = useMemo(
    () =>
      documentsList.reduce((acc, doc) => {
        const cat = doc.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(doc);
        return acc;
      }, {}),
    [documentsList]
  );

  const currentCategoryDocTypes = currentCategory
    ? (groupedDocuments[currentCategory] || []).reduce((acc, doc) => {
      const t = doc.documentType || 'Unknown';
      if (!acc[t]) acc[t] = [];
      acc[t].push(doc);
      return acc;
    }, {})
    : {};

  const currentDocTypeDocs =
    currentCategory && currentDocType
      ? sortByUploadDate(
        (groupedDocuments[currentCategory] || []).filter(
          (d) => (d.documentType || 'Unknown') === currentDocType.name
        )
      )
      : [];

  const currentDocTypeIsSplitOrMerged =
    !!currentDocType && (currentDocType.name.includes('(Split)') || currentDocType.name.includes('(Merged)'));

  const filesToDisplay = currentDocType
    ? currentDocTypeIsSplitOrMerged
      ? currentDocTypeDocs
      : currentDocType.isLatest
        ? currentDocTypeDocs.slice(0, 1)
        : currentDocTypeDocs.slice(1)
    : [];

  const sortedAllDocuments = sortByUploadDate(documentsList);

  useEffect(() => {
    if (!sourceData) {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
      return () => {
        setHeaderTitle(null);
        setHeaderSubtitle(null);
      };
    }
    const title = activeTab === 'add' ? 'Upload Document' : 'View Document';
    const subtitles = {
      equipment: `${sourceData.machine || 'Equipment'}    - ${sourceData.regNo || id}`,
      operator: `${sourceData.name || 'Operator'}     - ${sourceData.qatarId || id}`,
      mechanic: `${sourceData.name || 'Mechanic'}     - ${id}`,
      'staff': `${sourceData.name || 'Office Staff'} - ${sourceData.email || id}`,
    };
    setHeaderTitle(title);
    setHeaderSubtitle(subtitles[sourceType] ?? id);
    return () => {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    };
  }, [sourceData, sourceType, id, activeTab, setHeaderTitle, setHeaderSubtitle]);

  const processFile = useCallback(async (file) => {
    try {
      if (isImageFile(file)) {
        showToast('Converting image to PDF...', 'info');
        const converted = await convertImageToPDF(file);
        setSelectedFile(converted);
        const reader = new FileReader();
        reader.onloadend = () => setPreviewImage(reader.result);
        reader.readAsDataURL(file);
        showToast('Image converted to PDF successfully!', 'success');
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
      showToast(`Error processing file: ${err.message}`, 'error');
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'add') return;
    const onOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };
    const onLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target === document.body || !document.body.contains(e.relatedTarget)) setIsDragging(false);
    };
    const onDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) processFile(f);
    };
    document.addEventListener('dragover', onOver);
    document.addEventListener('dragleave', onLeave);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragover', onOver);
      document.removeEventListener('dragleave', onLeave);
      document.removeEventListener('drop', onDrop);
      setIsDragging(false);
    };
  }, [activeTab, processFile]);

  useEffect(() => {
    if (!type || !id) return;
    const run = async () => {
      try {
        setSourceType(type);
        const data = await fetchSourceEntity({ type, id });
        setSourceData(data);
      } catch (err) {
        console.error('Error fetching source data:', err);
      }
    };
    run();
    fetchDocumentTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, id]);

  useEffect(() => {
    if (activeTab !== 'view' || !type || !id) return;
    setCurrentView('categories');
    setCurrentPath([{ name: 'Documents', view: 'categories' }]);
    setCurrentCategory(null);
    setCurrentDocType(null);
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, type, id]);

  const fetchDocumentTypes = async () => {
    try {
      const types = await fetchDocumentTypesAPI();
      setDocumentTypes(types.length ? [...new Set(types)].sort() : FALLBACK_DOC_TYPES);
    } catch {
      setDocumentTypes(FALLBACK_DOC_TYPES);
    }
  };

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const out = await fetchDocumentsBySource({ sourceType, type, id });
      setDocumentsList(out);
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleCategoryChange = (e) => setFormData((p) => ({ ...p, category: e.target.value }));
  const handleDocTypeChange = (e) => {
    setDocTypeInput(e.target.value);
    setFormData((p) => ({ ...p, documentType: e.target.value }));
  };
  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };
  const handleReset = () => {
    setFormData(EMPTY_FORM);
    setDocTypeInput('');
    setSelectedFile(null);
    setPreviewImage(null);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedFile || !id || !sourceType || !formData.documentType) {
      showToast('Please fill all required fields and select a file', 'error');
      return;
    }
    setIsLoading(true);
    setShowProgressModal(true);
    setUploadProgress(0);
    const iv = setInterval(() => setUploadProgress((p) => (p >= 90 ? p : p + Math.random() * 15)), 150);
    try {
      const { response, result } = await uploadDocument({
        sourceId: id,
        sourceType,
        documentType: formData.documentType,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        description: formData.description,
        category: formData.category,
        date: formData.date,
        expiry: formData.expiry,
      });
      if (!response.ok) throw new Error(result.message || 'Upload failed');
      const s3 = await fetch(result.uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: { 'Content-Type': selectedFile.type },
      });
      if (!s3.ok) throw new Error(`S3 upload failed: ${s3.status}`);
      clearInterval(iv);
      setUploadProgress(100);
      showToast('Document uploaded successfully!', 'success');
      if (!documentTypes.includes(formData.documentType)) setDocumentTypes((p) => [...p, formData.documentType].sort());
      setTimeout(() => {
        setShowProgressModal(false);
        setUploadProgress(0);
        handleReset();
      }, 2000);
    } catch (err) {
      clearInterval(iv);
      showToast(`Error: ${err.message}`, 'error');
      setTimeout(() => {
        setShowProgressModal(false);
        setUploadProgress(0);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = async (documentId, fileName) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    try {
      showToast('Opening document...', 'info');
      if (isIOS) {
        window.location.href = `/documents/view/${documentId}`;
        showToast("Document opened. Use Safari's share button to save if needed.", 'success');
        return;
      }
      const data = await getDocumentViewData(documentId);
      const url = await getSignedUrl(data.document.filePath);
      const mime = data.document.mimetype.toLowerCase();
      if (isAndroid) {
        if (mime.includes('pdf')) {
          if (!window.open(url, '_blank')) window.location.href = url;
        } else if (mime.includes('image')) {
          const win = window.open();
          if (win)
            win.document.write(
              `<html><head><title>${fileName}</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh}img{max-width:100%;max-height:100vh;object-fit:contain}</style></head><body><img src="${url}" alt="${fileName}"></body></html>`
            );
          else window.location.href = url;
        } else {
          window.location.href = url;
        }
      } else {
        if (!window.open(url, '_blank')) {
          showToast('Popup blocked. Please allow popups and try again.', 'error');
          return;
        }
      }
      showToast('Document opened successfully.', 'success');
    } catch (err) {
      showToast(`Error viewing: ${err.message}`, 'error');
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      showToast('Preparing download...', 'info');
      const data = await getDocumentDownloadData(documentId);
      const url = await getSignedUrl(data.document.filePath);
      const fr = await fetch(url);
      if (!fr.ok) throw new Error(`Failed to fetch file: ${fr.status}`);
      const blobUrl = URL.createObjectURL(await fr.blob());
      const link = Object.assign(document.createElement('a'), { href: blobUrl, download: fileName, style: 'display:none' });
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      showToast('Download completed!', 'success');
    } catch (err) {
      showToast(`Error downloading: ${err.message}`, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteDocumentId) return;
    try {
      showToast('Deleting document...', 'info');
      setShowDeleteModal(false);
      const { response, result } = await deleteDocument(deleteDocumentId);
      if (!response.ok) throw new Error(result.message || 'Delete failed');
      showToast('Document deleted successfully!', 'success');
      setDeleteDocumentId(null);
      setDeleteDocumentName('');
      fetchDocuments();
    } catch (err) {
      showToast(`Error deleting: ${err.message}`, 'error');
    }
  };

  const handleSaveRename = async (docId) => {
    if (!newFileName.trim()) {
      showToast('File name cannot be empty', 'error');
      return;
    }
    try {
      const { response, result } = await renameDocument(docId, newFileName);
      if (!response.ok) throw new Error(result.message || 'Rename failed');
      showToast('File renamed successfully!', 'success');
      setRenamingDocId(null);
      setNewFileName('');
      fetchDocuments();
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleSplitPDF = async (documentId, fileName, filePath) => {
    try {
      const dataUrl = await getSignedUrl(filePath);
      setSplitDocument(documentId);
      setSplitDocumentUrl(dataUrl);
      setSplitDocumentName(fileName);
      setShowSplitModal(true);
    } catch {
      showToast('Failed to load PDF preview', 'error');
    }
  };

  const handleMergePages = async (documentId, pageNumbers) => {
    try {
      const { response, result } = await splitPdfDocument({ sourceId: id, sourceType, documentId, pageNumbers, currentCategory });
      if (!response.ok) throw new Error(result.message || 'Merge failed');
      showToast(`Merged ${pageNumbers.length} pages successfully!`, 'success');
      setShowSplitModal(false);
      fetchDocuments();
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleSplitAllPages = async (documentId, totalPages) => {
    try {
      const { response, result } = await splitAllPdfPages({ sourceId: id, sourceType, documentId, currentCategory });
      if (!response.ok) throw new Error(result.message || 'Split failed');
      showToast(`Split all ${totalPages} pages successfully!`, 'success');
      setShowSplitModal(false);
      fetchDocuments();
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleMergePDFs = async () => {
    if (selectedDocuments.length < 2) {
      showToast('Please select at least 2 PDFs to merge', 'error');
      return;
    }
    try {
      const { response, result } = await mergePdfDocuments({ sourceId: id, sourceType, documentIds: selectedDocuments, currentCategory });
      if (!response.ok) throw new Error(result.message || 'Merge failed');
      showToast('PDFs merged successfully!', 'success');
      setTimeout(() => {
        setSelectionMode(false);
        setSelectedDocuments([]);
        fetchDocuments();
      }, 2000);
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const navigateToCategoriesRoot = () => {
    setCurrentView('categories');
    setCurrentPath([{ name: 'Documents', view: 'categories' }]);
    setCurrentCategory(null);
    setCurrentDocType(null);
  };

  const navigateToAllDocuments = () => {
    setCurrentCategory('all');
    setCurrentView('allDocsFiles');
    setCurrentPath([
      { name: 'Documents', view: 'categories' },
      { name: 'All Documents', view: 'allDocsFiles', category: 'all' },
    ]);
  };

  const navigateToCategory = (category) => {
    setCurrentCategory(category);
    setCurrentView('docTypes');
    setCurrentPath([
      { name: 'Documents', view: 'categories' },
      { name: getCategoryLabel(category), view: 'docTypes', category },
    ]);
  };

  const navigateToDocType = (docType) => {
    const isSM = docType.includes('(Split)') || docType.includes('(Merged)');
    const view = isSM ? 'files' : 'subfolders';
    setCurrentDocType({ name: docType });
    setCurrentView(view);
    setCurrentPath([
      { name: 'Documents', view: 'categories' },
      { name: getCategoryLabel(currentCategory), view: 'docTypes', category: currentCategory },
      { name: docType, view, category: currentCategory, docType },
    ]);
  };

  const navigateToSubfolder = (docType, isLatest) => {
    setCurrentDocType({ name: docType, isLatest });
    setCurrentView('files');
    setCurrentPath([
      { name: 'Documents', view: 'categories' },
      { name: getCategoryLabel(currentCategory), view: 'docTypes', category: currentCategory },
      { name: docType, view: 'subfolders', category: currentCategory, docType },
      { name: isLatest ? 'Latest' : 'Old', view: 'files', category: currentCategory, docType, isLatest },
    ]);
  };

  const navigateToPath = (i) => {
    const t = currentPath[i];
    setCurrentPath((p) => p.slice(0, i + 1));
    (
      {
        categories: () => {
          setCurrentView('categories');
          setCurrentCategory(null);
          setCurrentDocType(null);
        },
        docTypes: () => {
          setCurrentView('docTypes');
          setCurrentCategory(t.category);
          setCurrentDocType(null);
        },
        subfolders: () => {
          setCurrentView('subfolders');
          setCurrentCategory(t.category);
          setCurrentDocType({ name: t.docType });
        },
        files: () => {
          setCurrentView('files');
          setCurrentCategory(t.category);
          setCurrentDocType({ name: t.docType, isLatest: t.isLatest });
        },
      }[t.view]?.()
    );
  };

  const goBack = () => {
    if (currentPath.length > 1) navigateToPath(currentPath.length - 2);
  };

  const handleAddTabClick = () => setActiveTab('add');
  const handleViewTabClick = () => setActiveTab('view');
  const handleCloseToast = () => setToast((p) => ({ ...p, isOpen: false }));
  const handleBrowseFilesClick = () => document.getElementById('document-file').click();

  const handleZoneDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleZoneDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleZoneDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleZoneDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode((p) => !p);
    setSelectedDocuments([]);
  };

  const handleToggleSelectDocument = (docId) => {
    if (!selectionMode) return;
    setSelectedDocuments((p) => (p.includes(docId) ? p.filter((d) => d !== docId) : [...p, docId]));
  };

  const handleCheckboxNoop = () => { };

  const handleRenameClick = (doc) => {
    setRenamingDocId(doc._id);
    setNewFileName((doc.displayFileName || doc.fileName).replace(/\.[^/.]+$/, ''));
  };

  const handleDeleteClick = (doc) => {
    setDeleteDocumentId(doc._id);
    setDeleteDocumentName(doc.displayFileName || doc.fileName);
    setShowDeleteModal(true);
  };

  const handleConfirmRename = () => handleSaveRename(renamingDocId);
  const handleCancelRename = () => {
    setRenamingDocId(null);
    setNewFileName('');
  };
  const handleRenameFormChange = (_, value) => setNewFileName(value);

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteDocumentId(null);
    setDeleteDocumentName('');
  };

  const handleCloseSplitModal = () => setShowSplitModal(false);

  return {
    activeTab,
    sourceType,
    sourceData,
    formData,
    docTypeInput,
    documentTypes,
    selectedFile,
    previewImage,
    isDragging,
    isLoading,
    toast,
    uploadProgress,
    showProgressModal,
    documentsList,
    currentView,
    currentPath,
    currentCategory,
    currentDocType,
    selectionMode,
    selectedDocuments,
    showDeleteModal,
    deleteDocumentId,
    deleteDocumentName,
    renamingDocId,
    newFileName,
    showSplitModal,
    splitDocument,
    splitDocumentUrl,
    splitDocumentName,
    groupedDocuments,
    currentCategoryDocTypes,
    currentDocTypeDocs,
    filesToDisplay,
    sortedAllDocuments,
    handleInputChange,
    handleCategoryChange,
    handleDocTypeChange,
    handleFileChange,
    handleReset,
    handleSubmit,
    handleView,
    handleDownload,
    handleDelete,
    handleSaveRename,
    handleSplitPDF,
    handleMergePages,
    handleSplitAllPages,
    handleMergePDFs,
    navigateToCategoriesRoot,
    navigateToAllDocuments,
    navigateToCategory,
    navigateToDocType,
    navigateToSubfolder,
    navigateToPath,
    goBack,
    handleAddTabClick,
    handleViewTabClick,
    handleCloseToast,
    handleBrowseFilesClick,
    handleZoneDragEnter,
    handleZoneDragOver,
    handleZoneDragLeave,
    handleZoneDrop,
    handleToggleSelectionMode,
    handleToggleSelectDocument,
    handleCheckboxNoop,
    handleRenameClick,
    handleDeleteClick,
    handleConfirmRename,
    handleCancelRename,
    handleRenameFormChange,
    handleCancelDelete,
    handleCloseSplitModal,
  };
};

export default useDocument;