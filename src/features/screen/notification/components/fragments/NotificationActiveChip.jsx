import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const NotificationActiveChip = ({ label, onClear }) => (
  <div className="features screen notification chip">
    {label}
    <button type="button" onClick={onClear}>
      {renderComponentIcon('IconlyClose', 16, 'currentColor')}
    </button>
  </div>
);

export default NotificationActiveChip;