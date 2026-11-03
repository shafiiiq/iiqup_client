import { useCategoryMembers } from '../../hooks/useCategoryMembers';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import Loader from '@/shared/components/widgets/loader/spinner/Spinner';
import NotificationAvatar from './NotificationAvatar';

const NotificationCategorySheet = ({ target, onClose }) => {
  const group = useCategoryMembers(target?.key ?? null);

  if (!target) return null;

  return (
    <div className="features screen notification overlay">
      <div className="features screen notification overlay-backdrop" onClick={onClose} />
      <div className="features screen notification overlay-panel large">
        <div className="features screen notification overlay-header">
          <div>
            <h3 className="features screen notification overlay-title">{target.label}</h3>
            <p className="features screen notification overlay-subtitle">{`${group.members.length} participants`}</p>
          </div>
          <button type="button" className="features screen notification icon-button" onClick={onClose}>
            {renderComponentIcon('IconlyClose', 20, 'currentColor')}
          </button>
        </div>

        <span className="features screen notification overlay-section-label">Add people</span>
        <input
          className="features screen notification overlay-search-input"
          value={group.query}
          onChange={(event) => group.setQuery(event.target.value)}
          placeholder="Search by name..."
        />
        {group.suggestions.map((candidate) => (
          <button
            key={candidate.uniqueCode}
            type="button"
            className="features screen notification member-row"
            onClick={() => group.add(candidate)}
          >
            <span className="features screen notification member-info">
              <strong>{candidate.name}</strong>
              {candidate.designation && <span>{candidate.designation}</span>}
            </span>
            {renderComponentIcon('IconlyPlus', 20, 'currentColor')}
          </button>
        ))}

        <span className="features screen notification overlay-section-label">Participants</span>
        {group.isLoading && (
          <div className="features screen notification loading">
            <Loader />
          </div>
        )}
        {group.members.map((member) => (
          <div key={member.uniqueCode} className="features screen notification member-row">
            <NotificationAvatar profilePicPath={member.profilePicPath} isCompact />
            <span className="features screen notification member-info">
              <strong>{member.name}</strong>
              {member.designation && <span>{member.designation}</span>}
            </span>
            <button
              type="button"
              className="features screen notification icon-button"
              onClick={() => group.confirmRemove(member)}
            >
              {renderComponentIcon('IconlyDelete', 20, 'currentColor')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationCategorySheet;