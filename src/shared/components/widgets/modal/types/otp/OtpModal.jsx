import React from 'react';
import ModalBase from '../../ModalBase';
import CellInputField from '../../fragments/CellInputField';
import { DEFAULT_MODAL_MODE } from '../../modalModes';
import './OtpModal.css';

const OtpModal = ({
  isOpen,
  onClose,
  mode = DEFAULT_MODAL_MODE,
  title,
  message,
  cellCount = 6,
  inputValue,
  onInputChange,
  inputError,
  deviceInfo,
  buttonText,
  onButtonClick,
  secondaryButtonText,
  onSecondaryClick,
  modalWidth,
  modalHeight,
}) => (
  <ModalBase
    isOpen={isOpen}
    onClose={onClose}
    mode={mode}
    type="otp"
    title={title}
    showMessage={false}
    deviceInfo={deviceInfo}
    buttonText={buttonText}
    onButtonClick={onButtonClick}
    buttonDisabled={Boolean(inputError)}
    secondaryButtonText={secondaryButtonText}
    onSecondaryClick={onSecondaryClick}
    modalWidth={modalWidth}
    modalHeight={modalHeight}
  >
    <CellInputField label={message} value={inputValue} onChange={onInputChange} cellCount={cellCount} error={inputError} />
  </ModalBase>
);

export default OtpModal;
