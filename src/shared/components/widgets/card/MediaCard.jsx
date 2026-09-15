import Card from './Card';

function MediaCard({ media, mediaGap, vars, selected, outerStyle, innerStyle, children, ...rest }) {
  return (
    <Card
      outer={{ type: 'flex', direction: 'row' }}
      inner={{ type: 'flex', direction: 'row', gap: mediaGap }}
      vars={vars}
      data-selected={selected ? 'true' : undefined}
      outerStyle={outerStyle}
      innerStyle={innerStyle}
      {...rest}
    >
      {media}
      {children}
    </Card>
  );
}

export default MediaCard;