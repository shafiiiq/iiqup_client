import { DOCUMENT_VIEWS, DOCUMENT_VIEW_TABS, DRAGGED_DOCUMENT_TYPE } from '../constants/document.constant';

export const PICKER_ROOT_KEY = 'root';

const FOLDER_ICON_NAME = 'FolderIcon';

export const buildSourceNodeKey = (sourceId) => `source:${sourceId}`;

export const buildViewNodeKey = (sourceId, viewKey) => `source:${sourceId}:view:${viewKey}`;

export const buildFolderNodeKey = (sourceId, folderId) => `source:${sourceId}:folder:${folderId}`;

const buildDocumentFolderNodes = ({ sourceType, sourceId, selection, area, parentFolderId, onActivate }) =>
  selection.folders
    .filter(
      (folderItem) =>
        (folderItem.parentFolderId || null) === parentFolderId && (parentFolderId || (folderItem.area || 'all') === area)
    )
    .map((folderItem) => ({
      key: buildFolderNodeKey(sourceId, folderItem._id),
      label: folderItem.name,
      iconName: FOLDER_ICON_NAME,
      badge: selection.folderItemCounts[folderItem._id] ?? 0,
      isActive: selection.currentFolderId === folderItem._id,
      onActivate,
      dropMimeType: DRAGGED_DOCUMENT_TYPE,
      onDropPayload: (payload) => selection.onDropDocuments(payload, folderItem._id),
      payload: {
        kind: 'documentFolder',
        sourceType,
        sourceId,
        folderId: folderItem._id,
        area: folderItem.area || 'all',
        sourceNodeKey: buildSourceNodeKey(sourceId),
      },
      children: buildDocumentFolderNodes({
        sourceType,
        sourceId,
        selection,
        area,
        parentFolderId: folderItem._id,
        onActivate,
      }),
    }));

const buildViewNodes = ({ sourceType, sourceId, selection, onActivate }) =>
  DOCUMENT_VIEW_TABS.map((viewTab) => {
    const isAllView = viewTab.key === DOCUMENT_VIEWS.ALL;
    const selectedTab = selection ? selection.viewTabItems.find((tab) => tab.key === viewTab.key) : null;

    return {
      key: buildViewNodeKey(sourceId, viewTab.key),
      label: viewTab.label,
      iconName: viewTab.iconName,
      badge: selectedTab ? selectedTab.badge : undefined,
      isForcedOpen: Boolean(selection) && isAllView,
      isActive: selection ? selection.activeView === viewTab.key && selection.currentFolderId === null : undefined,
      onActivate,
      dropMimeType: selection ? DRAGGED_DOCUMENT_TYPE : undefined,
      onDropPayload: selection ? (payload) => selection.onDropDocuments(payload, null, viewTab.key) : undefined,
      payload: {
        kind: 'view',
        sourceType,
        sourceId,
        viewKey: viewTab.key,
        sourceNodeKey: buildSourceNodeKey(sourceId),
      },
      children: selection
        ? buildDocumentFolderNodes({ sourceType, sourceId, selection, area: viewTab.key, parentFolderId: null, onActivate })
        : [],
    };
  });

const buildSourceNode = ({ collection, item, selection, onActivate }) => {
  const sourceId = item._id || item.id;
  const sourceType = collection.sourceType;
  const primaryText = collection.getItemPrimaryText(item);
  const secondaryText = collection.getItemSecondaryText ? collection.getItemSecondaryText(item) : null;
  const isSelectedSource = Boolean(selection) && selection.sourceId === sourceId;
  const activeSelection = isSelectedSource ? selection : null;

  return {
    key: buildSourceNodeKey(sourceId),
    label: secondaryText ? `${primaryText} - ${secondaryText}` : String(primaryText),
    iconName: FOLDER_ICON_NAME,
    isForcedOpen: isSelectedSource,
    isActive: activeSelection
      ? activeSelection.activeView === DOCUMENT_VIEWS.SOURCE && activeSelection.currentFolderId === null
      : undefined,
    onActivate,
    dropMimeType: activeSelection ? DRAGGED_DOCUMENT_TYPE : undefined,
    onDropPayload: activeSelection
      ? (payload) => activeSelection.onDropDocuments(payload, null, DOCUMENT_VIEWS.SOURCE)
      : undefined,
    payload: { kind: 'source', sourceType, sourceId, sourceNodeKey: buildSourceNodeKey(sourceId) },
    children: [
      ...buildViewNodes({ sourceType, sourceId, selection: activeSelection, onActivate }),
      ...(activeSelection
        ? buildDocumentFolderNodes({
            sourceType,
            sourceId,
            selection: activeSelection,
            area: DOCUMENT_VIEWS.SOURCE,
            parentFolderId: null,
            onActivate,
          })
        : []),
    ],
  };
};

const buildSidebarNode = ({ node, selection, onActivate }) => {
  const baseNode = {
    key: node.key,
    label: node.label,
    iconName: node.icon,
    onActivate,
    payload: { kind: 'folder' },
  };

  if (node.type === 'collection') {
    return {
      ...baseNode,
      children: (node.items || []).map((item) => buildSourceNode({ collection: node, item, selection, onActivate })),
    };
  }

  return {
    ...baseNode,
    children: (node.children || []).map((childNode) => buildSidebarNode({ node: childNode, selection, onActivate })),
  };
};

export const buildSidebarRoot = ({ root, selection, onActivate }) => ({
  ...buildSidebarNode({ node: root, selection, onActivate }),
  iconName: FOLDER_ICON_NAME,
});

export const findKeyPath = (nodes, targetKey) => {
  for (const node of nodes) {
    if (node.key === targetKey) return [node.key];
    const childPath = node.children ? findKeyPath(node.children, targetKey) : null;
    if (childPath) return [node.key, ...childPath];
  }
  return null;
};