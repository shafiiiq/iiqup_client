import { memo } from 'react';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import './EquipmentPicker.css';

function EquipmentItemCardBase({ item, collection }) {
    return (
        <button
            type="button"
            className="shared pickers equipment item-card"
            onClick={() => collection.onSelectItem(item)}
        >
            <div className="shared pickers equipment item-card-icon">
                {renderComponentIcon('CraneIcon', 28, 'var(--color-primary)')}
            </div>
            <div className="shared pickers equipment item-card-body">
                <span className="shared pickers equipment item-card-regno">{item.regNo}</span>
                <span className="shared pickers equipment item-card-machine">{item.machine}</span>
            </div>
            {item.subCategory && (
                <span className="shared pickers equipment item-card-badge">{item.subCategory}</span>
            )}
        </button>
    );
}

const EquipmentItemCard = memo(EquipmentItemCardBase);

export default EquipmentItemCard;