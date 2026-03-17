// ─────────────────────────────────────────────────────────────────────────────
// DownloadCenter.jsx — Full file explorer with real folder navigation
// Folders are real containers. Files live inside folders. The sidebar shows
// the live folder tree. All file operations (copy/cut/paste/move/rename/delete)
// work across folders via drag, keyboard, toolbar, and right-click menu.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import './DownloadCenter.css';
import Viewer from '../Viewer/Viewer';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** The root folder id — always exists, cannot be deleted or renamed. */
const ROOT_ID = 'root';

/** Conversion options shown in the toolbar's convert dropdown. */
const CONVERT_OPTIONS = [
  { label: 'Image → PDF',  icon: 'picture_as_pdf' },
  { label: 'PDF → Image',  icon: 'image'          },
  { label: 'Merge PDFs',   icon: 'merge'          },
  { label: 'Split PDF',    icon: 'call_split'     },
  { label: 'Excel → PDF',  icon: 'picture_as_pdf' },
  { label: 'Word → PDF',   icon: 'picture_as_pdf' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns a Material Symbol icon name for the file extension. */
const getFileIcon = (name, isFolder = false) => {
  if (isFolder) return 'folder';
  const ext = (name || '').split('.').pop().toLowerCase();
  const map = {
    pdf: 'picture_as_pdf',
    xlsx: 'table_chart', xls: 'table_chart',
    docx: 'description', doc: 'description',
    pptx: 'slideshow',   ppt: 'slideshow',
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', svg: 'image',
    mp4: 'smart_display', mov: 'smart_display', avi: 'smart_display',
    mp3: 'audio_file', wav: 'audio_file',
    txt: 'article', md: 'article',
    js: 'code', jsx: 'code', ts: 'code', tsx: 'code', json: 'code',
    zip: 'folder_zip', rar: 'folder_zip',
  };
  return map[ext] ?? 'draft';
};

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024)      return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';

/** Generates a unique id. */
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// ─────────────────────────────────────────────────────────────────────────────
// Initial state — root folder tree
// ─────────────────────────────────────────────────────────────────────────────

const buildInitialFolders = () => ({
  [ROOT_ID]: { id: ROOT_ID, name: 'Download Center', parentId: null, children: [] },
});

// ─────────────────────────────────────────────────────────────────────────────
// SidebarNode — recursive folder tree item
// ─────────────────────────────────────────────────────────────────────────────

const SidebarNode = ({
  folder, folders, currentFolderId, depth,
  onSelect, onContextMenu, dragOverId, onDragEnter, onDragLeave, onDrop,
}) => {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = folder.children.length > 0;
  const isActive    = currentFolderId === folder.id;
  const isDragOver  = dragOverId === folder.id;

  return (
    <div className="dc__tree-node">
      <div
        className={[
          'dc__tree-item',
          isActive   ? 'dc__tree-item--active'    : '',
          isDragOver ? 'dc__tree-item--drag-over' : '',
        ].filter(Boolean).join(' ')}
        style={{ paddingLeft: `${0.5 + depth * 1.1}rem` }}
        onClick={() => onSelect(folder.id)}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, folder.id); }}
        onDragOver={(e) => { e.preventDefault(); onDragEnter(folder.id); }}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, folder.id)}
      >
        {/* Expand toggle */}
        <button
          className="dc__tree-chevron"
          onClick={(e) => { e.stopPropagation(); setExpanded((p) => !p); }}
          style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
        >
          <span className="material-symbols-rounded">
            {expanded ? 'expand_more' : 'chevron_right'}
          </span>
        </button>

        <span className="material-symbols-rounded dc__tree-icon">
          {isActive || expanded ? 'folder_open' : 'folder'}
        </span>
        <span className="dc__tree-label">{folder.name}</span>

        {/* File count badge */}
        <span className="dc__tree-badge">
          {folders[folder.id]?.children?.length ?? 0}
        </span>
      </div>

      {/* Recursive children */}
      {expanded && hasChildren && (
        <div className="dc__tree-children">
          {folder.children.map((childId) =>
            folders[childId] ? (
              <SidebarNode
                key={childId}
                folder={folders[childId]}
                folders={folders}
                currentFolderId={currentFolderId}
                depth={depth + 1}
                onSelect={onSelect}
                onContextMenu={onContextMenu}
                dragOverId={dragOverId}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              />
            ) : null
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DownloadCenter Component
// ─────────────────────────────────────────────────────────────────────────────

const DownloadCenter = () => {

  // ── State ──────────────────────────────────────────────────────────────────

  /** Map of folderId → { id, name, parentId, children: [folderId, ...] } */
  const [folders,          setFolders]          = useState(buildInitialFolders);

  /** Map of fileId → { id, name, size, type, date, folderId, file } */
  const [fileMap,          setFileMap]          = useState({});

  const [currentFolderId,  setCurrentFolderId]  = useState(ROOT_ID);
  const [selectedIds,      setSelectedIds]      = useState(new Set());
  const [viewMode,         setViewMode]         = useState('grid');
  const [searchQuery,      setSearchQuery]      = useState('');
  const [isDraggingOver,   setIsDraggingOver]   = useState(false);
  const [sidebarDragOver,  setSidebarDragOver]  = useState(null);
  const [clipboard,        setClipboard]        = useState(null);
  const [sortBy,           setSortBy]           = useState('name');
  const [sortDir,          setSortDir]          = useState('asc');
  const [showConvertMenu,  setShowConvertMenu]  = useState(false);
  const [renamingId,       setRenamingId]       = useState(null);
  const [renameValue,      setRenameValue]      = useState('');
  const [contextMenu,      setContextMenu]      = useState(null);

  // ── Preview state ──────────────────────────────────────────────────────────

  const [previewFile,      setPreviewFile]      = useState(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState(null);
  const [previewText,      setPreviewText]      = useState(null);

  // ── Refs ───────────────────────────────────────────────────────────────────

  const fileInputRef   = useRef(null);
  const renameInputRef = useRef(null);
  const dragItemId     = useRef(null); // id of the item being dragged

  // ─────────────────────────────────────────────────────────────────────────
  // Derived values
  // ─────────────────────────────────────────────────────────────────────────

  const currentFolder = folders[currentFolderId];

  /**
   * Items visible in the main file area — files in the current folder
   * plus sub-folder entries (shown as folder cards).
   */
  const visibleItems = useMemo(() => {
    const folder = folders[currentFolderId];
    if (!folder) return [];

    // Sub-folders of current folder
    const subFolders = folder.children
      .map((id) => folders[id])
      .filter(Boolean)
      .map((f) => ({ ...f, isFolder: true, itemType: 'folder' }));

    // Files in current folder
    const folderFiles = Object.values(fileMap)
      .filter((f) => f.folderId === currentFolderId)
      .map((f) => ({ ...f, isFolder: false, itemType: 'file' }));

    const combined = [...subFolders, ...folderFiles]
      .filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return combined.sort((a, b) => {
      // Folders always first
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder)  return 1;

      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      if (sortBy === 'size') cmp = (a.size || 0) - (b.size || 0);
      if (sortBy === 'date') cmp = new Date(a.date || 0) - new Date(b.date || 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [folders, fileMap, currentFolderId, searchQuery, sortBy, sortDir]);

  /** Breadcrumb path from root to current folder. */
  const breadcrumb = useMemo(() => {
    const path = [];
    let fid = currentFolderId;
    while (fid) {
      const f = folders[fid];
      if (!f) break;
      path.unshift(f);
      fid = f.parentId;
    }
    return path;
  }, [folders, currentFolderId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────

  // Auto-focus rename input.
  useEffect(() => {
    if (renamingId) renameInputRef.current?.select();
  }, [renamingId]);

  // Dismiss context menu on outside click.
  useEffect(() => {
    const dismiss = () => setContextMenu(null);
    window.addEventListener('click', dismiss);
    return () => window.removeEventListener('click', dismiss);
  }, []);

  // Revoke preview object URL on close.
  useEffect(() => {
    if (!previewFile && previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl(null);
      setPreviewText(null);
    }
  }, [previewFile, previewObjectUrl]);

  // ─────────────────────────────────────────────────────────────────────────
  // Keyboard shortcuts — defined after all handlers via useCallback refs
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'c') { e.preventDefault(); handleCopy();   }
      if (ctrl && e.key === 'x') { e.preventDefault(); handleCut();    }
      if (ctrl && e.key === 'v') { e.preventDefault(); handlePaste();  }
      if (ctrl && e.key === 'a') { e.preventDefault(); setSelectedIds(new Set(visibleItems.map((i) => i.id))); }
      if (e.key === 'Delete')    { e.preventDefault(); handleDelete();  }
      if (e.key === 'Escape')    { setSelectedIds(new Set()); setContextMenu(null); }
      if (e.key === 'F2') {
        e.preventDefault();
        const first = visibleItems.find((i) => selectedIds.has(i.id));
        if (first) handleRenameStart(first.id, first.name);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, clipboard, visibleItems]);

  // ─────────────────────────────────────────────────────────────────────────
  // Folder operations
  // ─────────────────────────────────────────────────────────────────────────

  /** Creates a new sub-folder inside parentId and immediately enters rename. */
  const handleNewFolder = useCallback((parentId = currentFolderId) => {
    const id   = uid();
    const name = 'New Folder';
    setFolders((prev) => ({
      ...prev,
      [id]: { id, name, parentId, children: [] },
      [parentId]: { ...prev[parentId], children: [...prev[parentId].children, id] },
    }));
    setCurrentFolderId(parentId);
    setTimeout(() => handleRenameStart(id, name), 60);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  /** Recursively collects all descendant folder ids (for delete). */
  const getDescendantFolderIds = useCallback((folderId) => {
    const result = [];
    const recurse = (id) => {
      result.push(id);
      (folders[id]?.children || []).forEach(recurse);
    };
    (folders[folderId]?.children || []).forEach(recurse);
    return result;
  }, [folders]);

  /** Deletes a folder and all its descendant folders and files. */
  const deleteFolderById = useCallback((folderId) => {
    const descendants = getDescendantFolderIds(folderId);
    const toDelete    = [folderId, ...descendants];

    setFolders((prev) => {
      const next    = { ...prev };
      const parent  = next[prev[folderId]?.parentId];
      if (parent) {
        next[parent.id] = { ...parent, children: parent.children.filter((c) => c !== folderId) };
      }
      toDelete.forEach((id) => delete next[id]);
      return next;
    });

    setFileMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((fid) => {
        if (toDelete.includes(next[fid].folderId)) delete next[fid];
      });
      return next;
    });

    if (toDelete.includes(currentFolderId)) setCurrentFolderId(ROOT_ID);
  }, [getDescendantFolderIds, currentFolderId]);

  // ─────────────────────────────────────────────────────────────────────────
  // File ingestion
  // ─────────────────────────────────────────────────────────────────────────

  const ingestFiles = useCallback((incoming, targetFolderId = currentFolderId) => {
    const newEntries = {};
    Array.from(incoming).forEach((file) => {
      const id = uid();
      newEntries[id] = {
        id, file,
        name:     file.name,
        size:     file.size,
        type:     file.type,
        date:     new Date(file.lastModified),
        folderId: targetFolderId,
      };
    });
    setFileMap((prev) => ({ ...prev, ...newEntries }));
  }, [currentFolderId]);

  const handleFileInputChange = (e) => { ingestFiles(e.target.files); e.target.value = ''; };

  // ─────────────────────────────────────────────────────────────────────────
  // Drag-and-drop — file area
  // ─────────────────────────────────────────────────────────────────────────

  const handleAreaDragOver  = (e) => { e.preventDefault(); setIsDraggingOver(true);  };
  const handleAreaDragLeave = ()  => setIsDraggingOver(false);
  const handleAreaDrop      = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files?.length) {
      ingestFiles(e.dataTransfer.files);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Drag-and-drop — moving items between folders via sidebar
  // ─────────────────────────────────────────────────────────────────────────

  const handleItemDragStart = (e, id) => {
    dragItemId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSidebarDragEnter = (folderId) => setSidebarDragOver(folderId);
  const handleSidebarDragLeave = ()          => setSidebarDragOver(null);

  /** Drops a dragged item (file or folder) into a sidebar folder. */
  const handleSidebarDrop = (e, targetFolderId) => {
    e.preventDefault();
    setSidebarDragOver(null);
    const id = dragItemId.current;
    if (!id || targetFolderId === id) return;

    // Moving a folder
    if (folders[id]) {
      // Prevent dropping folder into its own descendant
      const desc = getDescendantFolderIds(id);
      if (desc.includes(targetFolderId)) return;

      setFolders((prev) => {
        const next      = { ...prev };
        const oldParent = next[prev[id].parentId];
        if (oldParent) {
          next[oldParent.id] = { ...oldParent, children: oldParent.children.filter((c) => c !== id) };
        }
        next[id]             = { ...next[id], parentId: targetFolderId };
        next[targetFolderId] = { ...next[targetFolderId], children: [...next[targetFolderId].children, id] };
        return next;
      });
    }

    // Moving a file
    if (fileMap[id]) {
      setFileMap((prev) => ({
        ...prev,
        [id]: { ...prev[id], folderId: targetFolderId },
      }));
    }

    dragItemId.current = null;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Selection
  // ─────────────────────────────────────────────────────────────────────────

  const handleItemClick = (e, id) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    } else {
      setSelectedIds(new Set([id]));
    }
  };

  /** Opens folder on double-click. Opens files in the Viewer modal. */
  const handleItemDoubleClick = async (item) => {
    if (item.isFolder) {
      setCurrentFolderId(item.id);
      setSelectedIds(new Set());
      return;
    }
    const url = URL.createObjectURL(item.file);
    setPreviewObjectUrl(url);
    const ext      = item.name.split('.').pop().toLowerCase();
    const textExts = ['txt','md','js','jsx','ts','tsx','json','html','css','xml','csv','yaml','yml'];
    if (textExts.includes(ext)) {
      const text = await item.file.text();
      setPreviewText(text);
    }
    setPreviewFile(item.file);
  };

  const handlePreviewClose = () => setPreviewFile(null);

  // ─────────────────────────────────────────────────────────────────────────
  // File / folder operations
  // ─────────────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(() => {
    selectedIds.forEach((id) => {
      if (folders[id])  deleteFolderById(id);
      if (fileMap[id])  setFileMap((prev) => { const n = { ...prev }; delete n[id]; return n; });
    });
    setSelectedIds(new Set());
  }, [selectedIds, folders, fileMap, deleteFolderById]);

  const handleCopy = useCallback(() => setClipboard({ ids: new Set(selectedIds), mode: 'copy' }), [selectedIds]);
  const handleCut  = useCallback(() => setClipboard({ ids: new Set(selectedIds), mode: 'cut'  }), [selectedIds]);

  const handlePaste = useCallback(() => {
    if (!clipboard) return;

    clipboard.ids.forEach((id) => {
      if (fileMap[id]) {
        if (clipboard.mode === 'copy') {
          const orig = fileMap[id];
          const newId = uid();
          setFileMap((prev) => ({
            ...prev,
            [newId]: { ...orig, id: newId, folderId: currentFolderId,
                        name: orig.name.replace(/(\.[^.]+)?$/, ' (copy)$1') },
          }));
        } else {
          setFileMap((prev) => ({ ...prev, [id]: { ...prev[id], folderId: currentFolderId } }));
        }
      }
    });

    if (clipboard.mode === 'cut') setClipboard(null);
  }, [clipboard, fileMap, currentFolderId]);

  const handleRenameStart = (id, currentName) => {
    setRenamingId(id);
    setRenameValue(currentName);
  };

  const handleRenameCommit = () => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    const name = renameValue.trim();

    if (folders[renamingId]) {
      setFolders((prev) => ({ ...prev, [renamingId]: { ...prev[renamingId], name } }));
    }
    if (fileMap[renamingId]) {
      setFileMap((prev) => ({ ...prev, [renamingId]: { ...prev[renamingId], name } }));
    }
    setRenamingId(null);
  };

  const handleDownloadFile = (entry) => {
    const url  = URL.createObjectURL(entry.file);
    const link = document.createElement('a');
    link.href = url; link.download = entry.name; link.click();
    URL.revokeObjectURL(url);
  };

  const handleNewFile = useCallback(() => {
    const blank = new File([''], 'New File.txt', { type: 'text/plain' });
    const id    = uid();
    setFileMap((prev) => ({
      ...prev,
      [id]: { id, file: blank, name: 'New File.txt', size: 0,
               type: 'text/plain', date: new Date(), folderId: currentFolderId },
    }));
    setTimeout(() => handleRenameStart(id, 'New File.txt'), 60);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Context menu
  // ─────────────────────────────────────────────────────────────────────────

  const handleItemContextMenu = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedIds.has(id)) setSelectedIds(new Set([id]));
    setContextMenu({ x: e.clientX, y: e.clientY, itemId: id });
  };

  const handleAreaContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, itemId: null });
  };

  /** Build the right-click item list. */
  const buildContextItems = () => {
    if (contextMenu?.itemId) {
      const item   = visibleItems.find((i) => i.id === contextMenu.itemId);
      const isFile = item && !item.isFolder;
      return [
        ...(isFile ? [
          { label: 'Open Preview', icon: 'visibility', action: () => handleItemDoubleClick(item), dividerAfter: false },
          { label: 'Download',     icon: 'download',   action: () => handleDownloadFile(item),    dividerAfter: true  },
        ] : [
          { label: 'Open Folder',  icon: 'folder_open', action: () => { setCurrentFolderId(contextMenu.itemId); setContextMenu(null); }, dividerAfter: true },
        ]),
        { label: 'Rename',        icon: 'drive_file_rename_outline', action: () => handleRenameStart(contextMenu.itemId, item?.name ?? ''), dividerAfter: false },
        { label: 'Copy',          icon: 'content_copy',              action: handleCopy,    dividerAfter: false },
        { label: 'Cut',           icon: 'content_cut',               action: handleCut,     dividerAfter: false },
        { label: 'Paste',         icon: 'content_paste',             action: handlePaste,   dividerAfter: true,  disabled: !clipboard },
        { label: 'Convert → PDF', icon: 'picture_as_pdf',            action: () => {},      dividerAfter: false },
        { label: 'PDF → Image',   icon: 'image',                     action: () => {},      dividerAfter: false },
        { label: 'Merge PDFs',    icon: 'merge',                     action: () => {},      dividerAfter: false },
        { label: 'Split PDF',     icon: 'call_split',                action: () => {},      dividerAfter: true  },
        { label: 'Delete',        icon: 'delete',                    action: handleDelete,  dividerAfter: false, danger: true },
      ];
    }
    return [
      { label: 'New Folder',   icon: 'create_new_folder', action: () => handleNewFolder(),            dividerAfter: false },
      { label: 'New File',     icon: 'note_add',          action: handleNewFile,                      dividerAfter: true  },
      { label: 'Upload Files', icon: 'upload',       action: () => fileInputRef.current?.click(), dividerAfter: true  },
      { label: 'Paste',        icon: 'content_paste',     action: handlePaste, disabled: !clipboard,  dividerAfter: false },
      { label: 'Select All',   icon: 'select_all',        action: () => setSelectedIds(new Set(visibleItems.map((i) => i.id))), dividerAfter: false },
    ];
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Sort toggle
  // ─────────────────────────────────────────────────────────────────────────

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="dc" onContextMenu={(e) => e.preventDefault()}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="dc__sidebar">
        <div className="dc__sidebar-header">
          <span className="material-symbols-rounded dc__sidebar-logo">folder_open</span>
          <h2 className="dc__sidebar-title">Files</h2>
        </div>

        {/* Folder tree */}
        <div className="dc__tree">
          <SidebarNode
            folder={folders[ROOT_ID]}
            folders={folders}
            currentFolderId={currentFolderId}
            depth={0}
            onSelect={setCurrentFolderId}
            onContextMenu={(e, folderId) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, itemId: folderId }); }}
            dragOverId={sidebarDragOver}
            onDragEnter={handleSidebarDragEnter}
            onDragLeave={handleSidebarDragLeave}
            onDrop={handleSidebarDrop}
          />
        </div>

        {/* Sidebar actions */}
        <div className="dc__sidebar-actions">
          <button className="dc__sidebar-action-btn" onClick={() => handleNewFolder()} title="New Folder">
            <span className="material-symbols-rounded">create_new_folder</span>
            <span>New Folder</span>
          </button>
          <button className="dc__sidebar-action-btn" onClick={() => fileInputRef.current?.click()} title="Upload">
            <span className="material-symbols-rounded">upload</span>
            <span>Upload</span>
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <main className="dc__main">

        {/* ── Toolbar ────────────────────────────────────────────────────── */}
        <div className="dc__toolbar">
          <div className="dc__toolbar-left">

            {/* Breadcrumb navigation */}
            <div className="dc__breadcrumb">
              {breadcrumb.map((f, i) => (
                <React.Fragment key={f.id}>
                  {i > 0 && (
                    <span className="material-symbols-rounded dc__breadcrumb-sep">chevron_right</span>
                  )}
                  <button
                    className={`dc__breadcrumb-item ${i === breadcrumb.length - 1 ? 'dc__breadcrumb-item--active' : ''}`}
                    onClick={() => setCurrentFolderId(f.id)}
                  >
                    {f.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="dc__toolbar-right">

            {/* Search */}
            <div className="dc__search">
              <span className="material-symbols-rounded dc__search-icon">search</span>
              <input
                type="text"
                className="dc__search-input"
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* File operations — visible when items selected */}
            {selectedIds.size > 0 && (
              <div className="dc__ops">
                <button className="dc__op-btn" onClick={handleCopy}  title="Copy (Ctrl+C)">
                  <span className="material-symbols-rounded">content_copy</span>
                </button>
                <button className="dc__op-btn" onClick={handleCut}   title="Cut (Ctrl+X)">
                  <span className="material-symbols-rounded">content_cut</span>
                </button>
                <button className="dc__op-btn" onClick={handlePaste} title="Paste (Ctrl+V)" disabled={!clipboard}>
                  <span className="material-symbols-rounded">content_paste</span>
                </button>
                <button
                  className="dc__op-btn"
                  onClick={() => { const f = visibleItems.find((i) => selectedIds.has(i.id)); if (f) handleRenameStart(f.id, f.name); }}
                  title="Rename (F2)"
                >
                  <span className="material-symbols-rounded">drive_file_rename_outline</span>
                </button>
                <button className="dc__op-btn dc__op-btn--danger" onClick={handleDelete} title="Delete">
                  <span className="material-symbols-rounded">delete</span>
                </button>
              </div>
            )}

            {/* Convert */}
            <div className="dc__convert-wrap">
              <button className="dc__toolbar-btn" onClick={() => setShowConvertMenu((p) => !p)}>
                <span className="material-symbols-rounded">transform</span>
                <span>Convert</span>
              </button>
              {showConvertMenu && (
                <div className="dc__convert-menu">
                  {CONVERT_OPTIONS.map((opt) => (
                    <button key={opt.label} className="dc__convert-item" onClick={() => setShowConvertMenu(false)}>
                      <span className="material-symbols-rounded">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View toggle */}
            <div className="dc__view-toggle">
              <button className={`dc__view-btn ${viewMode === 'grid' ? 'dc__view-btn--active' : ''}`} onClick={() => setViewMode('grid')} title="Grid">
                <span className="material-symbols-rounded">grid_view</span>
              </button>
              <button className={`dc__view-btn ${viewMode === 'list' ? 'dc__view-btn--active' : ''}`} onClick={() => setViewMode('list')} title="List">
                <span className="material-symbols-rounded">view_list</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── File area ────────────────────────────────────────────────── */}
        <div
          className={`dc__file-area ${isDraggingOver ? 'dc__file-area--dragging' : ''}`}
          onDragOver={handleAreaDragOver}
          onDragLeave={handleAreaDragLeave}
          onDrop={handleAreaDrop}
          onContextMenu={handleAreaContextMenu}
          onClick={() => setSelectedIds(new Set())}
        >
          {/* Empty state */}
          {visibleItems.length === 0 && (
            <div className="dc__empty">
              <span className="material-symbols-rounded dc__empty-icon">
                {isDraggingOver ? 'file_download' : 'folder_open'}
              </span>
              <p className="dc__empty-title">{isDraggingOver ? 'Drop files here' : 'This folder is empty'}</p>
              <p className="dc__empty-sub">Right-click to create files or folders, or drag files in.</p>
            </div>
          )}

          {/* ── Grid view ────────────────────────────────────────────── */}
          {visibleItems.length > 0 && viewMode === 'grid' && (
            <div className="dc__grid">
              {visibleItems.map((item) => (
                <div
                  key={item.id}
                  className={`dc__grid-card ${selectedIds.has(item.id) ? 'dc__grid-card--selected' : ''} ${item.isFolder ? 'dc__grid-card--folder' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleItemClick(e, item.id); }}
                  onDoubleClick={() => handleItemDoubleClick(item)}
                  onContextMenu={(e) => handleItemContextMenu(e, item.id)}
                  draggable
                  onDragStart={(e) => handleItemDragStart(e, item.id)}
                >
                  <div className="dc__grid-card-icon">
                    <span className="material-symbols-rounded">
                      {getFileIcon(item.name, item.isFolder)}
                    </span>
                  </div>

                  {renamingId === item.id ? (
                    <input
                      ref={renameInputRef}
                      className="dc__rename-input"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={handleRenameCommit}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRenameCommit(); if (e.key === 'Escape') setRenamingId(null); }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className="dc__grid-card-name" title={item.name}>{item.name}</p>
                  )}
                  <p className="dc__grid-card-meta">
                    {item.isFolder
                      ? `${(folders[item.id]?.children?.length ?? 0)} items`
                      : formatSize(item.size)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ── List view ────────────────────────────────────────────── */}
          {visibleItems.length > 0 && viewMode === 'list' && (
            <div className="dc__list">
              <div className="dc__list-header">
                <button className="dc__list-col dc__list-col--name dc__sort-btn" onClick={() => toggleSort('name')}>
                  Name {sortBy === 'name' && <span className="material-symbols-rounded dc__sort-arrow">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
                </button>
                <button className="dc__list-col dc__list-col--size dc__sort-btn" onClick={() => toggleSort('size')}>
                  Size {sortBy === 'size' && <span className="material-symbols-rounded dc__sort-arrow">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
                </button>
                <button className="dc__list-col dc__list-col--date dc__sort-btn" onClick={() => toggleSort('date')}>
                  Modified {sortBy === 'date' && <span className="material-symbols-rounded dc__sort-arrow">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
                </button>
                <span className="dc__list-col dc__list-col--actions" />
              </div>

              {visibleItems.map((item) => (
                <div
                  key={item.id}
                  className={`dc__list-row ${selectedIds.has(item.id) ? 'dc__list-row--selected' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleItemClick(e, item.id); }}
                  onDoubleClick={() => handleItemDoubleClick(item)}
                  onContextMenu={(e) => handleItemContextMenu(e, item.id)}
                  draggable
                  onDragStart={(e) => handleItemDragStart(e, item.id)}
                >
                  <div className="dc__list-col dc__list-col--name">
                    <span className="material-symbols-rounded dc__list-row-icon">
                      {getFileIcon(item.name, item.isFolder)}
                    </span>
                    {renamingId === item.id ? (
                      <input
                        ref={renameInputRef}
                        className="dc__rename-input"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={handleRenameCommit}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleRenameCommit(); if (e.key === 'Escape') setRenamingId(null); }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="dc__list-row-name">{item.name}</span>
                    )}
                  </div>
                  <span className="dc__list-col dc__list-col--size">
                    {item.isFolder ? `${folders[item.id]?.children?.length ?? 0} items` : formatSize(item.size)}
                  </span>
                  <span className="dc__list-col dc__list-col--date">{formatDate(item.date)}</span>
                  <div className="dc__list-col dc__list-col--actions">
                    {!item.isFolder && (
                      <button className="dc__list-action-btn" onClick={(e) => { e.stopPropagation(); handleDownloadFile(item); }} title="Download">
                        <span className="material-symbols-rounded">download</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="dc__statusbar">
          <span>{visibleItems.filter((i) => !i.isFolder).length} file{visibleItems.filter((i) => !i.isFolder).length !== 1 ? 's' : ''}</span>
          <span>{visibleItems.filter((i) => i.isFolder).length} folder{visibleItems.filter((i) => i.isFolder).length !== 1 ? 's' : ''}</span>
          {selectedIds.size > 0 && <span>{selectedIds.size} selected</span>}
          {clipboard && (
            <span className="dc__statusbar-clipboard">
              <span className="material-symbols-rounded">content_paste</span>
              {clipboard.ids.size} in clipboard ({clipboard.mode})
            </span>
          )}
        </div>
      </main>

      {/* ── Context menu ─────────────────────────────────────────────────── */}
      {contextMenu && (() => {
        const items = buildContextItems();
        return (
          <div
            className="dc__context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((item) => (
              <React.Fragment key={item.label}>
                <button
                  className={['dc__context-item', item.danger ? 'dc__context-item--danger' : '', item.disabled ? 'dc__context-item--disabled' : ''].filter(Boolean).join(' ')}
                  onClick={() => { if (!item.disabled) { item.action(); setContextMenu(null); } }}
                  disabled={item.disabled}
                >
                  <span className="material-symbols-rounded">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
                {item.dividerAfter && <div className="dc__context-divider" />}
              </React.Fragment>
            ))}
          </div>
        );
      })()}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" multiple className="dc__hidden-input" onChange={handleFileInputChange} />

      {/* Preview modal */}
      <Viewer
        file={previewFile}
        objectUrl={previewObjectUrl}
        textContent={previewText}
        onClose={handlePreviewClose}
        onDownload={previewFile ? () => handleDownloadFile({ file: previewFile, name: previewFile.name }) : undefined}
      />
    </div>
  );
};

export default DownloadCenter;