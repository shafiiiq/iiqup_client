import Modal from '@/shared/components/widgets/modal/Modal';
import { SIGNATURE_ACTIVATION_CODE_LENGTH } from '../constants/signature.constant';

const formatDate = (value) => new Date(value).toLocaleDateString('en-GB');

const buildDelegationNoticeMessage = (givenDelegations) => {
    const lines = givenDelegations.map(
        (delegation) => `${delegation.person.name} - since ${formatDate(delegation.resolvedAt || delegation.createdAt)} (${delegation.slotLabel})`
    );
    return `You allowed these people to sign your position with their own signature:\n\n${lines.join('\n')}\n\nYou can revoke this access now, or skip and continue signing.`;
};

function SigningModals({ flow, documentLabel }) {
    return (
        <>
            <Modal
                isOpen={flow.showActivationModal}
                onClose={() => flow.setShowActivationModal(false)}
                type="activation"
                title="Activate Signature"
                message={`Enter your ${SIGNATURE_ACTIVATION_CODE_LENGTH}-digit activation key to activate signing on this browser`}
                showInput
                useCellInput
                cellCount={SIGNATURE_ACTIVATION_CODE_LENGTH}
                inputValue={flow.activationKey}
                onInputChange={flow.setActivationKey}
                inputError={flow.activationError}
                buttonText={flow.activationLoading ? 'Activating...' : 'Activate'}
                onButtonClick={flow.handleActivation}
                preventClose={flow.activationLoading}
            />

            <Modal
                isOpen={flow.isWaitingForApproval}
                onClose={flow.cancelActivation}
                type="warning"
                title="Approve on your phone"
                message={`Open Al Ansari Connect on your main phone and approve the request.\n\nChoose this number on your phone: ${flow.activationMatchNumber}`}
                buttonText="Cancel Request"
                onButtonClick={flow.cancelActivation}
            />

            <Modal
                isOpen={flow.signResult === 'activated'}
                onClose={() => flow.setSignResult(null)}
                type="success"
                title="Browser Activated"
                message="This browser is now activated for signing."
                buttonText="OK"
                onButtonClick={() => flow.setSignResult(null)}
                autoClose
                autoCloseDelay={3000}
            />

            <Modal
                isOpen={flow.showSignConfirmModal}
                onClose={() => flow.setShowSignConfirmModal(false)}
                type="warning"
                title="Confirm Signature"
                message={`You are about to sign this ${documentLabel} document. This action cannot be undone.`}
                buttonText="Confirm & Sign"
                onButtonClick={() => flow.handleConfirmSign(false)}
                secondaryButtonText="Cancel"
                onSecondaryClick={() => flow.setShowSignConfirmModal(false)}
            />

            <Modal
                isOpen={flow.showDelegationNotice}
                onClose={() => flow.setShowDelegationNotice(false)}
                type="warning"
                title="Permission Given To Others"
                message={buildDelegationNoticeMessage(flow.givenDelegations)}
                buttonText="Revoke & Sign"
                onButtonClick={flow.handleRevokeDelegationsAndSign}
                secondaryButtonText="Skip & Sign"
                onSecondaryClick={flow.handleSkipDelegationNoticeAndSign}
            />

            <Modal
                isOpen={Boolean(flow.delegationRequestSlot)}
                onClose={() => flow.setDelegationRequestSlot(null)}
                type="warning"
                title="Request Permission"
                message={`The ${flow.delegationRequestSlot?.label || ''} position belongs to someone else. Ask the owner to let you sign it with your own signature?`}
                buttonText="Send Request"
                onButtonClick={flow.submitDelegationRequest}
                secondaryButtonText="Cancel"
                onSecondaryClick={() => flow.setDelegationRequestSlot(null)}
            />

            <Modal
                isOpen={flow.showOverrideModal}
                onClose={() => flow.setShowOverrideModal(false)}
                type="warning"
                title="Signatures Pending"
                message={`These positions have not signed yet:\n\n${flow.unsignedPositions.join(', ')}\n\nYou can wait for them, or override and sign now.`}
                buttonText="Override & Sign"
                onButtonClick={() => flow.handleConfirmSign(true)}
                secondaryButtonText="Wait"
                onSecondaryClick={() => flow.setShowOverrideModal(false)}
            />

            <Modal
                isOpen={flow.signResult === 'not_uploaded'}
                onClose={() => flow.setSignResult(null)}
                type="warning"
                title="Not Ready For Signing"
                message={`This ${documentLabel} has not been sent for approval yet.`}
                buttonText="OK"
                onButtonClick={() => flow.setSignResult(null)}
            />

            <Modal
                isOpen={flow.signResult === 'already_signed'}
                onClose={() => flow.setSignResult(null)}
                type="warning"
                title="Already Signed"
                message="This signature position has already been signed on this document."
                buttonText="OK"
                onButtonClick={() => flow.setSignResult(null)}
            />

            <Modal
                isOpen={flow.signResult === 'success'}
                onClose={() => flow.setSignResult(null)}
                type="success"
                title="Document Signed"
                message="Your signature has been recorded successfully."
                buttonText="OK"
                onButtonClick={() => flow.setSignResult(null)}
                autoClose
                autoCloseDelay={3000}
            />

            <Modal
                isOpen={flow.signResult === 'delegation_requested'}
                onClose={() => flow.setSignResult(null)}
                type="success"
                title="Request Sent"
                message="The position owner was notified. You can sign once they approve."
                buttonText="OK"
                onButtonClick={() => flow.setSignResult(null)}
                autoClose
                autoCloseDelay={3000}
            />

            <Modal
                isOpen={Boolean(flow.alertModal)}
                onClose={() => flow.setAlertModal(null)}
                type={flow.alertModal?.type || 'warning'}
                title={flow.alertModal?.title || ''}
                message={flow.alertModal?.message || ''}
                buttonText="OK"
                onButtonClick={() => flow.setAlertModal(null)}
            />
        </>
    );
}

export default SigningModals;