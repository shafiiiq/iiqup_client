import { MAINTENANCE_LIST_SIGNATURE_ALL_EQUIPMENT_DOCUMENT_ID } from '../constants/maintenance.list.constant';

export const getSignatureUrlFromSlot = (signatureSlot) => signatureSlot?.imageUrl || '';

export const buildListSignatureDocumentId = (registrationNumbers) =>
  registrationNumbers.length > 0
    ? registrationNumbers.join(',')
    : MAINTENANCE_LIST_SIGNATURE_ALL_EQUIPMENT_DOCUMENT_ID;