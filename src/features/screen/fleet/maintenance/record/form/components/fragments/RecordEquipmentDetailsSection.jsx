import Input from '@/shared/components/widgets/input/Input';
import { INPUT_PROPS } from '../../../../form/constants/maintenance.form.constant';

function RecordEquipmentDetailsSection({ formData, onChange }) {
  return (
    <div className="fleet maintenance form section">
      <h3 className="fleet maintenance form section-title">Equipment Details</h3>

      <div className="fleet maintenance form grid">
        <div className="fleet maintenance form field">
          <Input {...INPUT_PROPS} type="text" id="equipment" name="equipment" value={formData.equipment} onChange={onChange} label="Equipment Name" placeholder="Enter equipment name" />
        </div>
        <div className="fleet maintenance form field">
          <Input {...INPUT_PROPS} type="text" id="location" name="location" value={formData.location} onChange={onChange} label="Location" placeholder="Enter location" />
        </div>
        <div className="fleet maintenance form field">
          <Input {...INPUT_PROPS} type="text" id="mechanics" name="mechanics" value={formData.mechanics} onChange={onChange} label="Mechanics" placeholder="Enter mechanics name" />
        </div>
        <div className="fleet maintenance form field">
          <Input {...INPUT_PROPS} type="text" id="operator" name="operator" value={formData.operator} onChange={onChange} label="Operator" placeholder="Enter operator name" />
        </div>
      </div>
    </div>
  );
}

export default RecordEquipmentDetailsSection;