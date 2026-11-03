import Button from '@/shared/components/widgets/button/Button';
import MaintenanceAttachment from '../../../components/MaintenanceAttachment';
import { useAttachmentDropzone } from '../../hooks/useAttachmentDropzone';
import { ACCEPTED_ATTACHMENT_TYPES, BUTTON_PROPS } from '../../constants/maintenance.form.constant';

function AttachmentsSection({ attachments, onFilesSelected, onRemoveAttachment }) {
  const dropzone = useAttachmentDropzone(onFilesSelected);

  return (
    <div className="fleet maintenance form section">
      <h3 className="fleet maintenance form section-title">Attachments</h3>

      <div
        className={`fleet maintenance form dropzone ${dropzone.isDragging ? 'dragging' : ''}`}
        onDragOver={dropzone.handleDragOver}
        onDragLeave={dropzone.handleDragLeave}
        onDrop={dropzone.handleDrop}
      >
        <p>Drag and drop images or videos here, paste from clipboard, or browse your files</p>
        <Button
          {...BUTTON_PROPS}
          width="200px"
          text="Browse Files"
          colorScheme="primary-700"
          textColor="white-100"
          onClick={dropzone.openFileExplorer}
        />
        <input
          ref={dropzone.fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_ATTACHMENT_TYPES}
          className="fleet maintenance form file-input"
          onChange={dropzone.handleInputChange}
        />
      </div>

      {attachments.length > 0 && (
        <div className="fleet maintenance form attachment-grid">
          {attachments.map((attachment) => (
            <MaintenanceAttachment key={attachment.localId} attachment={attachment} onRemove={onRemoveAttachment} />
          ))}
        </div>
      )}
    </div>
  );
}

export default AttachmentsSection;