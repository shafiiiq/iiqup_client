import Input from '@/shared/components/widgets/input/Input';
import { SERVICE_TYPES, INPUT_PROPS } from '../../constants/maintenance.form.constant';

function ServiceTypeSection({ formData, onSelectType, onChange }) {
  return (
    <div className="fleet maintenance form section">
      <h3 className="fleet maintenance form section-title">Select Service Type</h3>

      <div className="fleet maintenance form type-grid">
        {SERVICE_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            className={`fleet maintenance form type-card ${formData.serviceType === type.value ? 'selected' : ''}`}
            onClick={() => onSelectType(type.value)}
          >
            <img src={type.image} alt={type.label} className="fleet maintenance form type-card-image" />
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      {formData.serviceType === 'tyre' && (
        <div className="fleet maintenance form grid">
          <div className="fleet maintenance form field">
            <Input {...INPUT_PROPS} type="text" id="tyreModel" name="tyreModel" value={formData.tyreModel} onChange={onChange} label="Tyre Model" placeholder="Enter tyre model" />
          </div>
          <div className="fleet maintenance form field">
            <Input {...INPUT_PROPS} type="text" id="tyreNumber" name="tyreNumber" value={formData.tyreNumber} onChange={onChange} label="Tyre Number" placeholder="Enter tyre number" />
          </div>
        </div>
      )}

      {formData.serviceType === 'battery' && (
        <div className="fleet maintenance form grid">
          <div className="fleet maintenance form field">
            <Input {...INPUT_PROPS} type="text" id="batteryModel" name="batteryModel" value={formData.batteryModel} onChange={onChange} label="Battery Model" placeholder="Enter battery model" />
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceTypeSection;