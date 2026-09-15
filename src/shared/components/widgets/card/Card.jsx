import { forwardRef } from 'react';
import './Card.css';

function buildLayoutStyle(layout) {
  if (!layout) return undefined;

  const {
    type = 'flex',
    direction,
    wrap,
    columns,
    rows,
    areas,
    autoFlow,
    gap,
    rowGap,
    columnGap,
    justify,
    align,
    justifyItems,
    alignContent,
    placeItems,
    placeContent,
  } = layout;

  const style = { display: type };

  if (type === 'flex') {
    if (direction) style.flexDirection = direction;
    if (wrap) style.flexWrap = wrap;
  }

  if (type === 'grid') {
    if (columns !== undefined) {
      style.gridTemplateColumns = typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns;
    }
    if (rows !== undefined) {
      style.gridTemplateRows = typeof rows === 'number' ? `repeat(${rows}, 1fr)` : rows;
    }
    if (areas) style.gridTemplateAreas = areas;
    if (autoFlow) style.gridAutoFlow = autoFlow;
  }

  if (gap !== undefined) style.gap = gap;
  if (rowGap !== undefined) style.rowGap = rowGap;
  if (columnGap !== undefined) style.columnGap = columnGap;

  if (placeItems) {
    style.placeItems = placeItems;
  } else {
    if (align) style.alignItems = align;
    if (justifyItems) style.justifyItems = justifyItems;
  }

  if (placeContent) {
    style.placeContent = placeContent;
  } else {
    if (justify) style.justifyContent = justify;
    if (alignContent) style.alignContent = alignContent;
  }

  return style;
}

function buildVarsStyle(vars) {
  if (!vars) return undefined;
  return Object.fromEntries(
    Object.entries(vars).map(([key, value]) => [key.startsWith('--') ? key : `--${key}`, value])
  );
}

const Card = forwardRef(function Card(
  {
    as: OuterTag = 'div',
    innerAs: InnerTag = 'div',
    outer,
    inner,
    vars,
    outerStyle,
    innerStyle,
    innerRef,
    children,
    className,
    style,
    ...rest
  },
  ref
) {
  const outerLayout = buildLayoutStyle(outer);
  const innerLayout = buildLayoutStyle(inner);
  const varsStyle = buildVarsStyle(vars);

  return (
    <OuterTag
      ref={ref}
      className="widget-card"
      style={{ ...varsStyle, ...outerLayout, ...outerStyle }}
      {...rest}
    >
      <InnerTag ref={innerRef} className="widget-card-inner" style={{ ...innerLayout, ...innerStyle }}>
        {children}
      </InnerTag>
    </OuterTag>
  );
});

export default Card;