import React from 'react';
import ModalBase from '../../ModalBase';
import { DEFAULT_MODAL_MODE } from '../../modalModes';

const WarningModal = ({
  isOpen,
  onClose,
  mode = DEFAULT_MODAL_MODE,
  title,
  message,
  buttonText,
  onButtonClick,
  buttonDisabled,
  secondaryButtonText,
  onSecondaryClick,
  secondaryButtonDisabled,
  autoClose = false,
  autoCloseDelay = 4000,
  modalWidth,
  modalHeight,
}) => (
  <ModalBase
    isOpen={isOpen}
    onClose={onClose}
    mode={mode}
    type="warning"
    title={title}
    message={message}
    buttonText={buttonText}
    onButtonClick={onButtonClick}
    buttonDisabled={buttonDisabled}
    secondaryButtonText={secondaryButtonText}
    onSecondaryClick={onSecondaryClick}
    secondaryButtonDisabled={secondaryButtonDisabled}
    autoClose={autoClose}
    autoCloseDelay={autoCloseDelay}
    modalWidth={modalWidth}
    modalHeight={modalHeight}
  />
);

export default WarningModal;
