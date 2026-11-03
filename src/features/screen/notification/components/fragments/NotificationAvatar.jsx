import { useAttachmentUrl } from '../../hooks/useAttachmentUrl';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const NotificationAvatar = ({ profilePicPath, isCompact = false }) => {
  const avatarUrl = useAttachmentUrl(profilePicPath);
  const sizeClassName = isCompact ? 'compact' : '';

  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className={`features screen notification avatar ${sizeClassName}`.trim()} />;
  }

  return (
    <span className={`features screen notification avatar fallback ${sizeClassName}`.trim()}>
      {renderComponentIcon('IconlyFace', isCompact ? 40 : 60, 'currentColor')}
    </span>
  );
};

export default NotificationAvatar;