import Input from '@/shared/components/widgets/input/Input';
import { INPUT_PROPS, REMARKS_TEXTAREA_PROPS, FIRST_CHECKLIST_COLUMN_SIZE } from '../../constants/maintenance.form.constant';
import { isOilOrNormalService } from '../../../helper/maintenance.helper';
import { autocorrectCompletedWord } from '../../helper/maintenance.autocorrect.helper';
import { useSpellChecker } from '../../hooks/useSpellChecker';
import ChecklistColumn from './ChecklistColumn';
import FilterOptionsFields from './FilterOptionsFields';

function ReportSection({ formData, onChange, onStatusChange, onRangeStatusChange }) {
  const totalItems = formData.checklistItems.length;
  const spellChecker = useSpellChecker();

  const handleRemarksChange = (event) => {
    const textarea = event.target;
    const corrected = autocorrectCompletedWord({
      text: textarea.value.toUpperCase(),
      caretPosition: textarea.selectionStart,
      spellChecker,
    });

    onChange({ target: { name: textarea.name, value: corrected.text } });

    requestAnimationFrame(() => textarea.setSelectionRange(corrected.caretPosition, corrected.caretPosition));
  };

  return (
    <div className="fleet maintenance form section">
      <h3 className="fleet maintenance form section-title">Service Report</h3>

      <div className="fleet maintenance form field">
        <Input
          {...INPUT_PROPS}
          {...REMARKS_TEXTAREA_PROPS}
          type="textarea"
          id="remarks"
          name="remarks"
          value={formData.remarks}
          onChange={handleRemarksChange}
          placeholder="Enter remarks…"
          height="140px"
          squircle="30xl"
          fontSize="6xl"
          fullWidth="true"
          rows={5}
          label="Remarks"
        />
      </div>

      {isOilOrNormalService(formData.serviceType) && (
        <FilterOptionsFields formData={formData} onChange={onChange} />
      )}

      <div className="fleet maintenance form checklist-grid">
        <ChecklistColumn
          label={`Items 1-${FIRST_CHECKLIST_COLUMN_SIZE}`}
          items={formData.checklistItems.slice(0, FIRST_CHECKLIST_COLUMN_SIZE)}
          rangeStart={1}
          rangeEnd={FIRST_CHECKLIST_COLUMN_SIZE}
          onStatusChange={onStatusChange}
          onRangeChange={onRangeStatusChange}
        />
        <ChecklistColumn
          label={`Items ${FIRST_CHECKLIST_COLUMN_SIZE + 1}-${totalItems}`}
          items={formData.checklistItems.slice(FIRST_CHECKLIST_COLUMN_SIZE)}
          rangeStart={FIRST_CHECKLIST_COLUMN_SIZE + 1}
          rangeEnd={totalItems}
          onStatusChange={onStatusChange}
          onRangeChange={onRangeStatusChange}
        />
      </div>
    </div>
  );
}

export default ReportSection;