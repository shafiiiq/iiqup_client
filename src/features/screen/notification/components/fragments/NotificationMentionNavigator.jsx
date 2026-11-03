import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const NotificationMentionNavigator = ({ isVisible, canGoPrevious, canGoNext, onPrevious, onNext }) => {
  if (!isVisible) return null;

  return (
    <div className="features screen notification mention-navigator">
      <button type="button" className="features screen notification icon-button" onClick={onPrevious} disabled={!canGoPrevious}>
        {renderComponentIcon('IconlyArrowUp', 20, 'currentColor')}
      </button>
      <button type="button" className="features screen notification icon-button" onClick={onNext} disabled={!canGoNext}>
        {renderComponentIcon('IconlyArrowDown', 20, 'currentColor')}
      </button>
    </div>
  );
};

export default NotificationMentionNavigator;