import Button from '@/shared/components/widgets/button/Button';
import Input from '@/shared/components/widgets/input/Input';
import { CHECKLIST_STATUS } from '../../../constants/maintenance.constant';
import { RADIO_BUTTON_PROPS, BUTTON_PROPS } from '../../constants/maintenance.form.constant';

const RANGE_BUTTONS = [
  { text: 'YES', status: CHECKLIST_STATUS.YES },
  { text: 'NO', status: CHECKLIST_STATUS.NO },
  { text: 'BLANK', status: CHECKLIST_STATUS.BLANK },
];

const RADIO_OPTIONS = [
  { idPrefix: 'yes', status: CHECKLIST_STATUS.YES },
  { idPrefix: 'no', status: CHECKLIST_STATUS.NO },
  { idPrefix: 'blank', status: CHECKLIST_STATUS.BLANK },
];

function ChecklistRadioGroup({ itemId, currentStatus, onStatusChange }) {
  return (
    <div className="fleet maintenance form item-status">
      {RADIO_OPTIONS.map(({ idPrefix, status }) => (
        <Input
          key={idPrefix}
          type="radio"
          id={`${idPrefix}-${itemId}`}
          name={`status-${itemId}`}
          checked={currentStatus === status}
          onChange={() => onStatusChange(itemId, status)}
          {...RADIO_BUTTON_PROPS}
          colorScheme="primary-700"
          borderColor="primary-500"
          onCheckedColor="primary-100"
        />
      ))}
    </div>
  );
}

function ChecklistColumn({ label, items, rangeStart, rangeEnd, onStatusChange, onRangeChange }) {
  const rangeStatus = items.every((item) => item.status === items[0]?.status) ? items[0]?.status : null;

  return (
    <div className="fleet maintenance form checklist-column">
      <div className="fleet maintenance form checklist-actions">
        <span>{label}</span>
        <div className="fleet maintenance form checklist-buttons">
          {RANGE_BUTTONS.map(({ text, status }) => (
            <Button
              key={text}
              {...BUTTON_PROPS}
              text={text}
              onClick={() => onRangeChange(rangeStart, rangeEnd, status)}
              colorScheme={rangeStatus === status ? 'primary-300' : 'primary-700'}
              textColor={rangeStatus === status ? 'black-100' : 'white-100'}
            />
          ))}
        </div>
      </div>
      <div className="fleet maintenance form checklist-items">
        {items.map((item) => (
          <div key={item.id} className="fleet maintenance form checklist-item">
            <div>{item.id}.</div>
            <div>{item.description}</div>
            <ChecklistRadioGroup itemId={item.id} currentStatus={item.status} onStatusChange={onStatusChange} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChecklistColumn;