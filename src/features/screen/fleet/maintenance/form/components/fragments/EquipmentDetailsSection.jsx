import Input from '@/shared/components/widgets/input/Input';
import { INPUT_PROPS } from '../../constants/maintenance.form.constant';

function EquipmentDetailsSection({
  formData,
  isEquipmentLocked,
  equipmentSearch,
  onChange,
  onEquipmentSelect,
  onRegNoInput,
}) {
  const handleEquipmentSearchChange = (event) => {
    const selectedValue = event.target.value;
    const matchedEquipment = equipmentSearch.results.find(
      (equipment) => String(equipment.regNo) === String(selectedValue)
    );
    if (matchedEquipment) onEquipmentSelect(matchedEquipment);
    else onRegNoInput(selectedValue);
  };

  return (
    <div className="fleet maintenance form section">
      <h3 className="fleet maintenance form section-title">Equipment Details</h3>

      <div className="fleet maintenance form grid">
        <div className="fleet maintenance form field">
          {isEquipmentLocked ? (
            <Input {...INPUT_PROPS} type="text" id="regNo" name="regNo" value={formData.regNo} label="Equipment Reg No" disabled readOnly />
          ) : (
            <Input
              {...INPUT_PROPS}
              type="search-select"
              id="regNo"
              name="regNo"
              value={formData.regNo}
              label="Equipment"
              placeholder={equipmentSearch.isSearching ? 'Searching…' : 'Search reg no or name'}
              options={equipmentSearch.results.map((equipment) => ({
                value: String(equipment.regNo),
                label: `${equipment.regNo} — ${equipment.machine} (${equipment.brand})`,
              }))}
              onChange={handleEquipmentSearchChange}
            />
          )}
        </div>
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

export default EquipmentDetailsSection;