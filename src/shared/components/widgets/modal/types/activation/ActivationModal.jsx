import React from 'react';
import ModalBase from '../../ModalBase';
import CellInputField from '../../fragments/CellInputField';
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
  cellCount = 20,
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
    secondaryButtonText={secondaryButtonText}
    onSecondaryClick={onSecondaryClick}
    submitOnEnter
    onSubmit={onButtonClick}
    modalWidth={modalWidth}
    modalHeight={modalHeight}
  >
    <CellInputField
      label={message}
      value={inputValue}
      onChange={onInputChange}
      cellCount={cellCount}
      error={inputError}
    />
  </ModalBase>
);

export default ActivationModal;
