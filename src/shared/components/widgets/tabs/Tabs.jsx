import { useState, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import TabsControls from './TabsControls';
import './Tabs.css';

function TabNode({ node, depth, activePath, onSelect, parentPath, collapsed, openKeys, onToggle }) {
  const path = [...parentPath, node.key];
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const isOpen = Boolean(node.isForcedOpen) || openKeys.includes(node.key);
  const isActive =
    node.isActive !== undefined ? node.isActive : hasChildren ? isOpen : activePath[depth] === node.key;
  const showChildren = hasChildren && isOpen && !collapsed;
  const Icon = node.icon;
  const hasIcon = Boolean(node.iconName || Icon);

  const handleClick = () => {
    if (hasChildren) {
      onToggle(node.key);
      if (node.onActivate) node.onActivate(path, node);
      if (node.selectOnClick) {
        const defaultChild =
          node.children.find((c) => c.key === node.selectOnClick) || node.children[0];
        if (defaultChild) onSelect([...path, defaultChild.key], defaultChild);
      }
    } else {
      onSelect(path, node);
    }
  };

  const handleDragOver = (event) => {
    if (!node.dropMimeType || !Array.from(event.dataTransfer.types).includes(node.dropMimeType)) return;
    event.preventDefault();
  };

  const handleDrop = (event) => {
    if (!node.dropMimeType) return;
    const payload = event.dataTransfer.getData(node.dropMimeType);
    if (!payload) return;
    event.preventDefault();
    event.stopPropagation();
    node.onDropPayload(payload);
  };

  return (
    <div className="shared component widget tabs node" style={{ '--tabs-depth': depth }}>
      <button
        type="button"
        title={collapsed ? node.label : undefined}
        aria-label={node.label}
        aria-expanded={hasChildren ? isOpen : undefined}
        className={`shared component widget tabs item ${isActive ? 'active' : ''} ${hasChildren ? 'has-children' : ''
          } ${collapsed ? 'collapsed' : ''} ${depth > 0 ? 'sub-item' : ''} ${node.warn ? 'warn' : ''}`}
        style={{ '--tabs-depth': depth }}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {hasIcon && (
          <span className="shared component widget tabs item-icon">
            {node.iconName
              ? renderComponentIcon(node.iconName, 16, 'currentColor')
              : <Icon size={16} strokeWidth={1.75} />}
          </span>
        )}
        {!collapsed && <span className="shared component widget tabs item-label">{node.label}</span>}
        {!collapsed && hasChildren && (
          <ChevronDown
            size={14}
            className={`shared component widget tabs node-chevron ${isOpen ? 'open' : ''}`}
          />
        )}
        {!collapsed && node.badge != null && (
          <span className="shared component widget tabs item-badge">{node.badge}</span>
        )}
      </button>

      {showChildren && (
        <div className="shared component widget tabs children" style={{ '--tabs-depth': depth + 1 }}>
          {node.children.map((child) => (
            <TabNode
              key={child.key}
              node={child}
              depth={depth + 1}
              activePath={activePath}
              onSelect={onSelect}
              parentPath={path}
              collapsed={collapsed}
              openKeys={openKeys}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}

      {collapsed && hasChildren && (
        <div className="shared component widget tabs flyout">
          <div className="shared component widget tabs flyout-inner">
            {node.children.map((child) => {
              const childActive = activePath[depth + 1] === child.key;
              return (
                <div
                  key={child.key}
                  className={`shared component widget tabs flyout-branch ${childActive ? 'flyout-branch-active' : ''
                    }`}
                >
                  <a
                    href="#"
                    className={`shared component widget tabs flyout-link ${childActive ? 'active' : ''
                      } ${child.warn ? 'warn' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelect([...path, child.key], child);
                    }}
                  >
                    {child.label}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MessagesSection({ messages, collapsed, onAdd, onSelectContact }) {
  if (!messages || messages.length === 0) return null;

  return (
    <div className="shared component widget tabs messages" data-purpose="messages-section">
      <div className="shared component widget tabs messages-header">
        {!collapsed && (
          <span className="shared component widget tabs section-label">Messages</span>
        )}
        {collapsed && (
          <span className="shared component widget tabs section-label collapsed">Messages</span>
        )}
        {!collapsed && (
          <button
            type="button"
            aria-label="New message"
            className="shared component widget tabs messages-add"
            onClick={onAdd}
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <div className="shared component widget tabs messages-list" role="list">
        {messages.map((m) => (
          <a
            href="#"
            key={m.key}
            className={`shared component widget tabs messages-item ${collapsed ? 'collapsed' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onSelectContact?.(m);
            }}
          >
            <span className="shared component widget tabs messages-avatar-wrap">
              <img className="shared component widget tabs messages-avatar" src={m.avatar} alt={m.name} />
              <span
                className={`shared component widget tabs messages-status messages-status-${m.status || 'offline'}`}
              />
            </span>
            {!collapsed && (
              <span className="shared component widget tabs messages-name">{m.name}</span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

function FiltersSection({ filters, collapsed, filtersOpen, onToggleFilters, filterToggleLabel }) {
  if (!filters) return null;

  return (
    <div className="shared component widget tabs filters" data-purpose="filters-section">
      <button
        type="button"
        title={collapsed ? filterToggleLabel : undefined}
        aria-label={filterToggleLabel}
        aria-expanded={filtersOpen}
        className={`shared component widget tabs filters-toggle ${filtersOpen ? 'expanded' : ''} ${collapsed ? 'collapsed' : ''
          }`}
        onClick={onToggleFilters}
      >
        <span className="shared component widget tabs item-icon">
          <SlidersHorizontal size={16} strokeWidth={1.75} />
        </span>
        {!collapsed && <span className="shared component widget tabs item-label">{filterToggleLabel}</span>}
        {!collapsed && (
          <ChevronDown size={14} className="shared component widget tabs filters-chevron" />
        )}
      </button>

      {filtersOpen && !collapsed && (
        <div className="shared component widget tabs filters-panel">{filters}</div>
      )}
    </div>
  );
}

const normalizeSearchTerm = (value) => value.trim().toLowerCase();

const filterNodesByLabel = (nodes, term) =>
  nodes.reduce((accumulator, node) => {
    if (node.label.toLowerCase().includes(term)) {
      accumulator.push(node);
      return accumulator;
    }
    const matchingChildren = Array.isArray(node.children) ? filterNodesByLabel(node.children, term) : [];
    if (matchingChildren.length > 0) {
      accumulator.push({ ...node, children: matchingChildren, isSearchAncestor: true });
    }
    return accumulator;
  }, []);

const collectSearchAncestorKeys = (nodes) =>
  nodes.reduce((accumulator, node) => {
    if (node.isSearchAncestor) accumulator.push(node.key, ...collectSearchAncestorKeys(node.children));
    return accumulator;
  }, []);

function Tabs({
  items = [],
  activePath = [],
  onSelect,
  title = 'Main',
  logo,
  showSearch = true,
  searchPlaceholder = 'Search',
  searchShortcut = '⌘S',
  onSearch,
  controls = [],
  controlsRows = 1,
  controlsColumns = 1,
  messages = [],
  onAddMessage,
  onSelectContact,
  user,
  onUserClick,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onToggleCollapse,
  maxHeight = '820px',
  filters = null,
  filtersOpen: filtersOpenProp,
  defaultFiltersOpen = false,
  openAllByDefault = false,
  filterOnSearch = false,
  mergeOpenKeys = false,
  onToggleFilters,
  filterToggleLabel = 'Filters',
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const isControlled = collapsedProp !== undefined;
  const collapsed = isControlled ? collapsedProp : internalCollapsed;

  const [searchTerm, setSearchTerm] = useState('');
  const [internalFiltersOpen, setInternalFiltersOpen] = useState(defaultFiltersOpen);
  const isFiltersControlled = filtersOpenProp !== undefined;
  const filtersOpen = isFiltersControlled ? filtersOpenProp : internalFiltersOpen;

  const collectAllGroupKeys = (nodes) =>
    nodes.reduce((acc, node) => {
      if (Array.isArray(node.children) && node.children.length > 0) {
        acc.push(node.key, ...collectAllGroupKeys(node.children));
      }
      return acc;
    }, []);

  const [openKeys, setOpenKeys] = useState(() =>
    openAllByDefault ? collectAllGroupKeys(items) : activePath.slice(0, -1)
  );

  useEffect(() => {
    if (openAllByDefault) return;
    if (mergeOpenKeys) {
      setOpenKeys((prev) => Array.from(new Set([...prev, ...activePath])));
      return;
    }
    const ancestors = activePath.slice(0, -1);
    setOpenKeys(Array.from(new Set(ancestors)));
  }, [activePath.join('>'), openAllByDefault, mergeOpenKeys]);

  const toggleOpenKey = (key) => {
    setOpenKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const normalizedSearchTerm = filterOnSearch ? normalizeSearchTerm(searchTerm) : '';
  const visibleItems = normalizedSearchTerm ? filterNodesByLabel(items, normalizedSearchTerm) : items;
  const visibleOpenKeys = normalizedSearchTerm ? collectSearchAncestorKeys(visibleItems) : openKeys;

  const toggle = () => {
    const next = !collapsed;
    if (!isControlled) setInternalCollapsed(next);
    onToggleCollapse?.(next);
  };

  const toggleFilters = () => {
    const next = !filtersOpen;
    if (!isFiltersControlled) setInternalFiltersOpen(next);
    onToggleFilters?.(next);
  };

  return (
    <nav
      className={`shared component widget tabs container ${collapsed ? 'collapsed' : ''}`}
      style={{ '--tabs-max-height': maxHeight }}
      aria-label={collapsed ? 'Collapsed navigation' : 'Expanded navigation'}
    >
      <button
        type="button"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="shared component widget tabs toggle"
        onClick={toggle}
      >
        {collapsed ? <ChevronRight size={14} strokeWidth={2.5} /> : <ChevronLeft size={14} strokeWidth={2.5} />}
      </button>

      <div className="shared component widget tabs scroll-area">
        <div className="shared component widget tabs brand">
          {logo || <Sparkles size={28} strokeWidth={0} fill="currentColor" />}
        </div>

        {showSearch && (
          <div className={`shared component widget tabs search ${collapsed ? 'collapsed' : ''}`}>
            {collapsed ? (
              <button type="button" aria-label="Search" className="shared component widget tabs search-btn" onClick={onSearch}>
                <Search size={16} strokeWidth={2} />
              </button>
            ) : (
              <div className="shared component widget tabs search-field">
                <Search size={16} strokeWidth={2} className="shared component widget tabs search-icon" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  className="shared component widget tabs search-input"
                  value={filterOnSearch ? searchTerm : undefined}
                  onChange={filterOnSearch ? (event) => setSearchTerm(event.target.value) : undefined}
                  onFocus={filterOnSearch ? undefined : onSearch}
                  readOnly={!filterOnSearch}
                />
                {searchShortcut && (
                  <span className="shared component widget tabs search-shortcut">{searchShortcut}</span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="shared component widget tabs list">
          {title && (
            <span className={`shared component widget tabs section-label ${collapsed ? 'collapsed' : ''}`}>
              {title}
            </span>
          )}
          {visibleItems.map((node) => (
            <TabNode
              key={node.key}
              node={node}
              depth={0}
              activePath={activePath}
              onSelect={onSelect}
              parentPath={[]}
              collapsed={collapsed}
              openKeys={visibleOpenKeys}
              onToggle={toggleOpenKey}
            />
          ))}
        </div>

        <FiltersSection
          filters={filters}
          collapsed={collapsed}
          filtersOpen={filtersOpen}
          onToggleFilters={toggleFilters}
          filterToggleLabel={filterToggleLabel}
        />

        <MessagesSection
          messages={messages}
          collapsed={collapsed}
          onAdd={onAddMessage}
          onSelectContact={onSelectContact}
        />
      </div>

      {user && (
        <button
          type="button"
          className={`shared component widget tabs user-card ${collapsed ? 'collapsed' : ''}`}
          onClick={onUserClick}
        >
          <span className="shared component widget tabs user-info">
            <img className="shared component widget tabs user-avatar" src={user.avatar} alt={user.name} />
            {!collapsed && (
              <span className="shared component widget tabs user-text">
                <span className="shared component widget tabs user-name">{user.name}</span>
                {user.role && <span className="shared component widget tabs user-role">{user.role}</span>}
              </span>
            )}
          </span>
          {!collapsed && <ChevronDown size={16} strokeWidth={2} className="shared component widget tabs user-chevron" />}
        </button>
      )}

      <TabsControls items={controls} collapsed={collapsed} rows={controlsRows} columns={controlsColumns} />
    </nav>
  );
}

export default Tabs;