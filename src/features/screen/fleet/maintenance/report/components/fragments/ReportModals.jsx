import Modal from '@/shared/components/widgets/modal/Modal';

function ReportModals({ showDeleteModal, onDeleteClose, onDeleteConfirm, showLoadingModal, loadingMessage }) {
  return (
    <>
      <Modal
        isOpen={showDeleteModal}
        onClose={onDeleteClose}
        type="error"
        title="Delete Record?"
        message="Are you sure you want to delete this record? This action cannot be undone."
        buttonText="Delete"
        secondaryButtonText="Cancel"
        onButtonClick={onDeleteConfirm}
        onSecondaryClick={onDeleteClose}
      />
      <Modal
        isOpen={showLoadingModal}
        onClose={() => {}}
        type="progress"
        title="Processing..."
        message={loadingMessage}
        progress={100}
        preventClose
      />
    </>
  );
}

export default ReportModals;