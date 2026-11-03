import { RECORD_FORM_SECTION_ORDER, RECORD_FORM_SECTION_LABELS } from '../constants/maintenance.record.form.constant';
import { getCardMissingFieldsBySection, cardHasMissingFields } from './maintenance.record.form.helper';

export const buildRecordFormTabItems = (cards) =>
  cards.map((card, index) => {
    const missingBySection = getCardMissingFieldsBySection(card);

    return {
      key: card.id,
      label: `Record ${index + 1}${card.formData.regNo ? ` — ${card.formData.regNo}` : ''}`,
      warn: cardHasMissingFields(card),
      children: RECORD_FORM_SECTION_ORDER.map((sectionKey) => ({
        key: sectionKey,
        label: RECORD_FORM_SECTION_LABELS[sectionKey],
        warn: missingBySection[sectionKey].length > 0,
      })),
    };
  });