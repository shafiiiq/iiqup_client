function HireOrderHeaderContextMenu({ menu, onMerge, onUnmerge }) {
  return (
    <div
      className="features screen hire order header-context-menu"
      style={{ top: menu.y, left: menu.x }}
    >
      {menu.mergeable && (
        <button type="button" className="features screen hire order header-context-item" onClick={onMerge}>
          Merge cells
        </button>
      )}
      {menu.unmergeable && (
        <button
          type="button"
          className="features screen hire order header-context-item"
          onClick={() => onUnmerge(menu.columnId)}
        >
          Unmerge cells
        </button>
      )}
    </div>
  );
}

export default HireOrderHeaderContextMenu;