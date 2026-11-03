import {
  buildDefaultFormData,
  buildEmptyHistory,
  buildChecklistForServiceType,
  applyOilChecklistDescriptions,
  recalculateHistoryForServiceType,
  getMissingFieldsBySection,
  createLocalId,
} from '../../../form/helper/maintenance.form.helper';
import { isOilOrNormalService } from '../../../helper/maintenance.helper';
import { FORM_SECTIONS, OIL_FILTER_OPTIONS } from '../../../form/constants/maintenance.form.constant';
import {
  RECORD_FORM_SECTIONS,
  RECORD_SUBMIT_STATUS,
  INITIAL_CARDS_COUNT,
} from '../constants/maintenance.record.form.constant';

export const buildRecordCard = ({ regNo = '', equipment = '', operator = '' } = {}) => ({
  id: createLocalId(),
  formData: { ...buildDefaultFormData(regNo), equipment, operator },
  history: buildEmptyHistory(),
  attachments: [],
  submitStatus: RECORD_SUBMIT_STATUS.IDLE,
  submitError: '',
});

export const buildInitialRecordCards = (regNo) =>
  Array.from({ length: INITIAL_CARDS_COUNT }, () => buildRecordCard({ regNo: regNo || '' }));

export const applyFormFieldChange = (formData, fieldName, value) => {
  const updatedFormData = { ...formData, [fieldName]: value };
  const isOilFilterField = OIL_FILTER_OPTIONS.some(({ key }) => key === fieldName);
  if (!isOilFilterField || !isOilOrNormalService(updatedFormData.serviceType)) return updatedFormData;
  return {
    ...updatedFormData,
    checklistItems: applyOilChecklistDescriptions(updatedFormData.checklistItems, updatedFormData),
  };
};

export const applyServiceTypeSelection = (card, serviceType) => ({
  ...card,
  formData: {
    ...card.formData,
    serviceType,
    checklistItems: buildChecklistForServiceType(serviceType, card.formData),
  },
  history: recalculateHistoryForServiceType(card.history, serviceType),
});

export const applyEquipmentAutofill = (formData, autofill) => ({
  ...formData,
  equipment: autofill.equipment || formData.equipment,
  operator: autofill.operator || formData.operator,
});

export const setChecklistItemStatus = (formData, itemId, status) => ({
  ...formData,
  checklistItems: formData.checklistItems.map((item) => (item.id === itemId ? { ...item, status } : item)),
});

export const setChecklistRangeStatus = (formData, rangeStart, rangeEnd, status) => ({
  ...formData,
  checklistItems: formData.checklistItems.map((item) =>
    item.id >= rangeStart && item.id <= rangeEnd ? { ...item, status } : item
  ),
});

export const getCardMissingFieldsBySection = (card) => {
  const missingBySection = getMissingFieldsBySection(card.formData, card.history);
  return {
    ...missingBySection,
    [RECORD_FORM_SECTIONS.EQUIPMENT]: missingBySection[FORM_SECTIONS.DETAILS].filter(
      (fieldName) => fieldName === 'regNo'
    ),
    [FORM_SECTIONS.DETAILS]: missingBySection[FORM_SECTIONS.DETAILS].filter((fieldName) => fieldName !== 'regNo'),
  };
};

export const cardHasMissingFields = (card) =>
  Object.values(getCardMissingFieldsBySection(card)).some((fieldNames) => fieldNames.length > 0);

export const hasUploadingAttachment = (card) => card.attachments.some((attachment) => attachment.status === 'uploading');

export const hasFailedAttachment = (card) => card.attachments.some((attachment) => attachment.status === 'error');

export const getCompletedSessionIds = (card) =>
  card.attachments.filter((attachment) => attachment.status === 'done').map((attachment) => attachment.sessionId);