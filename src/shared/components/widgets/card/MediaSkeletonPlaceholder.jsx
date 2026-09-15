import Skeleton from '@/shared/components/widgets/loader/skeleton/Skeleton';
import './MediaSkeletonPlaceholder.css';

const MEDIA_TYPE_ICONS = {
    image: 'landscape_2',
    video: 'animated_images',
    audio: 'graphic_eq',
    document: 'description',
};

function MediaSkeletonPlaceholder({
    mediaType = 'image',
    width = '100%',
    height = '100%',
    radius = '8px',
    className = '',
}) {
    const icon = MEDIA_TYPE_ICONS[mediaType] || MEDIA_TYPE_ICONS.image;

    return (
        <Skeleton
            width={width}
            height={height}
            radius={radius}
            className={`media-skeleton-placeholder ${className}`}
        >
            <span className="media-skeleton-icon-slot">
                <span className="material-symbols-rounded">{icon}</span>
            </span>
        </Skeleton>
    );
}

export default MediaSkeletonPlaceholder;