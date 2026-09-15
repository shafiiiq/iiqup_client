import React from 'react';
import ModalBase from '../../ModalBase';
import TextInputField from '../../fragments/TextInputField';
import { DEFAULT_MODAL_MODE } from '../../modalModes';
import './ActivationModal.css';

const ActivationModal = ({
  isOpen,
  onClose,
  mode = DEFAULT_MODAL_MODE,
  title,
  message,
  inputValue,
  onInputChange,
  inputPlaceholder,
  inputMaxLength,
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
    type="activation"
    title={title}
    showMessage={false}
    deviceInfo={deviceInfo}
    buttonText={buttonText}
    onButtonClick={onButtonClick}
    buttonDisabled={Boolean(inputError)}
    secondaryButtonText={secondaryButtonText}
    onSecondaryClick={onSecondaryClick}
    submitOnEnter
    onSubmit={inputError ? null : onButtonClick}
    modalWidth={modalWidth}
    modalHeight={modalHeight}
  >
    <TextInputField
      label={message}
      value={inputValue}
      onChange={onInputChange}
      placeholder={inputPlaceholder}
      maxLength={inputMaxLength}
      error={inputError}
    />
  </ModalBase>
);

export default ActivationModal;
