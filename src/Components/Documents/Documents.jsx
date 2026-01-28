import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './Documents.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';
import jsPDF from 'jspdf';
import DevModal from '../../common/DevModal';
import { useHeaderTitle } from '../../context/HeaderTitleContext';
import Button from '../../common/Button/Button';
import Input from '../../common/Input/Input';
import PDFPreviewModal from '../../common/PDFPreviewModal/PDFPreviewModal';

function DocumentDetails() {
  const { type, id } = useParams();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDocumentId, setDeleteDocumentId] = useState(null);
  const [deleteDocumentName, setDeleteDocumentName] = useState('');
  const [renamingDocId, setRenamingDocId] = useState(null);
  const [newFileName, setNewFileName] = useState('');
  const [sourceType, setSourceType] = useState(''); // 'equipment', 'operator', 'mechanic', 'office-staff'
  const [sourceData, setSourceData] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitDocument, setSplitDocument] = useState(null);
  const [mergeProgress, setMergeProgress] = useState(0);
  const [splitProgress, setSplitProgress] = useState(0);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('add');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [documentsList, setDocumentsList] = useState([]);
  const [equipmentData, setEquipmentData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);
  const [currentView, setCurrentView] = useState('categories'); // 'categories', 'docTypes', 'files'
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentDocType, setCurrentDocType] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedDocTypes, setExpandedDocTypes] = useState({});
  const [documentTypes, setDocumentTypes] = useState([]);
  const [filteredDocTypes, setFilteredDocTypes] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [docTypeInput, setDocTypeInput] = useState('');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [splitDocumentUrl, setSplitDocumentUrl] = useState(null);
  const [splitDocumentName, setSplitDocumentName] = useState('');
  const [uploadStatus, setUploadStatus] = useState(''); // 'uploading', 'success', 'error'
  const [uploadError, setUploadError] = useState('');
  const [formData, setFormData] = useState({
    documentType: '',
    description: '',
    uploadDate: new Date().toISOString().split('T')[0],
    category: 'certificate', // certificate, inspection, specification, handover
    expiry: new Date().toISOString().split('T')[0],
    date: new Date().toISOString().split('T')[0]
  });

  // Set header title when component mounts or data changes
  useEffect(() => {
    if (equipmentData) {
      const title = activeTab === 'add' ? 'Upload Document' : 'View Document'
      const subtitle = `${equipmentData.machine}`
      setHeaderTitle(title);
      setHeaderSubtitle(subtitle);
    } else {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    }

    // Cleanup - reset when component unmounts
    return () => {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    };
  }, [equipmentData, activeTab]);

  useEffect(() => {
    // Add drag handlers to the entire document when on 'add' tab
    if (activeTab === 'add') {
      const handleDocumentDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      };

      const handleDocumentDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set to false if we're leaving the document entirely
        if (e.target === document.body || !document.body.contains(e.relatedTarget)) {
          setIsDragging(false);
        }
      };

      const handleDocumentDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          const file = files[0];

          try {
            if (isImageFile(file)) {
              setMessage({ text: 'Converting image to PDF...', type: 'info' });
              const convertedFile = await convertImageToPDF(file);
              setSelectedFile(convertedFile);

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
          } catch (error) {
            console.error('Error processing dropped file:', error);
            setMessage({ text: `Error processing file: ${error.message}`, type: 'error' });
          }
        }
      };

      document.addEventListener('dragover', handleDocumentDragOver);
      document.addEventListener('dragleave', handleDocumentDragLeave);
      document.addEventListener('drop', handleDocumentDrop);

      return () => {
        document.removeEventListener('dragover', handleDocumentDragOver);
        document.removeEventListener('dragleave', handleDocumentDragLeave);
        document.removeEventListener('drop', handleDocumentDrop);
        setIsDragging(false);
      };
    }
  }, [activeTab]);

  // Static fallback document types (in case API fails)
  const fallbackDocumentTypes = [
    'Hand Over',
    'Hook Rope Certificate',
    'Rope Inspection Certificate',
    'Crane Oil Specification',
    'Maintenance Certificate',
    'Safety Inspection',
    'Calibration Certificate',
    'Operating Manual',
    'Warranty Document',
    'Installation Certificate'
  ];

  const categories = [
    { value: 'certificate', label: 'Certificates' },
    { value: 'inspection', label: 'Inspections' },
    { value: 'specification', label: 'Specifications' },
    { value: 'handover', label: 'Handover Documents' },
    { value: 'manual', label: 'Manuals' },
    { value: 'warranty', label: 'Warranty' }
  ];

  const handleStartRename = (docId, currentFileName) => {
    setRenamingDocId(docId);
    // Remove extension for editing
    const nameWithoutExt = currentFileName.replace(/\.[^/.]+$/, '');
    setNewFileName(nameWithoutExt);
  };

  const handleCancelRename = () => {
    setRenamingDocId(null);
    setNewFileName('');
  };

  const handleSaveRename = async (docId) => {
    if (!newFileName.trim()) {
      setMessage({ text: 'File name cannot be empty', type: 'error' });
      return;
    }

    try {
      const response = await apiRequest(
        `${END_POINT}/documents/rename-file/${docId}`,
        'PUT',
        { newFileName: newFileName.trim() }
      );

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Rename failed');

      setMessage({ text: 'File renamed successfully!', type: 'success' });
      setRenamingDocId(null);
      setNewFileName('');
      fetchDocuments(); // Refresh the list
    } catch (error) {
      console.error('Error renaming file:', error);
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    }
  };

  const navigateToAllDocuments = () => {
    setCurrentCategory('all');
    setCurrentView('allDocsFiles'); // Changed from 'allDocsSubfolders' to 'allDocsFiles'
    setCurrentPath([
      { name: 'Documents', view: 'categories' },
      { name: 'All Documents', view: 'allDocsFiles', category: 'all' } // Changed view
    ]);
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedDocuments([]);
  };

  // Toggle document selection
  const toggleDocumentSelection = (docId) => {
    setSelectedDocuments(prev => {
      if (prev.includes(docId)) {
        return prev.filter(id => id !== docId);
      } else {
        return [...prev, docId];
      }
    });
  };

  // Merge selected PDFs
  const handleMergePDFs = async () => {
    if (selectedDocuments.length < 2) {
      setMessage({ text: 'Please select at least 2 PDFs to merge', type: 'error' });
      return;
    }

    setShowMergeModal(true);
    setMergeProgress(0);

    try {
      const response = await apiRequest(`${END_POINT}/documents/merge-pdfs`, 'POST', {
        sourceId: id,
        sourceType: sourceType,
        documentIds: selectedDocuments,
        category: currentCategory === 'all' ? 'merged' : currentCategory,
        documentType: 'Merged Document'
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Merge failed');

      setMergeProgress(100);
      setMessage({ text: 'PDFs merged successfully!', type: 'success' });

      setTimeout(() => {
        setShowMergeModal(false);
        setSelectionMode(false);
        setSelectedDocuments([]);
        fetchDocuments();
      }, 2000);

    } catch (error) {
      console.error("Error merging PDFs:", error);
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
      setShowMergeModal(false);
    }
  };

  // Split PDF
  const handleSplitPDF = async (documentId, fileName, filePath) => {
    try {
      // Get S3 URL for the PDF
      const body = { key: filePath, isLong: false };
      const s3response = await apiRequest(`${END_POINT}/s3Config/get-pre-signed-url`, 'POST', body);
      const s3URL = await s3response.json();

      setSplitDocument(documentId);
      setSplitDocumentUrl(s3URL.dataUrl);
      setSplitDocumentName(fileName);
      setShowSplitModal(true);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setMessage({ text: 'Failed to load PDF preview', type: 'error' });
    }
  };

  // Merge selected pages from same PDF
  const handleMergePages = async (documentId, pageNumbers) => {
    try {
      const response = await apiRequest(`${END_POINT}/documents/split-pdf`, 'POST', {
        sourceId: id,
        sourceType: sourceType,
        documentId: documentId,
        splitOptions: {
          pages: pageNumbers,
          splitType: 'specific'
        },
        category: currentCategory === 'all' ? 'merged' : currentCategory
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Merge failed');

      setMessage({ text: `Merged ${pageNumbers.length} pages successfully!`, type: 'success' });
      setShowSplitModal(false);
      fetchDocuments();
    } catch (error) {
      console.error('Error merging pages:', error);
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    }
  };

  // Split all pages individually
  const handleSplitAllPages = async (documentId, totalPages) => {
    try {
      const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

      const response = await apiRequest(`${END_POINT}/documents/split-pdf`, 'POST', {
        sourceId: id,
        sourceType: sourceType,
        documentId: documentId,
        splitOptions: {
          pages: [1], // Use "every 1 page" to split all
          splitType: 'every'
        },
        category: currentCategory === 'all' ? 'split' : currentCategory
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Split failed');

      setMessage({ text: `Split all ${totalPages} pages successfully!`, type: 'success' });
      setShowSplitModal(false);
      fetchDocuments();
    } catch (error) {
      console.error('Error splitting pages:', error);
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    }
  };

  // Confirm split operation
  const confirmSplitPDF = async (splitOptions) => {
    try {
      const response = await apiRequest(`${END_POINT}/documents/split-pdf`, 'POST', {
        sourceId: id,
        sourceType: sourceType,
        documentId: splitDocument,
        splitOptions: {
          pages: splitOptions.pages, // Array of page numbers or ranges
          splitType: splitOptions.splitType // 'specific', 'range', or 'every'
        },
        category: currentCategory === 'all' ? 'split' : currentCategory
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Split failed');

      setMessage({ text: 'PDF split successfully!', type: 'success' });
      setShowSplitModal(false);
      fetchDocuments();

    } catch (error) {
      console.error("Error splitting PDF:", error);
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];

      try {
        if (isImageFile(file)) {
          setMessage({ text: 'Converting image to PDF...', type: 'info' });
          const convertedFile = await convertImageToPDF(file);
          setSelectedFile(convertedFile);

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
      } catch (error) {
        console.error('Error processing dropped file:', error);
        setMessage({ text: `Error processing file: ${error.message}`, type: 'error' });
      }
    }
  };

  const navigateToCategory = (category) => {
    setCurrentCategory(category);
    setCurrentView('docTypes');
    setCurrentPath([
      { name: 'Documents', view: 'categories' },
      { name: categories.find(cat => cat.value === category)?.label || category, view: 'docTypes', category }
    ]);
  };

  const navigateToDocType = (docType) => {
    setCurrentDocType({ name: docType });
    setCurrentView('subfolders');
    const categoryLabel = categories.find(cat => cat.value === currentCategory)?.label || currentCategory;

    setCurrentPath([
      { name: 'Documents', view: 'categories' },
      { name: categoryLabel, view: 'docTypes', category: currentCategory },
      { name: docType, view: 'subfolders', category: currentCategory, docType: docType }
    ]);
  };

  const navigateToSubfolder = (docType, isLatest) => {
    setCurrentDocType({ name: docType, isLatest });
    setCurrentView('files');
    const categoryLabel = categories.find(cat => cat.value === currentCategory)?.label || currentCategory;
    const subfolderName = isLatest ? 'Latest' : 'Old';

    setCurrentPath([
      { name: 'Documents', view: 'categories' },
      { name: categoryLabel, view: 'docTypes', category: currentCategory },
      { name: docType, view: 'subfolders', category: currentCategory, docType: docType },
      { name: subfolderName, view: 'files', category: currentCategory, docType: docType, isLatest }
    ]);
  };

  const navigateToPath = (pathIndex) => {
    const targetPath = currentPath[pathIndex];
    setCurrentPath(currentPath.slice(0, pathIndex + 1));

    if (targetPath.view === 'categories') {
      setCurrentView('categories');
      setCurrentCategory(null);
      setCurrentDocType(null);
    } else if (targetPath.view === 'docTypes') {
      setCurrentView('docTypes');
      setCurrentCategory(targetPath.category);
      setCurrentDocType(null);
    } else if (targetPath.view === 'subfolders') {
      setCurrentView('subfolders');
      setCurrentCategory(targetPath.category);
      setCurrentDocType({ name: targetPath.docType });
    } else if (targetPath.view === 'files') {
      setCurrentView('files');
      setCurrentCategory(targetPath.category);
      setCurrentDocType({ name: targetPath.docType, isLatest: targetPath.isLatest });
    }
  };

  const goBack = () => {
    if (currentPath.length > 1) {
      navigateToPath(currentPath.length - 2);
    }
  };

  // Get file icon function
  const getFileIcon = (filename, mimetype) => {
    const ext = filename.split('.').pop().toLowerCase();
    const mime = mimetype?.toLowerCase() || '';

    if (ext === 'pdf' || mime.includes('pdf')) return 'picture_as_pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext) || mime.includes('image')) return 'image';
    if (['doc', 'docx'].includes(ext) || mime.includes('word')) return 'docs';
    if (['xls', 'xlsx'].includes(ext) || mime.includes('spreadsheet')) return 'table';
    if (['ppt', 'pptx'].includes(ext) || mime.includes('presentation')) return 'monitor';
    if (['zip', 'rar', '7z'].includes(ext)) return '🗜️';
    if (['txt'].includes(ext) || mime.includes('text')) return 'text_format';
    return '📎';
  };

  // Reset navigation when switching to view tab
  useEffect(() => {
    if (activeTab === 'view') {
      setCurrentView('categories');
      setCurrentPath([{ name: 'Documents', view: 'categories' }]);
      setCurrentCategory(null);
      setCurrentDocType(null);
      setSelectedItems([]);
      if (type && id) {
        fetchDocuments();
      }
    }
  }, [activeTab, type, id]);

  // Function to toggle old documents visibility
  const toggleOldDocuments = (categoryDocTypeKey) => {
    setExpandedDocTypes(prev => ({
      ...prev,
      [categoryDocTypeKey]: !prev[categoryDocTypeKey]
    }));
  };

  const isImageFile = (file) => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    return imageTypes.includes(file.type.toLowerCase()) ||
      /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name);
  };

  const convertImageToPDF = async (imageFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const img = new Image();
          img.onload = () => {
            // Create new PDF document
            const pdf = new jsPDF();

            // Get PDF page dimensions
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Calculate image dimensions to fit PDF page
            const imgWidth = img.width;
            const imgHeight = img.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

            const finalWidth = imgWidth * ratio;
            const finalHeight = imgHeight * ratio;

            // Center the image
            const x = (pdfWidth - finalWidth) / 2;
            const y = (pdfHeight - finalHeight) / 2;

            // Add image to PDF
            pdf.addImage(event.target.result, 'JPEG', x, y, finalWidth, finalHeight);

            // Convert PDF to blob
            const pdfBlob = pdf.output('blob');

            // Create file with PDF extension
            const fileName = imageFile.name.replace(/\.[^/.]+$/, '.pdf');
            const pdfFile = new File([pdfBlob], fileName, {
              type: 'application/pdf',
              lastModified: Date.now()
            });

            resolve(pdfFile);
          };

          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = event.target.result;
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(imageFile);
    });
  };

  // Fetch all document types from API
  const fetchDocumentTypes = async () => {
    try {
      const response = await apiRequest(`${END_POINT}/documents/get-all-documents-types`);

      if (!response.ok) {
        throw new Error('Failed to fetch document types');
      }

      const data = await response.json();

      // Extract unique document types from the response
      const uniqueDocTypes = new Set();

      if (data.documents && data.documents.length > 0) {
        data.documents.forEach(doc => {
          if (doc.documentType && doc.documentType.trim()) {
            uniqueDocTypes.add(doc.documentType.trim());
          }
        });
      }

      // Convert Set to Array and sort alphabetically
      const docTypesArray = Array.from(uniqueDocTypes).sort();

      // If no document types found, use fallback
      if (docTypesArray.length === 0) {
        setDocumentTypes(fallbackDocumentTypes);
        setFilteredDocTypes(fallbackDocumentTypes);
      } else {
        setDocumentTypes(docTypesArray);
        setFilteredDocTypes(docTypesArray);
      }
    } catch (error) {
      console.error("Error fetching document types:", error);
      // Use fallback document types on error
      setDocumentTypes(fallbackDocumentTypes);
      setFilteredDocTypes(fallbackDocumentTypes);
    }
  };

  // Handle document type input change (for search/filter)
  const handleDocTypeInputChange = (e) => {
    const value = e.target.value;
    setDocTypeInput(value);
    setFormData(prev => ({
      ...prev,
      documentType: value
    }));

    // Filter document types based on input
    if (value.trim() === '') {
      setFilteredDocTypes(documentTypes);
    } else {
      const filtered = documentTypes.filter(type =>
        type.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredDocTypes(filtered);
    }

    setShowDropdown(true);
  };

  // Handle document type selection from dropdown
  const handleDocTypeSelect = (selectedType) => {
    setDocTypeInput(selectedType);
    setFormData(prev => ({
      ...prev,
      documentType: selectedType
    }));
    setShowDropdown(false);
  };

  // Handle document type input focus
  const handleDocTypeInputFocus = () => {
    setShowDropdown(true);
    setFilteredDocTypes(documentTypes);
  };

  // Handle document type input blur (with delay to allow selection)
  const handleDocTypeInputBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  // Get current date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const dateString = `${day}-${month}-${year}`;

      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const timeString = `${hours}:${minutes} ${ampm}`;

      setCurrentDateTime(`${dateString}   |   ${timeString}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'view' && type && id) {
      fetchDocuments();
    }
  }, [activeTab, type, id]);

  useEffect(() => {
    if (type && id) {
      fetchSourceData();
    }
    fetchDocumentTypes();
  }, [type, id]);

  useEffect(() => {
    if (sourceData) {
      const title = activeTab === 'add' ? 'Upload Document' : 'View Document';
      let subtitle = '';

      switch (sourceType) {
        case 'equipment':
          subtitle = `${sourceData.machine || 'Equipment'} - ${sourceData.regNo || id}`;
          break;
        case 'operator':
          subtitle = `${sourceData.name || 'Operator'} - ${sourceData.qatarId || id}`;
          break;
        case 'mechanic':
          subtitle = `${sourceData.name || 'Mechanic'} - ${id}`;
          break;
        case 'office-staff':
          subtitle = `${sourceData.name || 'Office Staff'} - ${sourceData.email || id}`;
          break;
        default:
          subtitle = id;
      }

      setHeaderTitle(title);
      setHeaderSubtitle(subtitle);
    } else {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    }

    return () => {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    };
  }, [sourceData, sourceType, id, activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchSourceData = async () => {
    try {
      setSourceType(type);

      let response, data;

      switch (type) {
        case 'equipment':
          // Try fetching from API or use local import
          try {
            response = await apiRequest(`${END_POINT}/equipments/get-equipment/${id}`, 'GET');
            data = await response.json();
            setSourceData(data);
          } catch (err) {
            // Fallback to local import
            import('../../equipments').then(module => {
              const equipment = module.default.find(eq => eq._id === id || eq.regNo === id);
              setSourceData(equipment);
            });
          }
          break;

        case 'operator':
          response = await apiRequest(`${END_POINT}/operators/get-operator/${id}`, 'GET');
          data = await response.json();
          setSourceData(data.data || data);
          break;

        case 'mechanic':
          response = await apiRequest(`${END_POINT}/mechanics/get-mechanic/${id}`, 'GET');
          data = await response.json();
          setSourceData(data.data || data);
          break;

        case 'office-staff':
          response = await apiRequest(`${END_POINT}/users/get-user/${id}`, 'GET');
          data = await response.json();
          setSourceData(data.data || data);
          break;

        default:
          console.error('Invalid source type');
      }
    } catch (error) {
      console.error('Error fetching source data:', error);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      if (isImageFile(file)) {
        setMessage({ text: 'Converting image to PDF...', type: 'info' });

        // Convert image to PDF
        const convertedFile = await convertImageToPDF(file);
        setSelectedFile(convertedFile);

        // Still show preview of original image
        const reader = new FileReader();
        reader.onloadend = () => setPreviewImage(reader.result);
        reader.readAsDataURL(file);

        setMessage({ text: 'Image converted to PDF successfully!', type: 'success' });
      } else {
        // Handle non-image files normally
        setSelectedFile(file);

        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => setPreviewImage(reader.result);
          reader.readAsDataURL(file);
        } else {
          setPreviewImage(null);
        }
      }
    } catch (error) {
      console.error('Error converting image to PDF:', error);
      setMessage({ text: `Error converting image: ${error.message}`, type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile || !id || !sourceType || !formData.documentType) {
      setMessage({ text: 'Please fill all required fields and select a file', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: '' });

    // Show progress modal
    setShowProgressModal(true);
    setUploadProgress(0);
    setUploadStatus('uploading');
    setUploadError('');

    // Animate progress from 0 to 90% while uploading
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 150);

    try {
      // Step 1: Get presigned URL from backend
      const response = await apiRequest(
        `${END_POINT}/documents/upload-document`,
        'POST',
        {
          sourceId: id,
          sourceType: sourceType,
          documentType: formData.documentType,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          description: formData.description,
          category: formData.category,
          date: formData.date,
          expiry: formData.expiry,
        }
      );

      const result = await response.json();
      console.log('Backend response:', result);

      if (result.status !== 200) {
        throw new Error(result.message || 'Upload failed');
      }

      // Step 2: Upload actual file to S3 using presigned URL
      const s3UploadResponse = await fetch(result.uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type
        }
      });

      if (!s3UploadResponse.ok) {
        console.log('S3 upload failed:', await s3UploadResponse.json());

        throw new Error(`S3 upload failed: ${s3UploadResponse.status}`);
      }

      clearInterval(progressInterval);

      // Complete progress and show success
      setUploadProgress(100);
      setUploadStatus('success');
      setMessage({ text: 'Document uploaded successfully!', type: 'success' });

      // If it's a new document type, add it to the list
      if (!documentTypes.includes(formData.documentType)) {
        const updatedTypes = [...documentTypes, formData.documentType].sort();
        setDocumentTypes(updatedTypes);
        setFilteredDocTypes(updatedTypes);
      }

      // Auto-close modal after 2 seconds on success
      setTimeout(() => {
        setShowProgressModal(false);
        setUploadProgress(0);
        setUploadStatus('');
        setUploadError('');
        handleReset();
        setMessage({ text: '', type: '' });
      }, 2000);

    } catch (error) {
      console.error("Error uploading document:", error);
      clearInterval(progressInterval);
      setUploadStatus('error');
      setUploadError(error.message);
      setMessage({ text: `Error: ${error.message}`, type: 'error' });

      // Auto-close error modal after 3 seconds
      setTimeout(() => {
        setShowProgressModal(false);
        setUploadProgress(0);
        setUploadStatus('');
        setUploadError('');
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all documents
  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest(`${END_POINT}/documents/get-documents/${sourceType}/${id}`, 'GET');

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      console.log(data);

      const processedDocuments = [];

      if (data.documents && data.documents.length > 0) {
        data.documents.forEach(doc => {
          if (doc.files && doc.files.length > 0) {
            doc.files.forEach(file => {
              processedDocuments.push({
                _id: file._id,
                sourceId: doc.SourceId,
                sourceType: doc.documentSource[0]?.source,
                documentType: doc.documentType,
                fileName: file.filename,
                displayFileName: file.displayFileName,
                filePath: file.path,
                mimetype: file.mimetype,
                date: file.date,
                expiry: file.expiry,
                uploadDate: file.uploadedAt || file.createdAt,
                createdAt: file.createdAt,
                updatedAt: file.updatedAt,
                description: doc.description || '',
                category: doc.category || 'other'
              });
            });
          }
        });
      }

      setDocumentsList(processedDocuments);

    } catch (error) {
      console.error("Error fetching documents:", error);
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // iOS-compatible download handler
  const handleDownload = async (documentId, fileName) => {
    try {
      setMessage({ text: 'Preparing download...', type: 'info' });

      const response = await apiRequest(`${END_POINT}/documents/download/${documentId}`);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      const body = { key: data.document.filePath, isLong: false };
      const s3response = await apiRequest(`${END_POINT}/s3Config/get-pre-signed-url`, 'POST', body);

      if (!s3response.ok) {
        throw new Error(`S3 URL generation failed: ${s3response.status}`);
      }

      const s3URL = await s3response.json();
      const fullUrl = s3URL.dataUrl;

      // Force download by fetching the file and creating a blob
      setMessage({ text: 'Downloading file...', type: 'info' });

      const fileResponse = await apiRequest(fullUrl);

      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.status}`);
      }

      // Get the file as blob
      const blob = await fileResponse.blob();

      // Create download link with blob URL
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = downloadUrl;
      link.download = fileName;
      link.style.display = 'none';

      // Add to DOM, click, then remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      URL.revokeObjectURL(downloadUrl);

      setMessage({ text: 'Download completed!', type: 'success' });

    } catch (error) {
      console.error("Error downloading document:", error);
      setMessage({ text: `Error downloading: ${error.message}`, type: 'error' });
    }
  };

  // Show delete confirmation modal
  const showDeleteConfirmation = (documentId, fileName) => {
    setDeleteDocumentId(documentId);
    setDeleteDocumentName(fileName);
    setShowDeleteModal(true);
  };

  // Delete document handler
  const handleDelete = async () => {
    if (!deleteDocumentId) return;

    try {
      setMessage({ text: 'Deleting document...', type: 'info' });
      setShowDeleteModal(false);

      const response = await apiRequest(
        `${END_POINT}/documents/delete/${deleteDocumentId}`,
        'DELETE'
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Delete failed');
      }

      const result = await response.json();

      setMessage({ text: 'Document deleted successfully!', type: 'success' });

      // Reset delete states
      setDeleteDocumentId(null);
      setDeleteDocumentName('');

      // Refresh the documents list
      fetchDocuments();

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);

    } catch (error) {
      console.error("Error deleting document:", error);
      setMessage({ text: `Error deleting: ${error.message}`, type: 'error' });
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteDocumentId(null);
    setDeleteDocumentName('');
  };

  const handleView = async (documentId, fileName) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    try {
      setMessage({ text: 'Opening document...', type: 'info' });

      if (isIOS) {
        // For iOS, use direct URL approach instead of fetch + blob
        const directUrl = `${END_POINT}/documents/view/${documentId}`;

        // Try opening in same window first (most reliable on iOS)
        try {
          window.location.href = directUrl;
          setMessage({
            text: 'Document opened. Use Safari\'s share button to save if needed.',
            type: 'success'
          });
        } catch (iosError) {
          console.error('iOS direct navigation failed:', iosError);
          setMessage({
            text: 'Unable to open document on iOS. Please contact support.',
            type: 'error'
          });
        }
        return;
      }

      // For non-iOS devices, use the blob approach
      const response = await apiRequest(`${END_POINT}/documents/view/${documentId}`);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log(data.document.filePath);

      const body = { key: data.document.filePath, isLong: false };
      const s3response = await apiRequest(`${END_POINT}/s3Config/get-pre-signed-url`, 'POST', body);
      const s3URL = await s3response.json();
      const fullUrl = s3URL.dataUrl;


      const url = fullUrl;
      const fileType = data.document.mimetype.toLowerCase();

      if (isAndroid) {
        // Android handling
        if (fileType.includes('pdf')) {
          // Android can handle PDFs better in new tabs
          const newWindow = window.open(url, '_blank');
          if (!newWindow) {
            window.location.href = url;
          }
        } else if (fileType.includes('image')) {
          // For images on Android
          const newWindow = window.open();
          if (newWindow) {
            newWindow.document.write(`
              <html>
                <head>
                  <title>${fileName}</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { margin: 0; padding: 10px; background: #000; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                    img { max-width: 100%; max-height: 100vh; object-fit: contain; }
                  </style>
                </head>
                <body>
                  <img src="${url}" alt="${fileName}" />
                </body>
              </html>
            `);
          } else {
            window.location.href = url;
          }
        } else {
          // Other file types on Android
          window.location.href = url;
        }

        setMessage({ text: 'Document opened successfully.', type: 'success' });

      } else {
        // Desktop view - open in new tab
        const newWindow = window.open(url, '_blank');
        if (!newWindow) {
          setMessage({ text: 'Popup blocked. Please allow popups and try again.', type: 'error' });
        } else {
          setMessage({ text: 'Document opened in new tab.', type: 'success' });
        }
      }

      // Clear message after a delay
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);

    } catch (error) {
      console.error("Error viewing document:", error);
      setMessage({ text: `Error viewing: ${error.message}. Try refreshing the page.`, type: 'error' });
    }
  };

  const handleReset = () => {
    setFormData({
      documentType: '',
      description: '',
      uploadDate: new Date().toISOString().split('T')[0],
      category: 'certificate'
    });
    setDocTypeInput('');
    setSelectedFile(null);
    setPreviewImage(null);
    setMessage({ text: '', type: '' });
    setShowDropdown(false);
  };

  // Group documents by category
  const groupedDocuments = documentsList.reduce((acc, doc) => {
    const category = doc.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(doc);
    return acc;
  }, {});

  return (
    <div className={`doc-details-container ${isDragging ? 'dragging-active' : ''}`}>
      {/* Tab Navigation */}
      <div className="doc-details-tabs">
        <Button
          text="Add Document"
          onClick={() => setActiveTab('add')}
          colorScheme={activeTab === 'add' ? 'amber-300' : 'amber-900'}
          variant="gradient"
          font="md"
          animation=""
          squircle="4xl"
          width="50%"
          height="48px"
          type="submit"
          textColor={activeTab === 'add' ? 'black-300' : 'white-900'}
          shadowPosition="to-bottom"
          shadowColor="white-600"
        />
        <Button
          text="View Documents"
          onClick={() => setActiveTab('view')}
          colorScheme={activeTab === 'view' ? 'amber-400' : 'amber-900'}
          variant="gradient"
          font="md"
          animation=""
          squircle="4xl"
          width="50%"
          height="48px"
          type="submit"
          textColor={activeTab === 'view' ? 'black-300' : 'white-900'}
          shadowPosition="to-bottom"
          shadowColor="white-600"
        />
      </div>

      {message.text && (
        <div className={`doc-details-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Progress Modal */}
      <DevModal
        isOpen={showProgressModal}
        type="progress"
        title="Uploading Document"
        message={selectedFile ? `Uploading: ${selectedFile.name}` : "Uploading to cloud storage..."}
        progress={uploadProgress}
        progressText="Processing..."
      />

      {/* Add Document Tab */}
      {activeTab === 'add' && (
        <div className="doc-details-form-container">
          <form className="doc-details-form-split">
            {/* LEFT SECTION - Input Fields Grid (3 columns) */}
            <div className="doc-details-form-left">
              {/* Category Input */}
              <div className="doc-details-form-group">
                <Input
                  type="select"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, category: e.target.value }));
                  }}
                  placeholder="Select category"
                  required={true}
                  options={categories.map((cat) => ({
                    value: cat.value,
                    label: cat.label
                  }))}
                  colorScheme="yellow-300"
                  textColor="black-100"
                  label='Category'
                  labelBgColor='transparent'
                  labelSize='3xl'
                  labelColor='yellow-300'
                  variant="gradient"
                  width="100%"
                  height="57px"
                  squircle="4xl"
                  fontWeight='500'
                  inputPaddingInline="2xl"
                  inputPaddingBlock="xl"
                />
              </div>

              {/* Document Type Input */}
              <div className="doc-details-form-group">
                <Input
                  type="search-select"
                  id="documentType"
                  name="documentType"
                  value={docTypeInput}
                  onChange={(e) => {
                    handleDocTypeInputChange(e);
                  }}
                  placeholder="Type to search or add new document type"
                  required={true}
                  options={documentTypes.map((type) => ({
                    value: type,
                    label: type
                  }))}
                  colorScheme="yellow-300"
                  textColor="black-100"
                  label='Document Type'
                  labelBgColor='transparent'
                  labelSize='3xl'
                  labelColor='yellow-300'
                  placeholderColor='black-100'
                  variant="gradient"
                  width="100%"
                  height="57px"
                  squircle="4xl"
                  fontWeight='500'
                  inputPaddingInline="2xl"
                  inputPaddingBlock="xl"
                />
              </div>

              {/* Date of Issue */}
              <div className="doc-details-form-group">
                <Input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  placeholder="Select issue date"
                  required={true}
                  colorScheme="yellow-300"
                  textColor="black-100"
                  label='Date of Issue'
                  labelBgColor='transparent'
                  labelSize='3xl'
                  labelColor='yellow-300'
                  variant="gradient"
                  width="100%"
                  height="57px"
                  squircle="4xl"
                  fontWeight='500'
                  inputPaddingInline="2xl"
                  inputPaddingBlock="xl"
                  iconRight="calendar_today"
                />
              </div>

              {/* Date of Expiry */}
              <div className="doc-details-form-group">
                <Input
                  type="date"
                  id="expiry"
                  name="expiry"
                  value={formData.expiry}
                  onChange={handleInputChange}
                  placeholder="Select expiry date"
                  required={true}
                  colorScheme="yellow-300"
                  textColor="black-100"
                  label='Date of Expiry'
                  labelBgColor='transparent'
                  labelSize='3xl'
                  labelColor='yellow-300'
                  variant="gradient"
                  width="100%"
                  height="57px"
                  squircle="4xl"
                  fontWeight='500'
                  inputPaddingInline="2xl"
                  inputPaddingBlock="xl"
                  iconRight="event"
                />
              </div>

              {/* Description Textarea - Spans 2 columns */}
              <div className="doc-details-form-group doc-details-form-group-wide">
                <Input
                  type="textarea"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter document description (optional)"
                  rows={10}
                  colorScheme="yellow-300"
                  textColor="black-100"
                  label='Description'
                  labelBgColor='transparent'
                  labelSize='3xl'
                  labelColor='yellow-300'
                  placeholderColor='black-100'
                  variant="gradient"
                  width="100%"
                  squircle="4xl"
                  fontWeight='500'
                  inputPaddingInline="2xl"
                  inputPaddingBlock="xl"
                />
              </div>
            </div>

            {/* RIGHT SECTION - File Upload (Full Height) */}
            <div className="doc-details-form-right">
              <div className="doc-details-file-upload-section">
                {/* Drag and Drop Zone */}
                <div
                  className={`doc-details-drop-zone ${isDragging ? 'dragging' : ''}`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="doc-details-drop-content">
                    <div className="doc-details-drop-icon">
                      <span className="material-symbols-rounded">files</span>
                    </div>
                    <p className="doc-details-drop-text">
                      Drag and drop your file here
                    </p>
                    <p className="doc-details-drop-or">or</p>

                    {/* Hidden file input */}
                    <input
                      type="file"
                      id="document-file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                      style={{ display: 'none' }}
                      required
                    />

                    {/* Custom Button that triggers file input */}
                    <div onClick={() => document.getElementById('document-file').click()}>
                      <Button
                        text="Browse Files"
                        colorScheme="purple-600"
                        variant="gradient"
                        font="md"
                        animation=""
                        squircle="3xl"
                        width="auto"
                        height="44px"
                        type="button"
                        textColor="white-900"
                        shadowPosition="to-bottom"
                        shadowColor="purple-800"
                      />
                    </div>
                  </div>
                  {previewImage && (
                    <div className="doc-details-preview">
                      <img src={previewImage} alt="Preview" />
                    </div>
                  )}
                </div>

                {selectedFile && (
                  <div className="doc-details-file-info">
                    Selected: {selectedFile.name}
                  </div>
                )}
              </div>
            </div>

            {/* BOTTOM SECTION - Action Buttons (Centered) */}
            <div className="doc-details-form-actions">
              <Button
                text="Reset"
                onClick={handleReset}
                colorScheme="red-800"
                variant="gradient"
                font="md"
                animation=""
                squircle="4xl"
                width="200px"
                height="48px"
                type="button"
                textColor="white-900"
                shadowPosition="to-bottom"
                shadowColor="white-600"
              />
              <Button
                text={isLoading ? 'Uploading...' : 'Upload Document'}
                onClick={handleSubmit}
                colorScheme={isLoading ? 'lime-900' : 'lime-600'}
                variant="gradient"
                font="md"
                animation=""
                squircle="4xl"
                width="200px"
                height="48px"
                type={isLoading ? 'disabled' : 'submit'}
                textColor="white-900"
                shadowPosition="to-bottom"
                shadowColor="white-600"
              />
            </div>
          </form>
        </div>
      )}

      {/* View Documents Tab */}
      {activeTab === 'view' && (
        <div className="doc-details-view-container">
          {isLoading ? (
            <div className="doc-details-loading">Loading documents...</div>
          ) : (
            <div className="doc-details-file-explorer">
              {/* Toolbar with breadcrumb and back button */}
              <div className="doc-details-explorer-toolbar">
                <div className="doc-details-breadcrumb">
                  {currentPath.map((pathItem, index) => (
                    <div key={index} className="doc-details-breadcrumb-item">
                      {index > 0 && <span className="doc-details-breadcrumb-separator">›</span>}
                      {index === currentPath.length - 1 ? (
                        <span className="doc-details-breadcrumb-current">
                          📁 {pathItem.name}
                        </span>
                      ) : (
                        <span
                          className="doc-details-breadcrumb-link"
                          onClick={() => navigateToPath(index)}
                        >
                          📁 {pathItem.name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {currentPath.length > 1 && (
                  <button onClick={goBack} className="doc-details-back-btn">
                    ← Back
                  </button>
                )}
              </div>

              {/* Explorer Content */}
              <div className="doc-details-explorer-content">
                {/* Categories View */}
                {currentView === 'categories' && (
                  <div className="doc-details-grid-container">
                    {/* ALL DOCUMENTS FOLDER - NEW */}
                    {Object.keys(groupedDocuments).length > 0 && (
                      <div
                        className="doc-details-grid-item doc-details-all-docs-item"
                        onClick={() => navigateToAllDocuments()}
                      >
                        <div className="doc-details-folder-icon">📚</div>
                        <div className="doc-details-item-name">All Documents</div>
                        <div className="doc-details-item-info">
                          {documentsList.length} document{documentsList.length !== 1 ? 's' : ''}
                        </div>
                        <div className="doc-details-all-badge">ALL</div>
                      </div>
                    )}

                    {/* EXISTING CATEGORY FOLDERS */}
                    {Object.keys(groupedDocuments).length > 0 ? (
                      Object.entries(groupedDocuments).map(([category, documents]) => {
                        const categoryLabel = categories.find(cat => cat.value === category)?.label || category.toUpperCase();
                        const docCount = documents.length;

                        return (
                          <div
                            key={category}
                            className="doc-details-grid-item"
                            onClick={() => navigateToCategory(category)}
                          >
                            <div className="doc-details-folder-icon">📁</div>
                            <div className="doc-details-item-name">{categoryLabel}</div>
                            <div className="doc-details-item-info">
                              {docCount} document{docCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="doc-details-empty-state">
                        <div className="doc-details-empty-icon">📂</div>
                        <h3>Nothing Found</h3>
                        <p>No files</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Document Types View */}
                {currentView === 'docTypes' && currentCategory && (
                  <div className="doc-details-grid-container">
                    {(() => {
                      const categoryDocuments = groupedDocuments[currentCategory] || [];
                      const groupedByDocType = categoryDocuments.reduce((acc, doc) => {
                        const docType = doc.documentType || 'Unknown';
                        if (!acc[docType]) {
                          acc[docType] = [];
                        }
                        acc[docType].push(doc);
                        return acc;
                      }, {});

                      return Object.keys(groupedByDocType).length > 0 ?
                        Object.entries(groupedByDocType).map(([docType, docs]) => (
                          <div
                            key={docType}
                            className="doc-details-grid-item"
                            onClick={() => navigateToDocType(docType)}
                          >
                            <div className="doc-details-folder-icon">📁</div>
                            <div className="doc-details-item-name">{docType}</div>
                            <div className="doc-details-item-info">
                              {docs.length} document{docs.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        )) : (
                          <div className="doc-details-empty-state">
                            <div className="doc-details-empty-icon">📁</div>
                            <h3>No Document Types</h3>
                            <p>No document types found in this category.</p>
                          </div>
                        );
                    })()}
                  </div>
                )}

                {/* Subfolders View (Latest/Old) */}
                {currentView === 'subfolders' && currentCategory && currentDocType && (
                  <div className="doc-details-grid-container">
                    {(() => {
                      const categoryDocuments = groupedDocuments[currentCategory] || [];
                      const docTypeDocuments = categoryDocuments.filter(doc =>
                        (doc.documentType || 'Unknown') === currentDocType.name
                      );

                      const sortedDocs = docTypeDocuments.sort((a, b) => {
                        const dateA = a?.uploadDate ? new Date(a.uploadDate) : new Date(0);
                        const dateB = b?.uploadDate ? new Date(b.uploadDate) : new Date(0);
                        return dateB - dateA;
                      });

                      const folders = [];

                      // Latest folder (always present if there are documents)
                      if (sortedDocs.length > 0) {
                        folders.push(
                          <div
                            key="latest"
                            className="doc-details-grid-item"
                            onClick={() => navigateToSubfolder(currentDocType.name, true)}
                          >
                            <div className="doc-details-folder-icon">📁</div>
                            <div className="doc-details-item-name">Latest</div>
                            <div className="doc-details-item-info">1 document</div>
                            <div className="doc-details-latest-badge">LATEST</div>
                          </div>
                        );
                      }

                      // Old folder (only if there are older documents)
                      if (sortedDocs.length > 1) {
                        folders.push(
                          <div
                            key="old"
                            className="doc-details-grid-item"
                            onClick={() => navigateToSubfolder(currentDocType.name, false)}
                          >
                            <div className="doc-details-folder-icon">📁</div>
                            <div className="doc-details-item-name">Old</div>
                            <div className="doc-details-item-info">{sortedDocs.length - 1} document{sortedDocs.length - 1 !== 1 ? 's' : ''}</div>
                            <div className="doc-details-old-badge">OLD</div>
                          </div>
                        );
                      }

                      return folders.length > 0 ? folders : (
                        <div className="doc-details-empty-state">
                          <div className="doc-details-empty-icon">📁</div>
                          <h3>No Documents</h3>
                          <p>No documents found for this document type.</p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* All Documents Files View with Selection */}
                {currentView === 'allDocsFiles' && (
                  <>
                    {/* Toolbar with selection controls */}
                    <div className="doc-details-selection-toolbar">
                      <Button
                        text={selectionMode ? 'Cancel Selection' : 'Select Multiple'}
                        onClick={toggleSelectionMode}
                        colorScheme={selectionMode ? 'red-600' : 'blue-600'}
                        variant="gradient"
                        font="sm"
                        squircle="4xl"
                        width="auto"
                        height="40px"
                        type="button"
                        textColor="white-900"
                      />

                      {selectionMode && selectedDocuments.length >= 2 && (
                        <Button
                          text={`Merge ${selectedDocuments.length} PDFs`}
                          onClick={handleMergePDFs}
                          colorScheme="green-600"
                          variant="gradient"
                          font="sm"
                          squircle="4xl"
                          width="auto"
                          height="40px"
                          type="button"
                          textColor="white-900"
                        />
                      )}
                    </div>

                    <div className="doc-details-grid-container">
                      {(() => {
                        // Sort all documents by upload date (newest first)
                        const sortedDocs = [...documentsList].sort((a, b) => {
                          const dateA = a?.uploadDate ? new Date(a.uploadDate) : new Date(0);
                          const dateB = b?.uploadDate ? new Date(b.uploadDate) : new Date(0);
                          return dateB - dateA;
                        });

                        return sortedDocs.length > 0 ? sortedDocs.map((doc) => (
                          <div
                            key={doc._id}
                            className={`doc-details-grid-item-wrapper ${selectedDocuments.includes(doc._id) ? 'selected' : ''}`}
                          >
                            <div className="doc-details-file-actions">
                              <>
                                <Button
                                  text="Rename"
                                  onClick={() => handleStartRename(doc._id, doc.displayFileName || doc.fileName)}
                                  colorScheme="orange-600"
                                  variant="gradient"
                                  font="lg"
                                  squircle="6xl"
                                  width="33%"
                                  height="40px"
                                  type="button"
                                  textColor="white-900"
                                />
                                <Button
                                  text="Delete"
                                  onClick={() => showDeleteConfirmation(doc._id, doc.displayFileName || doc.fileName)}
                                  colorScheme="red-600"
                                  variant="gradient"
                                  font="lg"
                                  squircle="6xl"
                                  width="33%"
                                  height="40px"
                                  type="button"
                                  textColor="white-900"
                                />
                              </>
                            </div>
                            <div
                              className="doc-details-grid-item"
                              onClick={() => selectionMode && toggleDocumentSelection(doc._id)}
                            >
                              {selectionMode && (
                                <div className="doc-details-selection-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={selectedDocuments.includes(doc._id)}
                                    onChange={() => toggleDocumentSelection(doc._id)}
                                  />
                                </div>
                              )}

                              <div className="doc-details-file-icon">
                                <span class="material-symbols-rounded">
                                  {getFileIcon(doc.fileName, doc.mimetype)}
                                </span>
                              </div>
                              <div className="doc-details-item-name">{doc.displayFileName || doc.documentType}</div>
                              <div className="doc-details-item-info">Issued: {doc.date}</div>
                              <div className="doc-details-item-info">Expiry: {doc.expiry}</div>
                            </div>

                            {!selectionMode && (
                              <div className="doc-details-file-actions">
                                <>
                                  <Button
                                    text="View"
                                    onClick={() => handleView(doc._id, doc.fileName)}
                                    colorScheme="amber-600"
                                    variant="gradient"
                                    font="lg"
                                    squircle="4xl"
                                    width="100px"
                                    height="40px"
                                    type="button"
                                    textColor="white-900"
                                  />
                                  <Button
                                    text="Download"
                                    onClick={() => handleDownload(doc._id, doc.fileName)}
                                    colorScheme="blue-600"
                                    variant="gradient"
                                    font="lg"
                                    squircle="4xl"
                                    width="190px"
                                    height="40px"
                                    type="button"
                                    textColor="white-900"
                                  />
                                  <Button
                                    text="Split"
                                    onClick={() => handleSplitPDF(doc._id, doc.fileName, doc.filePath)}
                                    colorScheme="purple-600"
                                    variant="gradient"
                                    font="lg"
                                    squircle="4xl"
                                    width="100px"
                                    height="40px"
                                    type="button"
                                    textColor="white-900"
                                  />
                                </>
                              </div>
                            )}

                            <DevModal
                              isOpen={renamingDocId === doc._id}
                              type="form"
                              title="Rename File"
                              message="Enter a new name for this file"
                              buttonText="Save"
                              secondaryButtonText="Cancel"
                              onButtonClick={() => handleSaveRename(doc._id)}
                              onSecondaryClick={handleCancelRename}
                              formFields={[
                                {
                                  name: 'fileName',
                                  label: 'File Name',
                                  type: 'text',
                                  placeholder: 'Enter new file name',
                                  required: true
                                }
                              ]}
                              formValues={{ fileName: newFileName }}
                              onFormChange={(fieldName, value) => setNewFileName(value)}
                            />
                          </div>
                        )) : (
                          <div className="doc-details-empty-state">
                            <div className="doc-details-empty-icon">📄</div>
                            <h3>No Files</h3>
                            <p>No files found.</p>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}

                {/* Files View */}
                {currentView === 'files' && currentCategory && currentDocType && (
                  <div className="doc-details-grid-container">
                    {(() => {
                      const categoryDocuments = groupedDocuments[currentCategory] || [];
                      const docTypeDocuments = categoryDocuments.filter(doc =>
                        (doc.documentType || 'Unknown') === currentDocType.name
                      );

                      const sortedDocs = docTypeDocuments.sort((a, b) => {
                        const dateA = a?.uploadDate ? new Date(a.uploadDate) : new Date(0);
                        const dateB = b?.uploadDate ? new Date(b.uploadDate) : new Date(0);
                        return dateB - dateA;
                      });

                      let docsToShow;
                      if (currentDocType.isLatest) {
                        docsToShow = sortedDocs.slice(0, 1);
                      } else {
                        docsToShow = sortedDocs.slice(1);
                      }

                      return docsToShow.length > 0 ? docsToShow.map((doc) => (
                        <div key={doc._id} className="doc-details-grid-item-wrapper">
                          <div className="doc-details-file-actions">
                            <>
                              <Button
                                text="Rename"
                                onClick={() => handleStartRename(doc._id, doc.displayFileName || doc.fileName)}
                                colorScheme="orange-600"
                                variant="gradient"
                                font="lg"
                                squircle="6xl"
                                width="33%"
                                height="40px"
                                type="button"
                                textColor="white-900"
                              />
                              <Button
                                text="Delete"
                                onClick={() => showDeleteConfirmation(doc._id, doc.displayFileName || doc.fileName)}
                                colorScheme="red-600"
                                variant="gradient"
                                font="lg"
                                squircle="6xl"
                                width="33%"
                                height="40px"
                                type="button"
                                textColor="white-900"
                              />
                            </>
                          </div>
                          <div className="doc-details-grid-item">
                            <div className="doc-details-file-icon">
                              <span class="material-symbols-rounded">
                                {getFileIcon(doc.fileName, doc.mimetype)}
                              </span>
                            </div>
                            <div className="doc-details-item-name">{doc.displayFileName || doc.documentType}</div>
                            <div className="doc-details-item-info">
                              Issued Date: {doc.date}
                            </div>
                            <div className="doc-details-item-info">
                              Expiry Date: {doc.expiry}
                            </div>
                          </div>

                          <div className="doc-details-file-actions">
                            <>
                              <Button
                                text="View"
                                onClick={() => handleView(doc._id, doc.fileName)}
                                colorScheme="amber-600"
                                variant="gradient"
                                font="lg"
                                squircle="4xl"
                                width="190px"
                                height="40px"
                                type="button"
                                textColor="white-900"
                              />
                              <Button
                                text="Download"
                                onClick={() => handleDownload(doc._id, doc.fileName)}
                                colorScheme="blue-600"
                                variant="gradient"
                                font="lg"
                                squircle="4xl"
                                width="190px"
                                height="40px"
                                type="button"
                                textColor="white-900"
                              />
                            </>
                          </div>

                          <DevModal
                            isOpen={renamingDocId === doc._id}
                            type="form"
                            title="Rename File"
                            message="Enter a new name for this file"
                            buttonText="Save"
                            secondaryButtonText="Cancel"
                            onButtonClick={() => handleSaveRename(doc._id)}
                            onSecondaryClick={handleCancelRename}
                            formFields={[
                              {
                                name: 'fileName',
                                label: 'File Name',
                                type: 'text',
                                placeholder: 'Enter new file name',
                                required: true
                              }
                            ]}
                            formValues={{ fileName: newFileName }}
                            onFormChange={(fieldName, value) => setNewFileName(value)}
                          />
                        </div>
                      )) : (
                        <div className="doc-details-empty-state">
                          <div className="doc-details-empty-icon">📄</div>
                          <h3>No Files</h3>
                          <p>No files found in this folder.</p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {showSplitModal && (
        <PDFPreviewModal
          isOpen={showSplitModal}
          onClose={() => setShowSplitModal(false)}
          documentId={splitDocument}
          documentUrl={splitDocumentUrl}
          fileName={splitDocumentName}
          onMergePages={handleMergePages}
          onSplitAll={handleSplitAllPages}
        />
      )}
      {/* Delete Confirmation Modal */}
      <DevModal
        isOpen={showDeleteModal}
        type="error"
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteDocumentName}"? This action cannot be undone.`}
        buttonText="Delete"
        secondaryButtonText="Cancel"
        onButtonClick={handleDelete}
        onSecondaryClick={handleCancelDelete}
      />
    </div>
  );
}

export default DocumentDetails;