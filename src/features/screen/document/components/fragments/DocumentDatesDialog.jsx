import { useState } from 'react';
import Button from '@/shared/components/widgets/button/Button';
import { DIALOG_BUTTON_PROPS } from '../../constants/document.constant';

function DocumentDatesDialog({
  title,
  confirmText,
  showFileInput,
  initialIssueDate,
  initialExpiryDate,
  isSubmitting,
  onConfirm,
  onCancel,
}) {
  const [issueDate, setIssueDate] = useState(initialIssueDate);
  const [expiryDate, setExpiryDate] = useState(initialExpiryDate);
  const [selectedFile, setSelectedFile] = useState(null);

  return (
    <div className="doc-details-dialog-backdrop">
      <div className="doc-details-dialog">
        <h3 className="doc-details-dialog-title">{title}</h3>

        {showFileInput && (
          <label className="doc-details-dialog-field">
            <span>New File</span>
            <input type="file" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
          </label>
        )}

        <label className="doc-details-dialog-field">
          <span>Date of Issue</span>
          <input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
        </label>

        <label className="doc-details-dialog-field">
          <span>Date of Expiry</span>
          <input type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} />
        </label>

        <div className="doc-details-dialog-actions">
          <Button
            {...DIALOG_BUTTON_PROPS}
            text="Cancel"
            colorScheme="warning-700"
            type="button"
            onClick={onCancel}
          />
          <Button
            {...DIALOG_BUTTON_PROPS}
            text={confirmText}
            colorScheme="success-700"
            type={isSubmitting ? 'disabled' : 'button'}
            onClick={() => onConfirm({ issueDate, expiryDate, file: selectedFile })}
          />
        </div>
      </div>
    </div>
  );
}

export default DocumentDatesDialog;