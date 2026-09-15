import React from 'react';
import ModalBase from '../../ModalBase';
import { DEFAULT_MODAL_MODE } from '../../modalModes';

const SuccessModal = ({
  isOpen,
  onClose,
  mode = DEFAULT_MODAL_MODE,
  title,
  message,
  buttonText,
  onButtonClick,
  secondaryButtonText,
  onSecondaryClick,
  autoClose = true,
  autoCloseDelay = 4000,
  modalWidth,
  modalHeight,
}) => (
  <ModalBase
    isOpen={isOpen}
    onClose={onClose}
    mode={mode}
    type="success"
    title={title}
    message={message}
    buttonText={buttonText}
    onButtonClick={onButtonClick}
    secondaryButtonText={secondaryButtonText}
    onSecondaryClick={onSecondaryClick}
    autoClose={autoClose}
    autoCloseDelay={autoCloseDelay}
    modalWidth={modalWidth}
    modalHeight={modalHeight}
  />
);

export default SuccessModal;
