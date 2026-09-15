import React from 'react';
import ModalBase from '../../ModalBase';
import { DEFAULT_MODAL_MODE } from '../../modalModes';

const AnnouncementsModal = ({
  isOpen,
  onClose,
  mode = DEFAULT_MODAL_MODE,
  title,
  message,
  buttonText,
  onButtonClick,
  modalWidth,
  modalHeight,
}) => (
  <ModalBase
    isOpen={isOpen}
    onClose={onClose}
    mode={mode}
    type="announcements"
    title={title}
    message={message}
    buttonText={buttonText}
    onButtonClick={onButtonClick}
    modalWidth={modalWidth}
    modalHeight={modalHeight}
  />
);

export default AnnouncementsModal;
