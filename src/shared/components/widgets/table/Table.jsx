import React, { useState } from 'react';
import './Table.css';

function renderCell(column, item, index, groupKey, isExpanded, toggleExpand, canExpand) {
  if (column.expand) {
    if (!canExpand) return null;
    return (
      <button
        type="button"
        className="shared widget table expand-toggle"
        onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
      >
        {isExpanded ? '▾' : '▸'}
      </button>
    );
  }

  if (column.actions) {
    return (
      <div className={`shared widget table data ${column.dataCenter && 'center'}`}>
        {column.render ? column.render(item, index, groupKey) : null}
      </div>
    );
  }

  if (column.progress) {
    const status = column.render ? column.render(item, index, groupKey) : null;
    if (!status) return null;
    const { label, background, color } = status;
    return (
      <div
        className={`shared widget table progress-pill ${column.dataCenter && 'center'}`}
        style={{ backgroundColor: background, color }}
        onMouseEnter={(e) => column.onProgressEnter?.(item, index, groupKey, e)}
        onMouseLeave={(e) => column.onProgressLeave?.(item, index, groupKey, e)}
      >
        {label}
      </div>
    );
  }

  return column.render ? column.render(item, index, groupKey) : item[column.key];
}

function Table({
  columns,
  data,
  groups,
  renderGroupHeader,
  getExpandedRows,
  getRowVariant,
  getRowProps,
  onRowClick,
  rowKey,
  loading = false,
  loadingContent = null,
  emptyMessage = 'No records found',
  tableRef,
  rowNavigation = true,
  columnNavigation = false,
  cellNavigation = false,
  onExpandControlsReady,
  title = false,
  titlePosition = 'left',
  maxHeight,
  onScrollEnd,
  style = {}
}) {
  const columnCount = columns.length;
  const [expandedKeys, setExpandedKeys] = useState(() => new Set());

  const toggleExpand = (key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  React.useEffect(() => {
    onExpandControlsReady?.(toggleExpand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderRow = (item, index, groupKey) => {
    const key = rowKey ? rowKey(item, index, groupKey) : `${groupKey ?? 'row'}-${index}`;
    const isExpanded = expandedKeys.has(key);
    const expandedRows = getExpandedRows ? getExpandedRows(item) || [] : [];
    const canExpand = expandedRows.length > 0;

    return (
      <React.Fragment key={key}>
        <tr
          data-variant={getRowVariant ? getRowVariant(item, index) : undefined}
          data-clickable={rowNavigation && onRowClick ? 'true' : undefined}
          onClick={rowNavigation && onRowClick ? () => onRowClick(item, index, groupKey) : undefined}
          {...(getRowProps ? getRowProps(item, index, groupKey) : {})}
        >
          {columns.map((column) => (
            <td
              key={column.key}
              className={column.dataCenter && 'shared widget table center'}
              data-variant={column.variant ? column.variant(item, index, groupKey) : undefined}
              data-clickable={
                !column.actions && !column.progress && !column.expand && cellNavigation && column.onCellClick
                  ? 'true'
                  : undefined
              }
              onClick={
                !column.actions && !column.progress && !column.expand && cellNavigation && column.onCellClick
                  ? (e) => {
                    e.stopPropagation();
                    column.onCellClick(item, index, groupKey);
                  }
                  : undefined
              }
            >
              {renderCell(column, item, index, groupKey, isExpanded, () => toggleExpand(key), canExpand)}
            </td>
          ))}
        </tr>
        {isExpanded && canExpand && expandedRows.map((extraItem, extraIdx) => (
          <tr key={`${key}-expanded-${extraIdx}`} className="shared widget table table-expanded-row">
            {columns.map((column) => (
              <td key={column.key} className={column.dataCenter && 'shared widget table center'}>
                {column.renderExpanded ? column.renderExpanded(extraItem, item, extraIdx) : null}
              </td>
            ))}
          </tr>
        ))}
      </React.Fragment>
    );
  };

  const groupEntries = groups ? Object.entries(groups) : null;
  const isEmpty = groups
    ? groupEntries.length === 0 || groupEntries.every(([, items]) => !items.length)
    : !data?.length;

  return (
    <div
      className="shared widget table table-container"
      style={{
        ...(maxHeight ? { height: maxHeight, maxHeight } : {}),
        ...style,
      }}
    >
      {title && (
        <div className="shared widget table table-title-bar" data-position={titlePosition}>
          {title}
        </div>
      )}
      <div
        className="shared widget table table-scroll-body"
        onScroll={
          onScrollEnd
            ? (e) => {
              const el = e.currentTarget;
              if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) onScrollEnd();
            }
            : undefined
        }
      >
        <table className="shared widget table table-root" ref={tableRef}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  data-clickable={columnNavigation && column.onHeaderClick ? 'true' : undefined}
                  onClick={
                    columnNavigation && column.onHeaderClick
                      ? () => column.onHeaderClick(column)
                      : undefined
                  }
                  className={column.headerCenter && 'shared widget table header center'}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columnCount} className="shared widget table table-loading-row">
                  {loadingContent}
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td colSpan={columnCount} className="shared widget table table-empty-row">
                  {emptyMessage}
                </td>
              </tr>
            ) : groups ? (
              groupEntries.map(([groupKey, items]) => {
                const groupHeaderContent = renderGroupHeader?.(groupKey, items);
                return (
                  <React.Fragment key={groupKey}>
                    {groupHeaderContent && (
                      <tr className="shared widget table table-group-header-row">
                        <td colSpan={columnCount}>{groupHeaderContent}</td>
                      </tr>
                    )}
                    {items.map((item, index) => renderRow(item, index, groupKey))}
                  </React.Fragment>
                );
              })
            ) : (
              data.map((item, index) => renderRow(item, index))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;