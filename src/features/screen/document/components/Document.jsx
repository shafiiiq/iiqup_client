import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDocument } from '../hooks/useDocument';
import Modal from '@/shared/components/widgets/modal/Modal';
import Button from '@/shared/components/widgets/button/Button';
import Input from '@/shared/components/widgets/input/Input';
import Text from '@/shared/components/widgets/text/Text';
import Tabs from '@/shared/components/widgets/tabs/Tabs';
import PDFPreviewModal from '@/shared/components/viewer/Pdf/PdfViewer/PdfViewer';
import Loader from '@/shared/components/widgets/loader/spinner/Spinner';
import Toast from '@/shared/components/widgets/toast/Toast';
import Picker from '@/shared/components/pickers/Picker';
import { CATEGORIES, TAB_BTN, FILE_BTN, DOCUMENT_TAB_ICONS } from '../constants/document.constant';
import { getFileIcon, buildDocumentViewNavTree, buildDisplayFileName } from '../helper/document.helper';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import './Document.css';

const DocCard = ({
  doc,
  showSplit = false,
  selectionMode,
  selectedDocuments,
  onToggleSelect,
  onCheckboxNoop,
  onRenameClick,
  onDeleteClick,
  onView,
  onDownload,
  onSplit,
}) => (
  <div className={`doc-details-grid-item-wrapper ${selectedDocuments.includes(doc._id) ? 'selected' : ''}`}>
    <div className="doc-details-file-actions">
      <Button {...FILE_BTN} componentIconCenter="IconlyEdit" componentIconSize={30} padding='0 10px' width="fit-content" height="40px" colorScheme="warning-700" iconColor="white-200" squircle="6xl"
        onClick={() => onRenameClick(doc)} />
      <Button {...FILE_BTN} componentIconCenter="IconlyDelete" componentIconSize={30} padding='0 10px' width="fit-content" height="40px" colorScheme="error-700" iconColor="white-200" squircle="6xl"
        onClick={() => onDeleteClick(doc)} />
    </div>
    <div className="doc-details-grid-item" onClick={() => onToggleSelect(doc._id)}>
      {selectionMode && (
        <div className="doc-details-selection-checkbox">
          <input type="checkbox" readOnly checked={selectedDocuments.includes(doc._id)} onChange={onCheckboxNoop} />
        </div>
      )}
      <div className="doc-details-file-icon">
        {renderComponentIcon(getFileIcon(doc.fileName, doc.mimetype), 90, 'currentColor')}
      </div>
      <div className="doc-details-item-name">{buildDisplayFileName(doc)}</div>
      <div className="doc-details-grid-item-info-block">
        <div className="doc-details-item-info">Issued: {doc.date}</div>
        <div className="doc-details-item-info">Expiry: {doc.expiry}</div>
      </div>
    </div>
    {!selectionMode && (
      <div className="doc-details-file-actions">
        <Button {...FILE_BTN} componentIconCenter="IconlyShow" componentIconSize={30} padding='0 20px' width="fit-content" height="40px" colorScheme="info-800" iconColor="white-200"
          onClick={() => onView(doc._id, doc.fileName)} />
        <Button {...FILE_BTN} componentIconCenter="IconlyDownload" componentIconSize={30} padding='0 20px' width="fit-content" height="40px" colorScheme="success-800" iconColor="white-200"
          onClick={() => onDownload(doc._id, doc.fileName)} />
        {showSplit && (
          <Button {...FILE_BTN} componentIconCenter="ScissorsIcon" componentIconSize={30} padding='0 20px' width="fit-content" height="40px" colorScheme="warning-800" iconColor="white-200"
            onClick={() => onSplit(doc._id, doc.fileName, doc.filePath)} />
        )}
      </div>
    )}
  </div>
);

const EmptyState = ({ icon = '📄', title = 'No Files', msg = 'No files found.' }) => (
  <div className="doc-details-empty-state">
    <div className="doc-details-empty-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{msg}</p>
  </div>
);

const FolderTile = ({ label, count, icon = 'FolderIcon', onOpen }) => (
  <div className="doc-details-grid-item" onClick={onOpen}>
    <div className="doc-details-folder-icon">
      {renderComponentIcon(icon, 90, 'currentColor')}
    </div>
    <div className="doc-details-item-name">{label}</div>
    {typeof count === 'number' && (
      <div className="doc-details-grid-item-info-block">
        <div className="doc-details-item-info">{count} item{count === 1 ? '' : 's'}</div>
      </div>
    )}
  </div>
);

function Document() {
  const { type: routeType, id: routeId } = useParams();
  const [selectedSource, setSelectedSource] = useState(() =>
    routeType && routeId ? { type: routeType, id: routeId } : null
  );

  const {
    activeTab,
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
    currentView,
    currentCategory,
    currentDocType,
    selectionMode,
    selectedDocuments,
    showDeleteModal,
    deleteDocumentName,
    renamingDocId,
    newFileName,
    showSplitModal,
    splitDocument,
    splitDocumentUrl,
    splitDocumentName,
    groupedDocuments,
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
    handleSplitPDF,
    handleMergePages,
    handleSplitAllPages,
    handleMergePDFs,
    navigateToCategoriesRoot,
    navigateToAllDocuments,
    navigateToCategory,
    navigateToDocType,
    navigateToSubfolder,
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
  } = useDocument({ type: selectedSource?.type, id: selectedSource?.id });

  const handlePickerSelect = (type, item, meta) => {
    if (type === 'equipment') {
      setSelectedSource({ type: 'equipment', id: item._id });
    } else if (type === 'user') {
      setSelectedSource({ type: meta || 'staff', id: item._id || item.id });
    }
  };

  const handleClearSource = () => setSelectedSource(null);

  const handleTabsSelect = (path) => {
    const [topKey, categoryKey, docTypeKey, subfolderKey] = path;

    if (topKey === 'add') {
      handleAddTabClick();
      return;
    }

    handleViewTabClick();

    if (!categoryKey) {
      navigateToCategoriesRoot();
    } else if (categoryKey === 'all') {
      navigateToAllDocuments();
    } else if (!docTypeKey) {
      navigateToCategory(categoryKey);
    } else if (!subfolderKey) {
      navigateToDocType(docTypeKey);
    } else {
      navigateToSubfolder(docTypeKey, subfolderKey === 'latest');
    }
  };

  const documentNavTree = selectedSource ? buildDocumentViewNavTree(groupedDocuments) : [];

  const tabItems = [
    { key: 'add', label: 'Add Document', iconName: DOCUMENT_TAB_ICONS.ADD },
    { key: 'view', label: 'View Document', iconName: DOCUMENT_TAB_ICONS.VIEW, children: documentNavTree },
  ];

  const viewTreePath = (() => {
    if (currentView === 'allDocsFiles' && currentCategory === 'all') return ['view', 'all'];
    if (currentView === 'docTypes' && currentCategory) return ['view', currentCategory];
    if (currentView === 'subfolders' && currentCategory && currentDocType) {
      return ['view', currentCategory, currentDocType.name];
    }
    if (currentView === 'files' && currentCategory && currentDocType) {
      return currentDocType.isLatest !== undefined
        ? ['view', currentCategory, currentDocType.name, currentDocType.isLatest ? 'latest' : 'old']
        : ['view', currentCategory, currentDocType.name];
    }
    return ['view'];
  })();

  const activePath = activeTab === 'add' ? ['add'] : viewTreePath;

  const sourceBannerText = sourceData
    ? sourceData.machine
      ? `${sourceData.machine} - ${sourceData.regNo}`
      : sourceData.name || 'Selected source'
    : 'Loading source...';

  return (
    <div className={`doc-details-container ${isDragging ? 'dragging-active' : ''}`}>
      <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={handleCloseToast} />

      <Modal isOpen={showProgressModal} type="progress" title="Uploading Document"
        message={selectedFile ? `Uploading: ${selectedFile.name}` : 'Uploading to cloud storage...'}
        progress={uploadProgress} progressText="Processing..." />

      <div className="doc-details-layout">
        <div className="doc-details-layout-sidebar">
          <Tabs
            maxHeight='1090px'
            title={null}
            items={tabItems}
            activePath={activePath}
            onSelect={handleTabsSelect}
            showSearch={false}
          />
        </div>

        <div className="doc-details-layout-content">
          {!selectedSource ? (
            <div className="doc-details-source-picker">
              <Picker types={['equipment', 'user']} onSelect={handlePickerSelect} />
            </div>
          ) : (
            <>
              <div className="doc-details-source-banner">
                <Text as="div" variant="subtitle" className="doc-details-source-banner-text">
                  {sourceBannerText}
                </Text>
                <Button
                  text="Change Source"
                  onClick={handleClearSource}
                  colorScheme="warning-700"
                  textColor="white-200"
                  variant="gradient"
                  font="md"
                  animation=""
                  squircle="4xl"
                  width="fit-content"
                  height="40px"
                  type="button"
                />
              </div>

              {activeTab === 'add' && (
                <div className="doc-details-form-container">
                  <form className="doc-details-form-split">
                    <div className="doc-details-form-left">
                      <div className="doc-details-form-group">
                        <Input type="select" id="category" name="category" value={formData.category}
                          onChange={handleCategoryChange}
                          placeholder="Select category" required options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
                          colorScheme="primary-600" textColor="white-100" label="Category" labelBgColor="transparent"
                          labelSize="3xl" labelColor="white-100" variant="filled" width="100%" height="57px"
                          squircle="4xl" fontWeight="500" inputPaddingInline="2xl" inputPaddingBlock="xl" />
                      </div>
                      <div className="doc-details-form-group">
                        <Input type="search-select" id="documentType" name="documentType" value={docTypeInput}
                          onChange={handleDocTypeChange} placeholder="Type to search or add new document type" required
                          options={documentTypes.map((t) => ({ value: t, label: t }))}
                          colorScheme="primary-600" textColor="white-100" label="Document Type" labelBgColor="transparent"
                          labelSize="3xl" labelColor="white-100" placeholderColor="white-100" variant="filled"
                          width="100%" height="57px" squircle="4xl" fontWeight="500" inputPaddingInline="2xl" inputPaddingBlock="xl" />
                      </div>
                      <div className="doc-details-form-group">
                        <Input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange}
                          placeholder="Select issue date" required colorScheme="primary-600" textColor="white-100"
                          label="Date of Issue" labelBgColor="transparent" labelSize="3xl" labelColor="white-100"
                          variant="filled" width="100%" height="57px" squircle="4xl" fontWeight="500"
                          inputPaddingInline="2xl" inputPaddingBlock="xl" iconRight="calendar_today" />
                      </div>
                      <div className="doc-details-form-group">
                        <Input type="date" id="expiry" name="expiry" value={formData.expiry} onChange={handleInputChange}
                          placeholder="Select expiry date" required colorScheme="primary-600" textColor="white-100"
                          label="Date of Expiry" labelBgColor="transparent" labelSize="3xl" labelColor="white-100"
                          variant="filled" width="100%" height="57px" squircle="4xl" fontWeight="500"
                          inputPaddingInline="2xl" inputPaddingBlock="xl" iconRight="event" />
                      </div>
                      <div className="doc-details-form-group doc-details-form-group-wide">
                        <Input type="textarea" id="description" name="description" value={formData.description}
                          onChange={handleInputChange} placeholder="Enter document description (optional)" rows={10}
                          colorScheme="primary-600" textColor="white-100" label="Description" labelBgColor="transparent"
                          labelSize="3xl" labelColor="white-100" placeholderColor="white-100" variant="filled"
                          width="100%" squircle="4xl" fontWeight="500" inputPaddingInline="2xl" inputPaddingBlock="xl" />
                      </div>
                    </div>

                    <div className="doc-details-form-right">
                      <div className="doc-details-file-upload-section">
                        <div className={`doc-details-drop-zone ${isDragging ? 'dragging' : ''}`}
                          onDragEnter={handleZoneDragEnter}
                          onDragOver={handleZoneDragOver}
                          onDragLeave={handleZoneDragLeave}
                          onDrop={handleZoneDrop}>
                          <div className="doc-details-drop-content">
                            <div className="doc-details-drop-icon"><span className="material-symbols-rounded">files</span></div>
                            <p className="doc-details-drop-text">Drag and drop your file here</p>
                            <p className="doc-details-drop-or">or</p>
                            <input type="file" id="document-file" onChange={handleFileChange}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp" style={{ display: 'none' }} required />
                            <div onClick={handleBrowseFilesClick}>
                              <Button text="Browse Files" colorScheme="primary-100" variant="gradient" font="md"
                                animation="" squircle="3xl" width="auto" height="44px" type="button"
                                textColor="black-100" shadowPosition="to-bottom" shadowColor="primary-800" />
                            </div>
                          </div>
                          {previewImage && <div className="doc-details-preview"><img src={previewImage} alt="Preview" /></div>}
                        </div>
                        {selectedFile && <div className="doc-details-file-info">Selected: {selectedFile.name}</div>}
                      </div>
                    </div>

                    <div className="doc-details-form-actions">
                      <Button text="Reset" onClick={handleReset} colorScheme="warning-700" variant="gradient" font="md"
                        animation="" squircle="4xl" width="200px" height="48px" type="button"
                        textColor="white-100" shadowPosition="to-bottom" shadowColor="white-600" />
                      <Button text={isLoading ? 'Uploading...' : 'Upload Document'} onClick={handleSubmit}
                        colorScheme={isLoading ? 'success-1000' : 'success-700'} variant="gradient" font="md" animation=""
                        squircle="4xl" width="200px" height="48px" type={isLoading ? 'disabled' : 'submit'}
                        textColor="white-100" shadowPosition="to-bottom" shadowColor="white-600" />
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'view' && (
                <div className="doc-details-view-container">
                  {isLoading ? <Loader /> : (
                    <div className="doc-details-explorer-content">
                      {currentView === 'allDocsFiles' && (
                        <>
                          <div className="doc-details-selection-toolbar">
                            <Button {...FILE_BTN} squircle="4xl" width="auto" height="40px"
                              text={selectionMode ? 'Cancel Selection' : 'Select Multiple'}
                              colorScheme={selectionMode ? 'error-700' : 'success-700'} textColor="white-100"
                              onClick={handleToggleSelectionMode} />
                            {selectionMode && selectedDocuments.length >= 2 && (
                              <Button {...FILE_BTN} squircle="4xl" width="auto" height="40px"
                                componentIconLeft="MergeIcon" componentIconSize={30} iconColor='black-100'
                                text={`Merge ${selectedDocuments.length} PDFs`} colorScheme="warning-500"
                                textColor="black-100" onClick={handleMergePDFs} />
                            )}
                          </div>
                          <div className="doc-details-grid-container">
                            {sortedAllDocuments.length > 0
                              ? sortedAllDocuments.map((doc) => (
                                <DocCard
                                  key={doc._id}
                                  doc={doc}
                                  showSplit
                                  selectionMode={selectionMode}
                                  selectedDocuments={selectedDocuments}
                                  onToggleSelect={handleToggleSelectDocument}
                                  onCheckboxNoop={handleCheckboxNoop}
                                  onRenameClick={handleRenameClick}
                                  onDeleteClick={handleDeleteClick}
                                  onView={handleView}
                                  onDownload={handleDownload}
                                  onSplit={handleSplitPDF}
                                />
                              ))
                              : <EmptyState />}
                          </div>
                        </>
                      )}

                      {currentView === 'files' && currentCategory && currentDocType && (
                        <div className="doc-details-grid-container">
                          {filesToDisplay.length > 0
                            ? filesToDisplay.map((doc) => (
                              <DocCard
                                key={doc._id}
                                doc={doc}
                                selectionMode={selectionMode}
                                selectedDocuments={selectedDocuments}
                                onToggleSelect={handleToggleSelectDocument}
                                onCheckboxNoop={handleCheckboxNoop}
                                onRenameClick={handleRenameClick}
                                onDeleteClick={handleDeleteClick}
                                onView={handleView}
                                onDownload={handleDownload}
                                onSplit={handleSplitPDF}
                              />
                            ))
                            : <EmptyState msg="No files found in this folder." />}
                        </div>
                      )}

                      {currentView === 'categories' && (
                        <div className="doc-details-grid-container">
                          {documentNavTree.length > 0
                            ? documentNavTree.map((node) => (
                              <FolderTile
                                key={node.key}
                                label={node.label}
                                count={node.badge}
                                icon={node.key === 'all' ? 'MutipleFilesIcon' : 'IconlyFolder'}
                                onOpen={() => (node.key === 'all' ? navigateToAllDocuments() : navigateToCategory(node.key))}
                              />
                            ))
                            : <EmptyState icon="📁" title="No Documents" msg="No documents uploaded yet." />}
                        </div>
                      )}

                      {currentView === 'docTypes' && currentCategory && (
                        <div className="doc-details-grid-container">
                          {(documentNavTree.find((node) => node.key === currentCategory)?.children ?? []).map((node) => (
                            <FolderTile
                              key={node.key}
                              label={node.label}
                              count={node.badge}
                              onOpen={() => navigateToDocType(node.key)}
                            />
                          ))}
                        </div>
                      )}

                      {currentView === 'subfolders' && currentCategory && currentDocType && (
                        <div className="doc-details-grid-container">
                          {(
                            documentNavTree
                              .find((node) => node.key === currentCategory)
                              ?.children.find((node) => node.key === currentDocType.name)
                              ?.children ?? []
                          ).map((node) => (
                            <FolderTile
                              key={node.key}
                              label={node.label}
                              count={node.badge}
                              onOpen={() => navigateToSubfolder(currentDocType.name, node.key === 'latest')}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showSplitModal && (
        <PDFPreviewModal isOpen={showSplitModal} onClose={handleCloseSplitModal}
          documentId={splitDocument} documentUrl={splitDocumentUrl} fileName={splitDocumentName}
          onMergePages={handleMergePages} onSplitAll={handleSplitAllPages} />
      )}

      <Modal isOpen={!!renamingDocId} type="form" mode="dialog" title="Rename File" height="200px"
        message="Enter a new name for this file" buttonText="Save" secondaryButtonText="Cancel"
        onButtonClick={handleConfirmRename}
        onSecondaryClick={handleCancelRename}
        formFields={[{ name: 'fileName', label: 'File Name', type: 'text', placeholder: 'Enter new file name', required: true }]}
        formValues={{ fileName: newFileName }}
        onFormChange={handleRenameFormChange} />

      <Modal isOpen={showDeleteModal} type="error" title="Delete Document"
        message={`Are you sure you want to delete "${deleteDocumentName}"? This action cannot be undone.`}
        buttonText="Delete" secondaryButtonText="Cancel"
        onButtonClick={handleDelete}
        onSecondaryClick={handleCancelDelete} />
    </div>
  );
}

export default Document;