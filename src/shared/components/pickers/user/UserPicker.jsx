import Picker from '@/shared/components/pickers/Picker';

function UserPicker({ onSelect }) {
    return <Picker types={['user']} onSelect={(type, item, sectionKey) => onSelect(sectionKey, item)} />;
}

export default UserPicker;