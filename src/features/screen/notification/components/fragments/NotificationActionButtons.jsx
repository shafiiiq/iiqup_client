import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const NotificationActionButtons = ({ actions, onActionPress }) => {
  if (actions.length === 0) return null;

  return (
    <div className="features screen notification action-row">
      {actions.map((action) => (
        <button
          key={`${action.screenKey}:${action.documentId}:${action.text}`}
          type="button"
          className="features screen notification action-button"
          onClick={() => onActionPress(action)}
        >
          {action.text}
          {renderComponentIcon('IconlyArrowRight', 18, 'currentColor')}
        </button>
      ))}
    </div>
  );
};

export default NotificationActionButtons;