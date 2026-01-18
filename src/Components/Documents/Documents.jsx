import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './Documents.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';
import jsPDF from 'jspdf';
import DevModal from '../../common/DevModal';
import { useHeaderTitle } from '../../context/HeaderTitleContext';
import Button from '../../common/Button/Button';

function DocumentDetails() {
  const { regNo } = useParams();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();

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
      const subtitle = `${equipmentData.machine} - ${regNo}`
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
  }, [equipmentData, regNo, activeTab]);

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


  // Navigate to "All Documents" view
  const navigateToAllDocuments = () => {
    setCurrentCategory('all'); // Special marker for all docs
    setCurrentView('allDocsSubfolders');
    setCurrentPath([
      { name: 'Documents', view: 'categories' },
      { name: 'All Documents', view: 'allDocsSubfolders', category: 'all' }
    ]);
  };

  // Navigate to Latest/Old in All Documents
  const navigateToAllDocsFolder = (isLatest) => {
    setCurrentView('allDocsFiles');
    setCurrentPath([
      { name: 'Documents', view: 'categories' },
      { name: 'All Documents', view: 'allDocsSubfolders', category: 'all' },
      { name: isLatest ? 'Latest' : 'Old', view: 'allDocsFiles', isLatest }
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
        regNo: regNo,
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
  const handleSplitPDF = async (documentId) => {
    setSplitDocument(documentId);
    setShowSplitModal(true);
    setMessage({ text: 'Select split options...', type: 'info' });
  };

  // Confirm split operation
  const confirmSplitPDF = async (splitOptions) => {
    try {
      const response = await apiRequest(`${END_POINT}/documents/split-pdf`, 'POST', {
        regNo: regNo,
        documentId: splitDocument,
        splitOptions: splitOptions, // e.g., { type: 'pages', pages: [1,2,3] }
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

    if (ext === 'pdf' || mime.includes('pdf')) return '📄';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext) || mime.includes('image')) return '🖼️';
    if (['doc', 'docx'].includes(ext) || mime.includes('word')) return '📝';
    if (['xls', 'xlsx'].includes(ext) || mime.includes('spreadsheet')) return '📊';
    if (['ppt', 'pptx'].includes(ext) || mime.includes('presentation')) return '📑';
    if (['zip', 'rar', '7z'].includes(ext)) return '🗜️';
    if (['txt'].includes(ext) || mime.includes('text')) return '📄';
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
      if (regNo) {
        fetchDocuments();
      }
    }
  }, [activeTab, regNo]);

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

  // Load equipment data and fetch document types
  useEffect(() => {
    if (regNo) {
      import('../../equipments').then(module => {
        const equipment = module.default.find(eq => eq.regNo.trim() === regNo.trim());
        setEquipmentData(equipment);
      }).catch(err => {
        console.error("Could not load equipment data:", err);
      });
    }

    // Fetch document types when component mounts
    fetchDocumentTypes(); // ← UNCOMMENT THIS LINE
  }, [regNo]);

  // Fetch documents when view tab is active
  useEffect(() => {
    if (activeTab === 'view' && regNo) {
      fetchDocuments();
    }
  }, [activeTab, regNo]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file selection
  // REPLACE your existing handleFileChange function with this:
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

  // Handle form submission with progress modal
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile || !regNo || !formData.documentType) {
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
        if (prev >= 90) return prev; // Stop at 90% until completion
        return prev + Math.random() * 15; // Random increments for smooth animation
      });
    }, 150);

    try {
      const response = await apiRequest(`${END_POINT}/documents/upload-document`,
        'POST',
        {
          regNo: regNo,
          documentType: formData.documentType,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          description: formData.description,
          category: formData.category,
          date: formData.date,
          expiry: formData.expiry,
        },
        {}, // customHeaders
        selectedFile // the actual file
      );

      const result = await response.json();

      console.log(result);

      clearInterval(progressInterval);

      if (!result.status == 200) throw new Error(result.message || 'Upload failed');

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
      const response = await apiRequest(`${END_POINT}/documents/get-documents/${regNo}`, 'GET');

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();

      console.log(data);


      // Process the documents to flatten the files array
      const processedDocuments = [];

      if (data.documents && data.documents.length > 0) {
        data.documents.forEach(doc => {
          // Each document can have multiple files
          if (doc.files && doc.files.length > 0) {
            doc.files.forEach(file => {
              processedDocuments.push({
                _id: file._id,
                regNo: doc.regNo,
                documentType: doc.documentType,
                fileName: file.filename,
                filePath: file.path,
                mimetype: file.mimetype,
                date: file.date,
                expiry: file.expiry,
                uploadDate: file.uploadedAt || file.createdAt,
                createdAt: file.createdAt,
                updatedAt: file.updatedAt,
                // Add default values for missing fields
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

  // iOS-compatible view handler with direct URL approach
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
    <div className="doc-details-container">
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
          <form className="doc-details-form">
            <div className="doc-details-form-group">
              <label htmlFor="category">Category</label>
              <div className="doc-details-dropdown-container">
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={categories.find(cat => cat.value === formData.category)?.label || ''}
                  onChange={(e) => {
                    // Optional: allow typing to search
                    const searchValue = e.target.value.toLowerCase();
                    const matchedCategory = categories.find(cat =>
                      cat.label.toLowerCase().includes(searchValue)
                    );
                    if (matchedCategory) {
                      setFormData(prev => ({ ...prev, category: matchedCategory.value }));
                    }
                  }}
                  onFocus={() => setShowCategoryDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                  placeholder="Select category"
                  readOnly // Make it read-only if you don't want typing
                  required
                />

                {showCategoryDropdown && (
                  <div className="doc-details-dropdown-list">
                    {categories.map((cat) => (
                      <div
                        key={cat.value}
                        className="doc-details-dropdown-item"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, category: cat.value }));
                          setShowCategoryDropdown(false);
                        }}
                      >
                        {cat.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="doc-details-form-group">
              <label htmlFor="documentType">Document Type</label>
              <div className="doc-details-dropdown-container">
                <input
                  type="text"
                  id="documentType"
                  name="documentType"
                  value={docTypeInput}
                  onChange={handleDocTypeInputChange}
                  onFocus={handleDocTypeInputFocus}
                  onBlur={handleDocTypeInputBlur}
                  placeholder="Type to search or add new document type"
                  required
                />

                {showDropdown && filteredDocTypes.length > 0 && (
                  <div className="doc-details-dropdown-list">
                    {filteredDocTypes.map((type, index) => (
                      <div
                        key={index}
                        className="doc-details-dropdown-item"
                        onClick={() => handleDocTypeSelect(type)}
                      >
                        {type}
                      </div>
                    ))}
                  </div>
                )}

                {showDropdown && filteredDocTypes.length === 0 && docTypeInput.trim() && (
                  <div className="doc-details-dropdown-list">
                    <div className="doc-details-dropdown-empty">
                      Press Enter to add "{docTypeInput}" as new document type
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="doc-details-form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter document description (optional)"
                rows="3"
              />
            </div>

            <div className="doc-details-form-group">
              <label htmlFor="date">Date of Issue</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="doc-details-form-group">
              <label htmlFor="date">Date of Expiry</label>
              <input
                type="date"
                id="expiry"
                name="expiry"
                value={formData.expiry}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="doc-details-form-group doc-details-file-group">
              <label htmlFor="document-file">Select Document</label>

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
                    <span class="material-symbols-rounded">files</span>
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
              </div>

              {selectedFile && (
                <div className="doc-details-file-info">
                  Selected: {selectedFile.name}
                </div>
              )}
            </div>

            {previewImage && (
              <div className="doc-details-preview">
                <img src={previewImage} alt="Preview" />
              </div>
            )}

            <div className="doc-details-form-actions">
              <Button
                text="Reset"
                onClick={handleReset}
                colorScheme="red-800"
                variant="gradient"
                font="md"
                animation=""
                squircle="4xl"
                width="50%"
                height="48px"
                type="submit"
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
                width="50%"
                height="48px"
                type={isLoading ? 'disabled' : 'submit'}
                textColor={activeTab === 'view' ? 'black-300' : 'white-900'}
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

                      const sortedDocs = docTypeDocuments.sort((a, b) =>
                        new Date(b.uploadDate) - new Date(a.uploadDate)
                      );

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

                {/* All Documents Subfolders View (Latest/Old) */}
                {currentView === 'allDocsSubfolders' && (
                  <div className="doc-details-grid-container">
                    {(() => {
                      const sortedDocs = [...documentsList].sort((a, b) =>
                        new Date(b.uploadDate) - new Date(a.uploadDate)
                      );

                      const folders = [];

                      // Latest folder
                      if (sortedDocs.length > 0) {
                        // Get unique document types in latest
                        const latestDoc = sortedDocs[0];
                        const latestDocTypes = new Set();
                        documentsList.forEach(doc => {
                          if (new Date(doc.uploadDate).getTime() === new Date(latestDoc.uploadDate).getTime()) {
                            latestDocTypes.add(doc.documentType);
                          }
                        });

                        folders.push(
                          <div
                            key="all-latest"
                            className="doc-details-grid-item"
                            onClick={() => navigateToAllDocsFolder(true)}
                          >
                            <div className="doc-details-folder-icon">📁</div>
                            <div className="doc-details-item-name">Latest</div>
                            <div className="doc-details-item-info">{latestDocTypes.size} unique document type{latestDocTypes.size !== 1 ? 's' : ''}</div>
                            <div className="doc-details-latest-badge">LATEST</div>
                          </div>
                        );
                      }

                      // Old folder
                      if (sortedDocs.length > 1) {
                        folders.push(
                          <div
                            key="all-old"
                            className="doc-details-grid-item"
                            onClick={() => navigateToAllDocsFolder(false)}
                          >
                            <div className="doc-details-folder-icon">📁</div>
                            <div className="doc-details-item-name">Old</div>
                            <div className="doc-details-item-info">{sortedDocs.length - 1} document{sortedDocs.length - 1 !== 1 ? 's' : ''}</div>
                            <div className="doc-details-old-badge">OLD</div>
                          </div>
                        );
                      }

                      return folders;
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
                        const sortedDocs = [...documentsList].sort((a, b) =>
                          new Date(b.uploadDate) - new Date(a.uploadDate)
                        );

                        const pathIsLatest = currentPath[currentPath.length - 1].isLatest;
                        let docsToShow;

                        if (pathIsLatest) {
                          // Show only latest uploads
                          const latestDate = new Date(sortedDocs[0].uploadDate);
                          docsToShow = sortedDocs.filter(doc =>
                            new Date(doc.uploadDate).getTime() === latestDate.getTime()
                          );
                        } else {
                          // Show all except latest
                          const latestDate = new Date(sortedDocs[0].uploadDate);
                          docsToShow = sortedDocs.filter(doc =>
                            new Date(doc.uploadDate).getTime() !== latestDate.getTime()
                          );
                        }

                        return docsToShow.length > 0 ? docsToShow.map((doc) => (
                          <div
                            key={doc._id}
                            className={`doc-details-grid-item-wrapper ${selectedDocuments.includes(doc._id) ? 'selected' : ''
                              }`}
                          >
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
                                {getFileIcon(doc.fileName, doc.mimetype)}
                              </div>
                              <div className="doc-details-item-name">{doc.fileName}</div>
                              <div className="doc-details-item-info">Type: {doc.documentType}</div>
                              <div className="doc-details-item-info">Issued: {doc.date}</div>
                              <div className="doc-details-item-info">Expiry: {doc.expiry}</div>
                            </div>

                            {!selectionMode && (
                              <div className="doc-details-file-actions">
                                <Button
                                  text="View"
                                  onClick={() => handleView(doc._id, doc.fileName)}
                                  colorScheme="amber-600"
                                  variant="gradient"
                                  font="sm"
                                  squircle="4xl"
                                  width="33%"
                                  height="40px"
                                  type="button"
                                  textColor="white-900"
                                />
                                <Button
                                  text="Download"
                                  onClick={() => handleDownload(doc._id, doc.fileName)}
                                  colorScheme="blue-600"
                                  variant="gradient"
                                  font="sm"
                                  squircle="4xl"
                                  width="33%"
                                  height="40px"
                                  type="button"
                                  textColor="white-900"
                                />
                                <Button
                                  text="Split"
                                  onClick={() => handleSplitPDF(doc._id)}
                                  colorScheme="purple-600"
                                  variant="gradient"
                                  font="sm"
                                  squircle="4xl"
                                  width="33%"
                                  height="40px"
                                  type="button"
                                  textColor="white-900"
                                />
                              </div>
                            )}
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

                      const sortedDocs = docTypeDocuments.sort((a, b) =>
                        new Date(b.uploadDate) - new Date(a.uploadDate)
                      );

                      let docsToShow;
                      if (currentDocType.isLatest) {
                        docsToShow = sortedDocs.slice(0, 1);
                      } else {
                        docsToShow = sortedDocs.slice(1);
                      }

                      return docsToShow.length > 0 ? docsToShow.map((doc) => (
                        <div key={doc._id} className="doc-details-grid-item-wrapper">
                          <div className="doc-details-grid-item">
                            <div className="doc-details-file-icon">
                              {getFileIcon(doc.fileName, doc.mimetype)}
                            </div>
                            <div className="doc-details-item-name">{doc.fileName}</div>
                            <div className="doc-details-item-info">
                              Issued Date: {doc.date}
                            </div>
                            <div className="doc-details-item-info">
                              Expiry Date: {doc.expiry}
                            </div>
                          </div>

                          {/* Buttons outside the grid item */}
                          <div className="doc-details-file-actions">
                            <Button
                              text="View"
                              onClick={() => handleView(doc._id, doc.fileName)}
                              colorScheme="amber-600"
                              variant="gradient"
                              font="sm"
                              animation=""
                              squircle="4xl"
                              width="50%"
                              height="40px"
                              type="button"
                              textColor="white-900"
                              shadowPosition="to-bottom"
                              shadowColor="amber-800"
                            />
                            <Button
                              text="Download"
                              onClick={() => handleDownload(doc._id, doc.fileName)}
                              colorScheme="blue-600"
                              variant="gradient"
                              font="sm"
                              animation=""
                              squircle="4xl"
                              width="50%"
                              height="40px"
                              type="button"
                              textColor="white-900"
                              shadowPosition="to-bottom"
                              shadowColor="blue-800"
                            />
                          </div>
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
    </div>
  );
}

export default DocumentDetails;