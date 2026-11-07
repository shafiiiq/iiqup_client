import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import useSigningFlow from '@/features/core/messaging/signature/hooks/useSigningFlow';
import {
  MAINTENANCE_SIGNATURE_SOURCE_KEY,
  MAINTENANCE_SUPERVISOR_SLOT_ID,
} from '../../report/constants/maintenance.report.constant';
import { buildListSignatureDocumentId, getSignatureUrlFromSlot } from '../helper/maintenance.list.signature.helper';

export const useMaintenanceListSigning = ({ registrationNumbers }) => {
  const documentId = useMemo(() => buildListSignatureDocumentId(registrationNumbers), [registrationNumbers]);
  const flow = useSigningFlow({ sourceKey: MAINTENANCE_SIGNATURE_SOURCE_KEY, documentId });
  const { loadSignatures, signatureSlots, handleSignButtonClick } = flow;

  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [isAwaitingSignature, setIsAwaitingSignature] = useState(false);
  const pendingActionRef = useRef(null);

  const signatureUrl = getSignatureUrlFromSlot(signatureSlots[MAINTENANCE_SUPERVISOR_SLOT_ID]);

  useEffect(() => {
    loadSignatures();
  }, [loadSignatures]);

  const runPendingAction = useCallback((resolvedSignatureUrl) => {
    const pendingAction = pendingActionRef.current;
    pendingActionRef.current = null;
    pendingAction?.(resolvedSignatureUrl);
  }, []);

  useEffect(() => {
    if (!isAwaitingSignature || !signatureUrl) return;
    setIsAwaitingSignature(false);
    runPendingAction(signatureUrl);
  }, [isAwaitingSignature, signatureUrl, runPendingAction]);

  const requireSignature = useCallback(
    (onResolved) => {
      if (signatureUrl) {
        onResolved(signatureUrl);
        return;
      }
      pendingActionRef.current = onResolved;
      setIsWarningModalOpen(true);
    },
    [signatureUrl]
  );

  const closeWarningModal = useCallback(() => {
    pendingActionRef.current = null;
    setIsWarningModalOpen(false);
  }, []);

  const signFromWarningModal = useCallback(() => {
    setIsWarningModalOpen(false);
    setIsAwaitingSignature(true);
    handleSignButtonClick();
  }, [handleSignButtonClick]);

  const continueWithoutSignature = useCallback(() => {
    setIsWarningModalOpen(false);
    runPendingAction(null);
  }, [runPendingAction]);

  return {
    flow,
    isWarningModalOpen,
    requireSignature,
    closeWarningModal,
    signFromWarningModal,
    continueWithoutSignature,
  };
};