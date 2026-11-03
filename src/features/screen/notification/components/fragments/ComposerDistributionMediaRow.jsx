import { MEDIA_FIELD_ICONS } from '../../constants/notification.composer';
import { formatPlaybackTime } from '../../utils/notification.time.format';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const ComposerDistributionMediaRow = ({ composer, mediaFields }) => {
  if (mediaFields.length === 0) return null;

  return (
    <div className="features screen notification media-row">
      {mediaFields.map((field) => {
        const file = composer.mediaFiles[field.key];
        const isRecording = composer.recordingFieldKey === field.key;
        const handleClick = () => {
          if (file) composer.removeMedia(field.key);
          else if (field.type === 'audio') composer.toggleAudioRecording(field);
          else composer.pickMedia(field);
        };
        const iconName = file ? 'IconlyTickCircle' : isRecording ? 'IconlyStopCircle' : MEDIA_FIELD_ICONS[field.type];
        return (
          <button key={field.key} type="button" className="features screen notification media-button" onClick={handleClick}>
            {renderComponentIcon(iconName, 25, 'currentColor')}
            {isRecording
              ? formatPlaybackTime(composer.recordingDurationMillis / 1000)
              : `${field.label}${field.required ? ' *' : ''}${file ? ' (click to remove)' : ''}`}
          </button>
        );
      })}
    </div>
  );
};

export default ComposerDistributionMediaRow;