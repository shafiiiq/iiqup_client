import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const NotificationUnreadPill = ({ count, direction, onPress }) => {
  if (count <= 0) return null;

  const isTop = direction === 'top';

  return (
    <div className={`features screen notification unread-pill-wrap ${direction}`}>
      <button type="button" className="features screen notification unread-pill" onClick={onPress}>
        {renderComponentIcon(isTop ? 'IconlyArrowUp' : 'IconlyArrowDown', 16, 'currentColor')}
        {`${count} Unread on ${isTop ? 'Top' : 'Bottom'}`}
      </button>
    </div>
  );
};

export default NotificationUnreadPill;