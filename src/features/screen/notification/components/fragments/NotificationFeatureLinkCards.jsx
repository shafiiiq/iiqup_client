import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const NotificationFeatureLinkCards = ({ links, onPress }) => {
  if (links.length === 0) return null;

  return (
    <div className="features screen notification feature-card-list">
      {links.map((link) => (
        <button
          key={`${link.featureKey}:${link.reference}`}
          type="button"
          className="features screen notification feature-card"
          onClick={() => onPress(link)}
        >
          <span className="features screen notification feature-card-icon">
            {renderComponentIcon('IconlyDocument', 32, 'currentColor')}
          </span>
          <span className="features screen notification feature-card-text">
            <strong className="features screen notification feature-card-title">{link.label}</strong>
            <span className="features screen notification feature-card-reference">{link.reference}</span>
          </span>
        </button>
      ))}
    </div>
  );
};

export default NotificationFeatureLinkCards;