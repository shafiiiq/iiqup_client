import React from 'react';
import ModalBase from '../../ModalBase';
import { DEFAULT_MODAL_MODE } from '../../modalModes';
import './UnauthorizedModal.css';

const UnauthorizedModal = ({
  isOpen,
  onClose,
  mode = DEFAULT_MODAL_MODE,
  title,
  message,
  unauthorizedReason,
  contactEmail = 'support@example.com',
  buttonText,
  onButtonClick,
  modalWidth,
  modalHeight,
}) => (
  <ModalBase
    isOpen={isOpen}
    onClose={onClose}
    mode={mode}
    type="unauthorized"
    title={title}
    showMessage={false}
    buttonText={buttonText}
    onButtonClick={onButtonClick}
    modalWidth={modalWidth}
    modalHeight={modalHeight}
  >
    <div className="shared widget modal unauthorized-section">
      <div className="shared widget modal unauthorized-icon">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
        </svg>
      </div>
      <p className="shared widget modal message">{message || 'You do not have permission to access this resource.'}</p>
      {unauthorizedReason && (
        <div className="shared widget modal unauthorized-reason">
          <strong>Reason:</strong> {unauthorizedReason}
        </div>
      )}
      {contactEmail && (
        <div className="shared widget modal unauthorized-contact">
          Need access? Contact <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </div>
      )}
    </div>
  </ModalBase>
);

export default UnauthorizedModal;
