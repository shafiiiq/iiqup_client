import Input from '@/shared/components/widgets/input/Input';
import { INPUT_PROPS } from '../../constants/maintenance.form.constant';

function HistorySection({ history, showFullService, onHistoryChange }) {
  return (
    <div className="fleet maintenance form section">
      <h3 className="fleet maintenance form section-title">History</h3>

      <div className="fleet maintenance form grid">
        <div className="fleet maintenance form field">
          <Input
            {...INPUT_PROPS}
            type="date"
            id="date"
            name="date"
            value={history.date}
            onChange={(event) => onHistoryChange('date', event.target.value)}
            label="Service Date"
          />
        </div>
        <div className="fleet maintenance form field">
          <Input
            {...INPUT_PROPS}
            type="text"
            id="serviceHrs"
            name="serviceHrs"
            value={history.serviceHrs}
            onChange={(event) => onHistoryChange('serviceHrs', event.target.value)}
            label="Service Hrs / Km"
            placeholder="e.g. 1000HRS"
          />
        </div>
        <div className="fleet maintenance form field">
          <Input
            {...INPUT_PROPS}
            type="text"
            id="nextServiceHrs"
            name="nextServiceHrs"
            value={history.nextServiceHrs}
            onChange={(event) => onHistoryChange('nextServiceHrs', event.target.value)}
            label="Next Service Hrs / Km"
            placeholder="Auto-calculated"
          />
        </div>
        {showFullService && (
          <div className="fleet maintenance form field">
            <Input
              {...INPUT_PROPS}
              type="select"
              id="fullService"
              name="fullService"
              value={String(history.fullService)}
              onChange={(event) => onHistoryChange('fullService', event.target.value === 'true')}
              label="Full Service"
              options={[{ value: 'false', label: 'No' }, { value: 'true', label: 'Yes' }]}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default HistorySection;