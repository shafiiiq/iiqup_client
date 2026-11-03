import { useState } from 'react';
import { fetchDocumentSignatures, fetchMySignatureStatus, submitSignature } from '../api/signature.api';
import { buildSigningProof } from '../helper/signature.device.proof';
import { SIGNATURE_ERROR_CODE } from '../constants/signature.constant';

const SIGN_OUTCOME = {
  SIGNED: 'signed',
  SKIPPED: 'skipped',
  FAILED: 'failed',
  ACTIVATION_NEEDED: 'activation_needed',
};

const signSingleDocument = async ({ sourceKey, documentId }) => {
  try {
    const viewResponse = await fetchDocumentSignatures(sourceKey, documentId);
    const viewBody = await viewResponse.json();
    const { slots } = viewBody.data;

    const slot = slots.find((candidate) => candidate.canSign);
    if (!slot) return SIGN_OUTCOME.SKIPPED;

    const hasEarlierUnsignedSlot = slots.some((candidate) => candidate.order < slot.order && !candidate.isSigned);
    if (hasEarlierUnsignedSlot) return SIGN_OUTCOME.SKIPPED;

    const { challengeId, proof } = await buildSigningProof({ sourceKey, documentId, slotId: slot.slotId });
    const response = await submitSignature({
      sourceKey,
      documentId,
      slotId: slot.slotId,
      override: false,
      challengeId,
      proof,
    });
    const body = await response.json();
    return body.requireOverride ? SIGN_OUTCOME.SKIPPED : SIGN_OUTCOME.SIGNED;
  } catch (error) {
    const errorCode = error.body?.errors?.code;
    const isActivationError =
      errorCode === SIGNATURE_ERROR_CODE.DEVICE_NOT_ACTIVATED || errorCode === SIGNATURE_ERROR_CODE.DEVICE_PROOF_INVALID;
    if (isActivationError) return SIGN_OUTCOME.ACTIVATION_NEEDED;
    if (errorCode === SIGNATURE_ERROR_CODE.ALREADY_SIGNED) return SIGN_OUTCOME.SKIPPED;
    console.error('[useSignAllDocuments] signSingleDocument:', error);
    return SIGN_OUTCOME.FAILED;
  }
};

const useSignAllDocuments = ({ sourceKey, documentIds, onCompleted }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSigningAll, setIsSigningAll] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [summary, setSummary] = useState(null);
  const [notice, setNotice] = useState(null);

  const requestSignAll = async () => {
    if (documentIds.length === 0 || isSigningAll) return;

    try {
      const statusResponse = await fetchMySignatureStatus();
      const statusBody = await statusResponse.json();
      if (!statusBody.data.isDeviceActivated) {
        setNotice({
          title: 'Activate E-Signature',
          message: 'This browser is not activated for signing yet. Open any document and use Activate E-Signs first.',
        });
        return;
      }
      setIsConfirmOpen(true);
    } catch (error) {
      setNotice({ title: 'Sign All Failed', message: error.message || 'Signing status could not be loaded.' });
    }
  };

  const confirmSignAll = async () => {
    setIsConfirmOpen(false);
    setIsSigningAll(true);
    setProgress({ done: 0, total: documentIds.length });

    const result = { signed: 0, skipped: 0, failed: 0, needsActivation: false };

    for (let index = 0; index < documentIds.length; index += 1) {
      const outcome = await signSingleDocument({ sourceKey, documentId: documentIds[index] });

      if (outcome === SIGN_OUTCOME.ACTIVATION_NEEDED) {
        result.needsActivation = true;
        break;
      }
      if (outcome === SIGN_OUTCOME.SIGNED) result.signed += 1;
      else if (outcome === SIGN_OUTCOME.SKIPPED) result.skipped += 1;
      else result.failed += 1;

      setProgress({ done: index + 1, total: documentIds.length });
    }

    setIsSigningAll(false);
    setSummary(result);
    if (result.signed > 0) onCompleted();
  };

  return {
    pendingCount: documentIds.length,
    isConfirmOpen,
    isSigningAll,
    progress,
    summary,
    notice,
    requestSignAll,
    confirmSignAll,
    cancelConfirm: () => setIsConfirmOpen(false),
    closeSummary: () => setSummary(null),
    closeNotice: () => setNotice(null),
  };
};

export default useSignAllDocuments;