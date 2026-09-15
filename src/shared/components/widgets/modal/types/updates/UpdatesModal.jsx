import React from 'react';
import ModalBase from '../../ModalBase';
import UpdatesList from '../../fragments/UpdatesList';
import { DEFAULT_MODAL_MODE } from '../../modalModes';
import './UpdatesModal.css';

const UpdatesModal = ({
  isOpen,
  onClose,
  mode = DEFAULT_MODAL_MODE,
  title,
  updatesList = [],
  buttonText,
  onButtonClick,
  modalWidth,
  modalHeight,
}) => (
  <ModalBase
    isOpen={isOpen}
    onClose={onClose}
    mode={mode}
    type="updates"
    title={title}
    showMessage={false}
    buttonText={buttonText}
    onButtonClick={onButtonClick}
    modalWidth={modalWidth}
    modalHeight={modalHeight}
  >
    {updatesList.length > 0 && <UpdatesList items={updatesList} />}
  </ModalBase>
);

export default UpdatesModal;
