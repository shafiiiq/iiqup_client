import React, { useRef, useState } from 'react';
import ModalBase from '../../ModalBase';
import { DEFAULT_MODAL_MODE } from '../../modalModes';
import './FileUploadModal.css';

const FileUploadModal = ({
  isOpen,
  onClose,
  mode = DEFAULT_MODAL_MODE,
  title,
  message,
  buttonText,
  onButtonClick,
  modalWidth,
  modalHeight,
}) => {
  const [dragging, setDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const addFiles = (fileList) => setUploadedFiles((prev) => [...prev, ...Array.from(fileList)]);

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const handleRemove = (index) => setUploadedFiles((prev) => prev.filter((_, i) => i !== index));

  const handleClose = () => {
    setUploadedFiles([]);
    onClose();
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleClose}
      mode={mode}
      type="fileupload"
      title={title}
      showMessage={false}
      buttonText={buttonText}
      onButtonClick={() => onButtonClick?.(uploadedFiles)}
      modalWidth={modalWidth}
      modalHeight={modalHeight}
    >
      <div className="shared widget modal fileupload-section">
        {message && <p className="shared widget modal message">{message}</p>}

        <div
          className={`shared widget modal dropzone ${dragging ? 'is-dragging' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
        >
          <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={(event) => addFiles(event.target.files)} />
          <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor" style={{ opacity: 0.7 }}>
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
          </svg>
          <span className="shared widget modal dropzone-text">Drag the file or click here to upload</span>
        </div>

        {uploadedFiles.length > 0 && (
          <ul className="shared widget modal uploaded-file-list">
            {uploadedFiles.map((file, index) => (
              <li key={index} className="shared widget modal uploaded-file-item">
                <span className="shared widget modal uploaded-file-name">{file.name}</span>
                <button
                  className="shared widget modal uploaded-file-remove"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemove(index);
                  }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModalBase>
  );
};

export default FileUploadModal;
