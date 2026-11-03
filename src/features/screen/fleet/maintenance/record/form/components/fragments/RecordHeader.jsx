import Button from '@/shared/components/widgets/button/Button';
import { getServiceTypeLabel } from '../../../../helper/maintenance.helper';
import { RECORD_SUBMIT_STATUS } from '../../constants/maintenance.record.form.constant';

function RecordHeader({ card, recordNumber, canRemove, onRemove }) {
  return (
    <>
      <div className="fleet maintenance record form header">
        <div className="fleet maintenance record form header-details">
          {card.submitStatus === RECORD_SUBMIT_STATUS.SUCCESS && (
            <span className="material-symbols-rounded fleet maintenance record form status-icon status-icon-success">check_circle</span>
          )}
          {card.submitStatus === RECORD_SUBMIT_STATUS.FAILED && (
            <span className="material-symbols-rounded fleet maintenance record form status-icon status-icon-error">cancel</span>
          )}
          <span className="fleet maintenance record form record-number">#{recordNumber}</span>
          <span className="fleet maintenance record form type-tag">{getServiceTypeLabel(card.formData.serviceType)}</span>
          {card.formData.regNo && <span className="fleet maintenance record form header-text">{card.formData.regNo}</span>}
          {card.history.date && <span className="fleet maintenance record form header-text">{card.history.date}</span>}
        </div>
        {canRemove && (
          <Button
            text="Remove Record"
            icon="close"
            onClick={onRemove}
            colorScheme="error-700"
            variant="gradient"
            squircle="4xl"
            height="36px"
            width="fit-content"
            type="button"
            textColor="white-200"
          />
        )}
      </div>

      {card.submitStatus === RECORD_SUBMIT_STATUS.FAILED && card.submitError && (
        <div className="fleet maintenance record form error-message">
          <span className="material-symbols-rounded">error</span>
          {card.submitError}
        </div>
      )}
    </>
  );
}

export default RecordHeader;