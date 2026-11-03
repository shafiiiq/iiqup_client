import Input from '@/shared/components/widgets/input/Input';
import { INPUT_PROPS } from '../../../../form/constants/maintenance.form.constant';

function SelectEquipmentSection({ regNo, isEquipmentLocked, equipmentSearch, onEquipmentSelect, onRegNoInput }) {
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
      <h3 className="fleet maintenance form section-title">Select Equipment</h3>

      <div className="fleet maintenance form grid">
        <div className="fleet maintenance form field">
          {isEquipmentLocked ? (
            <Input {...INPUT_PROPS} type="text" id="regNo" name="regNo" value={regNo} label="Equipment Reg No" disabled readOnly />
          ) : (
            <Input
              {...INPUT_PROPS}
              type="search-select"
              id="regNo"
              name="regNo"
              value={regNo}
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
      </div>
    </div>
  );
}

export default SelectEquipmentSection;