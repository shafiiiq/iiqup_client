import React from 'react';
import ModalBase from '../../ModalBase';
import TextInputField from '../../fragments/TextInputField';
import CellInputField from '../../fragments/CellInputField';
import { DEFAULT_MODAL_MODE } from '../../modalModes';
import './AuthenticationModal.css';

const AuthenticationModal = ({
  isOpen,
  onClose,
  mode = DEFAULT_MODAL_MODE,
  title,
  message,
  useCellInput = true,
  cellCount = 6,
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
    type="authentication"
    title={title}
    showMessage={false}
    deviceInfo={deviceInfo}
    buttonText={buttonText}
    onButtonClick={onButtonClick}
    buttonDisabled={Boolean(inputError)}
    secondaryButtonText={secondaryButtonText}
    onSecondaryClick={onSecondaryClick}
    submitOnEnter={!useCellInput}
    onSubmit={inputError ? null : onButtonClick}
    modalWidth={modalWidth}
    modalHeight={modalHeight}
  >
    {useCellInput ? (
      <CellInputField label={message} value={inputValue} onChange={onInputChange} cellCount={cellCount} error={inputError} />
    ) : (
      <TextInputField
        label={message}
        value={inputValue}
        onChange={onInputChange}
        placeholder={inputPlaceholder}
        maxLength={inputMaxLength}
        error={inputError}
      />
    )}
  </ModalBase>
);

export default AuthenticationModal;
