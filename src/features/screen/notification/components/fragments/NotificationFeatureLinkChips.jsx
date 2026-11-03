import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const NotificationFeatureLinkChips = ({ links, onRemove }) => {
  if (links.length === 0) return null;

  return (
    <div className="features screen notification media-row">
      {links.map((link, index) => (
        <button
          key={`${link.featureKey}:${link.reference}`}
          type="button"
          className="features screen notification media-button"
          onClick={() => onRemove(index)}
        >
          {renderComponentIcon('IconlyFolder', 20, 'currentColor')}
          {link.title}
          {renderComponentIcon('IconlyClose', 16, 'currentColor')}
        </button>
      ))}
    </div>
  );
};

export default NotificationFeatureLinkChips;