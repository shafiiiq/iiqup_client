import {
  MAINTENANCE_LIST_SIGNATURE_DOCUMENT_ID_PREFIX,
  MAINTENANCE_LIST_SIGNATURE_ALL_EQUIPMENT_LABEL,
} from '../constants/maintenance.list.constant';

export const getSignatureUrlFromSlot = (signatureSlot) => signatureSlot?.imageUrl || '';

export const buildListSignatureDocumentId = (registrationNumbers, signingSessionId) => {
  const scopeLabel =
    registrationNumbers.length > 0 ? registrationNumbers.join(',') : MAINTENANCE_LIST_SIGNATURE_ALL_EQUIPMENT_LABEL;
  return `${MAINTENANCE_LIST_SIGNATURE_DOCUMENT_ID_PREFIX}${scopeLabel}-${signingSessionId}`;
};