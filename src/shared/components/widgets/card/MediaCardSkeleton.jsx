import CardSkeleton from './CardSkeleton';
import MediaSkeletonPlaceholder from './MediaSkeletonPlaceholder';

function MediaCardSkeleton({
    media,
    mediaType = 'image',
    mediaWidth = '80px',
    mediaHeight = '80px',
    mediaGap,
    vars,
    outerStyle,
    innerStyle,
    children,
    ...rest
}) {
    const mediaContent = media ?? (
        <MediaSkeletonPlaceholder mediaType={mediaType} width={mediaWidth} height={mediaHeight} radius="8px" />
    );

    return (
        <CardSkeleton
            outer={{ type: 'flex', direction: 'row' }}
            inner={{ type: 'flex', direction: 'row', gap: mediaGap }}
            vars={vars}
            outerStyle={outerStyle}
            innerStyle={innerStyle}
            {...rest}
        >
            {mediaContent}
            {children}
        </CardSkeleton>
    );
}

export default MediaCardSkeleton;