import React from 'react';
import ModalBase from '../../ModalBase';
import ProgressBar from '../../fragments/ProgressBar';
import { getModalPalette } from '../../modalPalette';
import { DEFAULT_MODAL_MODE } from '../../modalModes';
import './ProgressModal.css';

const ProgressModal = ({
  isOpen,
  onClose,
  mode = DEFAULT_MODAL_MODE,
  title,
  message,
  progress = 0,
  progressText = '',
  modalWidth,
  modalHeight,
}) => {
  const palette = getModalPalette('progress');

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      type="progress"
      title={title}
      showMessage={false}
      closable={false}
      modalWidth={modalWidth}
      modalHeight={modalHeight}
    >
      <ProgressBar progress={progress} progressText={progressText} accentColor={palette.accent} />
      {message && <p className="shared widget modal message progress-message">{message}</p>}
    </ModalBase>
  );
};

export default ProgressModal;
