import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const NotificationNewMessageButton = ({ onClick, hasDraft }) => (
  <button type="button" className="features screen notification new-message-button" onClick={onClick}>
    {renderComponentIcon('IconlyPlus', 22, 'currentColor')}
    New message
    {hasDraft && <span className="features screen notification draft-indicator" />}
  </button>
);

export default NotificationNewMessageButton;