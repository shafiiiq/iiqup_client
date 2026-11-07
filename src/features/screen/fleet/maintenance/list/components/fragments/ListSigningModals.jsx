import Modal from '@/shared/components/widgets/modal/Modal';
import SigningModals from '@/features/core/messaging/signature/components/SigningModals';

function ListSigningModals({ signing }) {
  return (
    <>
      <Modal
        isOpen={signing.isWarningModalOpen}
        onClose={signing.closeWarningModal}
        type="warning"
        title="Document Not Signed"
        message="You can sign the document, or print without a signature and sign it by hand."
        buttonText="Sign Document"
        secondaryButtonText="Continue Without Signature"
        onButtonClick={signing.signFromWarningModal}
        onSecondaryClick={signing.continueWithoutSignature}
      />
      <SigningModals flow={signing.flow} documentLabel="Maintenance List" />
    </>
  );
}

export default ListSigningModals;