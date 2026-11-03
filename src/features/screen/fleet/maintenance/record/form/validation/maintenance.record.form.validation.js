import {
  RECORD_FORM_SECTIONS,
  RECORD_FORM_SECTION_ORDER,
  RECORD_SUBMIT_STATUS,
} from '../constants/maintenance.record.form.constant';
import {
  getCardMissingFieldsBySection,
  hasUploadingAttachment,
  hasFailedAttachment,
} from '../helper/maintenance.record.form.helper';

export const validateRecordCards = (cards) => {
  for (let index = 0; index < cards.length; index++) {
    const card = cards[index];
    if (card.submitStatus === RECORD_SUBMIT_STATUS.SUCCESS) continue;

    const label = `Record #${index + 1}`;
    const missingBySection = getCardMissingFieldsBySection(card);
    const incompleteSection = RECORD_FORM_SECTION_ORDER.find((section) => missingBySection[section].length > 0);

    if (incompleteSection) {
      return { cardId: card.id, section: incompleteSection, message: `${label}: please fill all required fields` };
    }
    if (hasUploadingAttachment(card)) {
      return {
        cardId: card.id,
        section: RECORD_FORM_SECTIONS.ATTACHMENTS,
        message: `${label}: wait for attachment uploads to finish`,
      };
    }
    if (hasFailedAttachment(card)) {
      return {
        cardId: card.id,
        section: RECORD_FORM_SECTIONS.ATTACHMENTS,
        message: `${label}: remove failed attachment uploads`,
      };
    }
  }

  return null;
};