import { useNavigate } from 'react-router-dom';
import Controls from '@/shared/components/widgets/controls/Controls';
import { BUTTON_PROPS } from '../../constants/equipment.constant';

function EquipmentControls({
  isSelectMode,
  selectedEquipment,
  onToggleSelectMode,
  onAdd,
  onQuickServices,
}) {
  const navigate = useNavigate();

  return (
    <Controls
      rows={1}
      columns={4}
      buttons={[
        {
          ...BUTTON_PROPS,
          text: isSelectMode ? 'Cancel Selection' : 'Select Multiple',
          onClick: onToggleSelectMode,
          colorScheme: isSelectMode ? 'warning-700' : 'success-800',
          textColor: 'white-200',
          componentIconLeft: isSelectMode ? 'CancelAllIcon' : 'SelectMultipleIcon',
          componentIconSize: '25',
          iconColor: 'white-200'
        },
        { text: 'Add Equipment', componentIconLeft: 'IconlyPlus', componentIconSize: '25', iconColor: 'white-200', onClick: onAdd, colorScheme: 'success-800', textColor: 'white-200', type: 'submit', ...BUTTON_PROPS },
        { text: 'Maintenance Records', componentIconLeft: 'TimeLineIcon', componentIconSize: '25', iconColor: 'white-200', onClick: onQuickServices, colorScheme: 'info-800', textColor: 'white-200', type: 'submit', ...BUTTON_PROPS },
        { text: 'Operations Overview', onClick: () => navigate('/fleet/operations'), componentIconLeft: 'OverViewIcon', componentIconSize: '25', iconColor: 'white-200', colorScheme: 'info-800', textColor: 'white-200', type: 'submit', ...BUTTON_PROPS },
        ...(isSelectMode && selectedEquipment.length > 0
          ? [
            {
              ...BUTTON_PROPS,
              text: `View History (${selectedEquipment.length})`,
              onClick: () =>
                navigate(
                  `/maintenance/history/${selectedEquipment.join(',')}`,
                ),
              colorScheme: 'info-800',
              textColor: 'white-200',
              componentIconLeft: 'IconlyShow',
              componentIconSize: '25',
              iconColor: 'white-200',
            },
          ]
          : [])
      ]}
      gap="10px"
      width="100%"
      placeItems="center"
      margin="0 0 20px 0"
    />
  );
}

export default EquipmentControls;