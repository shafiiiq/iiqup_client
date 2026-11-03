import { useCallback, useMemo, useState } from 'react';
import useDocumentSignatures from './useDocumentSignatures';
import useSignatureActivation from './useSignatureActivation';
import {
    requestSignatureDelegation,
    fetchGivenSignatureDelegations,
    revokeSignatureDelegation,
} from '../api/signature.delegation.api';
import {
    SIGNATURE_ERROR_CODE,
    SIGNATURE_ACTIVATION_CODE_LENGTH,
    SIGNATURE_ACTIVATION_KIND,
} from '../constants/signature.constant';

const ACTIVATION_FAILURE_MESSAGES = {
    denied: 'The request was denied on your phone.',
    expired: 'The approval request expired. Please try again.',
};

const useSigningFlow = ({ sourceKey, documentId }) => {
    const signatures = useDocumentSignatures({ sourceKey, documentId });

    const [pendingSlotId, setPendingSlotId] = useState(null);
    const [signResult, setSignResult] = useState(null);
    const [showSignConfirmModal, setShowSignConfirmModal] = useState(false);
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [unsignedPositions, setUnsignedPositions] = useState([]);
    const [showActivationModal, setShowActivationModal] = useState(false);
    const [activationKey, setActivationKey] = useState('');
    const [activationError, setActivationError] = useState('');
    const [activationLoading, setActivationLoading] = useState(false);
    const [givenDelegations, setGivenDelegations] = useState([]);
    const [showDelegationNotice, setShowDelegationNotice] = useState(false);
    const [delegationRequestSlot, setDelegationRequestSlot] = useState(null);
    const [alertModal, setAlertModal] = useState(null);

    const showAlert = (title, message, type = 'warning') => setAlertModal({ title, message, type });

    const signatureActivation = useSignatureActivation({
        onApproved: () => {
            signatures.refreshStatus();
            setSignResult('activated');
        },
        onFailed: (reason, message) =>
            showAlert('Activation Failed', ACTIVATION_FAILURE_MESSAGES[reason] || message || 'The activation could not be completed.', 'error'),
    });

    const signatureStatus = signatures.status;
    const isActivationAvailable = Boolean(
        signatureStatus?.hasSignature && !signatureStatus?.isDeviceActivated && signatureStatus?.hasPendingActivation
    );
    const canRequestFamilyAccess = Boolean(signatureStatus?.canRequestFamilyAccess) && !isActivationAvailable;
    const signatureSlots = useMemo(
        () => Object.fromEntries(signatures.slots.map((slot) => [slot.slotId, slot])),
        [signatures.slots]
    );

    const openActivationModal = () => {
        setActivationKey('');
        setActivationError('');
        setShowActivationModal(true);
    };

    const handleActivation = async () => {
        if (activationKey.length !== SIGNATURE_ACTIVATION_CODE_LENGTH) {
            setActivationError(`Please enter a valid ${SIGNATURE_ACTIVATION_CODE_LENGTH}-digit activation key`);
            return;
        }
        setActivationLoading(true);
        setActivationError('');
        const startResult = await signatureActivation.start({ activationCode: activationKey });
        if (startResult.ok) {
            setShowActivationModal(false);
            setActivationKey('');
        } else {
            setActivationError(startResult.message);
        }
        setActivationLoading(false);
    };

    const requestFamilyAccess = async () => {
        const startResult = await signatureActivation.start({ kind: SIGNATURE_ACTIVATION_KIND.FAMILY });
        if (!startResult.ok) showAlert('Request Failed', startResult.message, 'error');
    };

    const handleSignButtonClick = (requestedSlotId) => {
        if (!signatureStatus) {
            showAlert('Please Wait', 'Signature details are still loading. Please try again in a moment.');
            return;
        }
        if (!signatureStatus.hasSignature) {
            showAlert('No Signature Registered', 'No signature is registered for your account. Please contact the administrator.');
            return;
        }

        const targetSlotId =
            typeof requestedSlotId === 'string'
                ? requestedSlotId
                : (signatures.slots.find((slot) => slot.canSign) || signatures.slots.find((slot) => slot.canRequestDelegation))?.slotId;
        const slot = signatureSlots[targetSlotId];

        if (!slot) {
            showAlert('Nothing To Sign', 'There is no signature position available for you on this document.');
            return;
        }
        if (slot.isSigned) return;

        if (!slot.canSign) {
            if (slot.canRequestDelegation) setDelegationRequestSlot(slot);
            else if (slot.hasPendingDelegation) showAlert('Request Pending', 'Your permission request is waiting for the position owner to approve it.');
            else showAlert('Not Allowed', 'You cannot sign this position.');
            return;
        }

        setPendingSlotId(slot.slotId);

        if (!signatureStatus.isDeviceActivated) {
            if (signatureStatus.hasPendingActivation) openActivationModal();
            else if (signatureStatus.canRequestFamilyAccess) showAlert('Activation Required', 'Request family access to sign from this browser.');
            else showAlert('Activation Required', 'Ask the administrator for a new activation code.');
            return;
        }
        setShowSignConfirmModal(true);
    };

    const handleSignFailure = (result) => {
        if (result.code === SIGNATURE_ERROR_CODE.ALREADY_SIGNED) {
            setSignResult('already_signed');
            signatures.load();
            return;
        }
        if (result.code === SIGNATURE_ERROR_CODE.DOCUMENT_NOT_READY) {
            setSignResult('not_uploaded');
            return;
        }
        if (result.code === SIGNATURE_ERROR_CODE.DEVICE_PROOF_INVALID || result.code === SIGNATURE_ERROR_CODE.DEVICE_NOT_ACTIVATED) {
            signatures.refreshStatus();
            showAlert('Activation Required', 'This browser must be activated before signing.');
            return;
        }
        showAlert('Signing Failed', result.message || 'The document could not be signed. Please try again.', 'error');
    };

    const performSign = async (override) => {
        const result = await signatures.sign({ slotId: pendingSlotId, override });

        if (result.outcome === 'override_required') {
            setUnsignedPositions(result.unsignedPositions);
            setShowOverrideModal(true);
            return;
        }
        if (result.outcome === 'signed') {
            setPendingSlotId(null);
            setSignResult('success');
            return;
        }
        handleSignFailure(result);
    };

    const loadGivenDelegations = async () => {
        try {
            const response = await fetchGivenSignatureDelegations();
            const body = await response.json();
            return body.data || [];
        } catch (error) {
            console.error('[useSigningFlow] loadGivenDelegations:', error);
            return [];
        }
    };

    const handleConfirmSign = async (override = false) => {
        setShowSignConfirmModal(false);
        setShowOverrideModal(false);
        if (!pendingSlotId) return;

        if (!override) {
            const delegations = await loadGivenDelegations();
            if (delegations.length > 0) {
                setGivenDelegations(delegations);
                setShowDelegationNotice(true);
                return;
            }
        }
        await performSign(override);
    };

    const handleRevokeDelegationsAndSign = async () => {
        setShowDelegationNotice(false);
        try {
            await Promise.all(givenDelegations.map((delegation) => revokeSignatureDelegation(delegation.delegationId)));
        } catch (error) {
            showAlert('Revoke Failed', error.message || 'The permission could not be revoked.', 'error');
            return;
        }
        await performSign(false);
    };

    const handleSkipDelegationNoticeAndSign = async () => {
        setShowDelegationNotice(false);
        await performSign(false);
    };

    const submitDelegationRequest = async () => {
        const slot = delegationRequestSlot;
        setDelegationRequestSlot(null);
        if (!slot) return;
        try {
            const response = await requestSignatureDelegation({ sourceKey, documentId, slotId: slot.slotId });
            const body = await response.json();
            await signatures.load();
            if (body.data?.status === 'active') {
                showAlert('Already Allowed', 'You already have permission to sign this position.');
                return;
            }
            setSignResult('delegation_requested');
        } catch (error) {
            showAlert('Request Failed', error.message || 'The request could not be sent.', 'error');
        }
    };

    return {
        status: signatureStatus,
        signatureSlots,
        isSigning: signatures.isSigning,
        loadSignatures: signatures.load,
        isActivationAvailable,
        canRequestFamilyAccess,
        openActivationModal,
        requestFamilyAccess,
        handleSignButtonClick,
        handleConfirmSign,
        handleRevokeDelegationsAndSign,
        handleSkipDelegationNoticeAndSign,
        submitDelegationRequest,
        handleActivation,
        signResult,
        setSignResult,
        showSignConfirmModal,
        setShowSignConfirmModal,
        showOverrideModal,
        setShowOverrideModal,
        unsignedPositions,
        showActivationModal,
        setShowActivationModal,
        activationKey,
        setActivationKey,
        activationError,
        activationLoading,
        isWaitingForApproval: signatureActivation.isWaiting,
        activationMatchNumber: signatureActivation.matchNumber,
        cancelActivation: signatureActivation.cancel,
        givenDelegations,
        showDelegationNotice,
        setShowDelegationNotice,
        delegationRequestSlot,
        setDelegationRequestSlot,
        alertModal,
        setAlertModal,
    };
};

export default useSigningFlow;