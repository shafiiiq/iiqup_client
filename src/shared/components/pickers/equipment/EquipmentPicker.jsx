import Picker from '@/shared/components/pickers/Picker';

function EquipmentPicker({ onSelect }) {
    return <Picker types={['equipment']} onSelect={(type, item) => onSelect(item)} />;
}

export default EquipmentPicker;