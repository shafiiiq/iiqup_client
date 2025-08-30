import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './Documents.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';

function DocumentDetails() {
  const { regNo } = useParams();
  const [activeTab, setActiveTab] = useState('add');
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

  // New state for managing old document visibility
  const [expandedDocTypes, setExpandedDocTypes] = useState({});

  // New states for dynamic document types
  const [documentTypes, setDocumentTypes] = useState([]);
  const [filteredDocTypes, setFilteredDocTypes] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [docTypeInput, setDocTypeInput] = useState('');

  // Progress Modal States
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(''); // 'uploading', 'success', 'error'
  const [uploadError, setUploadError] = useState('');

  // Form data state
  const [formData, setFormData] = useState({
    documentType: '',
    description: '',
    uploadDate: new Date().toISOString().split('T')[0],
    category: 'certificate', // certificate, inspection, specification, handover
    expiry: new Date().toISOString().split('T')[0],
    date: new Date().toISOString().split('T')[0]
  });

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

  // Fetch all document types from API
  const fetchDocumentTypes = async () => {
    try {
      const response = await apiRequest(`${END_POINT}/documents/get-all-documents`);

      if (!response.ok) {
        throw new Error('Failed to fetch document types');
      }

      const data = await response.json();

      console.log(data);


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

  // Close progress modal
  const closeProgressModal = () => {
    setShowProgressModal(false);
    setUploadProgress(0);
    setUploadStatus('');
    setUploadError('');
  };

  // Cancel upload (you might need to implement actual cancel logic based on your API)
  const cancelUpload = () => {
    // Implement actual cancel logic here if your API supports it
    closeProgressModal();
    setIsLoading(false);
    setMessage({ text: 'Upload cancelled', type: 'error' });
  };

  // Simulate progress updates (replace with actual progress tracking from your S3 upload)
  const simulateProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) {
        progress = 90; // Stop at 90% until actual completion
      }
      setUploadProgress(Math.min(progress, 90));

      if (progress >= 90) {
        clearInterval(interval);
      }
    }, 200);
    return interval;
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
    fetchDocumentTypes();
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
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);

      // Preview image if it's an image file
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewImage(null);
      }
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

    // Start progress simulation
    const progressInterval = simulateProgress();

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
        closeProgressModal();
        handleReset();
        setMessage({ text: '', type: '' });
      }, 2000);

    } catch (error) {
      console.error("Error uploading document:", error);
      clearInterval(progressInterval);
      setUploadStatus('error');
      setUploadError(error.message);
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
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
      <div className="doc-details-header">
        <h1 className="doc-details-title">Document Details</h1>
        <div className="doc-details-datetime">{currentDateTime}</div>
      </div>

      {equipmentData && (
        <div className="doc-details-equipment-info">
          {equipmentData.machine} - {regNo}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="doc-details-tabs">
        <button
          className={`doc-details-tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Add Document
        </button>
        <button
          className={`doc-details-tab ${activeTab === 'view' ? 'active' : ''}`}
          onClick={() => setActiveTab('view')}
        >
          View Documents
        </button>
      </div>

      {message.text && (
        <div className={`doc-details-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="doc-details-progress-modal-overlay">
          <div className="doc-details-progress-modal">
            <div className="doc-details-progress-header">
              <div className="doc-details-upload-icon">
                📄
              </div>
              <h3 className="doc-details-progress-title">
                {uploadStatus === 'uploading' && 'Uploading Document...'}
                {uploadStatus === 'success' && 'Upload Complete!'}
                {uploadStatus === 'error' && 'Upload Failed'}
              </h3>
            </div>

            {selectedFile && (
              <p className="doc-details-progress-subtitle">
                {selectedFile.name}
              </p>
            )}

            <div className="doc-details-progress-container">
              <div className="doc-details-progress-bar-bg">
                <div
                  className="doc-details-progress-bar-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="doc-details-progress-percentage">
                {Math.round(uploadProgress)}%
              </div>
              <div className="doc-details-progress-status">
                {uploadStatus === 'uploading' && 'Uploading to cloud storage...'}
                {uploadStatus === 'success' && (
                  <span className="doc-details-progress-success">
                    Document uploaded successfully!
                  </span>
                )}
                {uploadStatus === 'error' && (
                  <span className="doc-details-progress-error">
                    {uploadError || 'Upload failed. Please try again.'}
                  </span>
                )}
              </div>
            </div>

            <div className="doc-details-progress-actions">
              {uploadStatus === 'uploading' && (
                <button
                  onClick={cancelUpload}
                  className="doc-details-progress-btn doc-details-progress-btn-cancel"
                >
                  Cancel
                </button>
              )}

              {(uploadStatus === 'success' || uploadStatus === 'error') && (
                <button
                  onClick={closeProgressModal}
                  className="doc-details-progress-btn doc-details-progress-btn-close"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Document Tab */}
      {activeTab === 'add' && (
        <div className="doc-details-form-container">
          <form onSubmit={handleSubmit} className="doc-details-form">
            <div className="doc-details-form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="doc-details-form-group">
              <label htmlFor="documentType">Document Type</label>
              <div className="doc-details-dropdown-container" style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="documentType"
                  name="documentType"
                  value={docTypeInput}
                  onChange={handleDocTypeInputChange}
                  onFocus={handleDocTypeInputFocus}
                  onBlur={handleDocTypeInputBlur}
                  placeholder="Type to search or add new document type..."
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />

                {showDropdown && filteredDocTypes.length > 0 && (
                  <div
                    className="doc-details-dropdown-list"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderTop: 'none',
                      borderRadius: '0 0 4px 4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {filteredDocTypes.map((type, index) => (
                      <div
                        key={index}
                        onClick={() => handleDocTypeSelect(type)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: index < filteredDocTypes.length - 1 ? '1px solid #eee' : 'none',
                          fontSize: '14px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'white';
                        }}
                      >
                        {type}
                      </div>
                    ))}
                  </div>
                )}

                {showDropdown && filteredDocTypes.length === 0 && docTypeInput.trim() && (
                  <div
                    className="doc-details-dropdown-list"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderTop: 'none',
                      borderRadius: '0 0 4px 4px',
                      zIndex: 1000,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div
                      style={{
                        padding: '8px 12px',
                        fontSize: '14px',
                        color: '#666',
                        fontStyle: 'italic'
                      }}
                    >
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
              <input
                type="file"
                id="document-file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                required
              />
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
              <button
                type="button"
                onClick={handleReset}
                className="doc-details-action-btn reset"
              >
                Reset
              </button>
              <button
                type="submit"
                className="doc-details-action-btn submit"
                disabled={isLoading}
              >
                {isLoading ? 'Uploading...' : 'Upload Document'}
              </button>
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
                        docsToShow = sortedDocs.slice(0, 1); // Only latest
                      } else {
                        docsToShow = sortedDocs.slice(1); // All except latest
                      }

                      return docsToShow.length > 0 ? docsToShow.map((doc) => (
                        <div
                          key={doc._id}
                          className="doc-details-grid-item"
                        >
                          <div className="doc-details-file-icon">
                            {getFileIcon(doc.fileName, doc.mimetype)}
                          </div>
                          <div className="doc-details-item-name">{doc.fileName}</div>
                          <div className="doc-details-item-info">
                            {new Date(doc.uploadDate).toLocaleDateString()}
                          </div>
                          <div className="doc-details-file-actions">
                            <button
                              onClick={() => handleView(doc._id, doc.fileName)}
                              className="doc-details-file-action-btn view"
                              title="View document"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDownload(doc._id, doc.fileName)}
                              className="doc-details-file-action-btn download"
                              title="Download document"
                            >
                              Download
                            </button>
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