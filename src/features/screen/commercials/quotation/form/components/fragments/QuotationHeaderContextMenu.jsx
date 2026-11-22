function QuotationHeaderContextMenu({ menu, onMerge, onUnmerge }) {
  return (
    <div
      className="features screen quotation form header-context-menu"
      style={{ top: menu.y, left: menu.x }}
    >
      {menu.mergeable && (
        <button type="button" className="features screen quotation form header-context-item" onClick={onMerge}>
          Merge cells
        </button>
      )}
      {menu.unmergeable && (
        <button
          type="button"
          className="features screen quotation form header-context-item"
          onClick={() => onUnmerge(menu.columnId)}
        >
          Unmerge cells
        </button>
      )}
    </div>
  );
}

export default QuotationHeaderContextMenu;