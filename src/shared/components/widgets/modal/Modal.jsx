import React from 'react';
import SuccessModal from './types/success/SuccessModal';
import ErrorModal from './types/error/ErrorModal';
import WarningModal from './types/warning/WarningModal';
import AnnouncementsModal from './types/announcements/AnnouncementsModal';
import UpdatesModal from './types/updates/UpdatesModal';
import ProgressModal from './types/progress/ProgressModal';
import ActivationModal from './types/activation/ActivationModal';
import AuthenticationModal from './types/authentication/AuthenticationModal';
import OtpModal from './types/otp/OtpModal';
import SplitModal from './types/split/SplitModal';
import FormModal from './types/form/FormModal';
import UnauthorizedModal from './types/unauthorized/UnauthorizedModal';
import FiltersModal from './types/filters/FiltersModal';
import FileUploadModal from './types/fileupload/FileUploadModal';
import HintModal from './types/hint/HintModal';

const MODAL_BY_TYPE = {
  success: SuccessModal,
  error: ErrorModal,
  warning: WarningModal,
  announcements: AnnouncementsModal,
  updates: UpdatesModal,
  progress: ProgressModal,
  activation: ActivationModal,
  authentication: AuthenticationModal,
  otp: OtpModal,
  split: SplitModal,
  form: FormModal,
  unauthorized: UnauthorizedModal,
  filters: FiltersModal,
  fileupload: FileUploadModal,
  hint: HintModal,
};

const Modal = ({ type = 'success', ...props }) => {
  const TypeModal = MODAL_BY_TYPE[type] || SuccessModal;
  return <TypeModal {...props} />;
};

export {
  SuccessModal,
  ErrorModal,
  WarningModal,
  AnnouncementsModal,
  UpdatesModal,
  ProgressModal,
  ActivationModal,
  AuthenticationModal,
  OtpModal,
  SplitModal,
  FormModal,
  UnauthorizedModal,
  FiltersModal,
  FileUploadModal,
  HintModal,
};

export default Modal;
