import { DOCUMENT_VIEWS, DOCUMENT_VIEW_TABS, DRAGGED_DOCUMENT_TYPE } from '../constants/document.constant';
import { countFolderItems } from './document.helper';

export const PICKER_ROOT_KEY = 'root';

const FOLDER_ICON_NAME = 'FolderIcon';

export const buildSourceNodeKey = (sourceId) => `source:${sourceId}`;

export const buildViewNodeKey = (sourceId, viewKey) => `source:${sourceId}:view:${viewKey}`;

export const buildFolderNodeKey = (sourceId, folderId) => `source:${sourceId}:folder:${folderId}`;

const buildDocumentFolderNodes = ({ sourceType, sourceId, selection, parentFolderId, onActivate }) =>
  selection.folders
    .filter((folderItem) => (folderItem.parentFolderId || null) === parentFolderId)
    .map((folderItem) => ({
      key: buildFolderNodeKey(sourceId, folderItem._id),
      label: folderItem.name,
      iconName: FOLDER_ICON_NAME,
      badge: countFolderItems(selection.documents, selection.folders, folderItem._id),
      isActive: selection.activeView === DOCUMENT_VIEWS.ALL && selection.currentFolderId === folderItem._id,
      onActivate,
      dropMimeType: DRAGGED_DOCUMENT_TYPE,
      onDropPayload: (payload) => selection.onDropDocuments(payload, folderItem._id),
      payload: {
        kind: 'documentFolder',
        sourceType,
        sourceId,
        folderId: folderItem._id,
        sourceNodeKey: buildSourceNodeKey(sourceId),
      },
      children: buildDocumentFolderNodes({
        sourceType,
        sourceId,
        selection,
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
      isActive: selection
        ? selection.activeView === viewTab.key && (!isAllView || selection.currentFolderId === null)
        : undefined,
      onActivate,
      dropMimeType: selection && isAllView ? DRAGGED_DOCUMENT_TYPE : undefined,
      onDropPayload: selection && isAllView ? (payload) => selection.onDropDocuments(payload, null) : undefined,
      payload: {
        kind: 'view',
        sourceType,
        sourceId,
        viewKey: viewTab.key,
        sourceNodeKey: buildSourceNodeKey(sourceId),
      },
      children:
        selection && isAllView
          ? buildDocumentFolderNodes({ sourceType, sourceId, selection, parentFolderId: null, onActivate })
          : [],
    };
  });

const buildSourceNode = ({ collection, item, selection, onActivate }) => {
  const sourceId = item._id || item.id;
  const primaryText = collection.getItemPrimaryText(item);
  const secondaryText = collection.getItemSecondaryText ? collection.getItemSecondaryText(item) : null;
  const isSelectedSource = Boolean(selection) && selection.sourceId === sourceId;

  return {
    key: buildSourceNodeKey(sourceId),
    label: secondaryText ? `${primaryText} - ${secondaryText}` : String(primaryText),
    iconName: FOLDER_ICON_NAME,
    isForcedOpen: isSelectedSource,
    onActivate,
    payload: {
      kind: 'source',
      sourceType: collection.sourceType,
      sourceId,
      sourceNodeKey: buildSourceNodeKey(sourceId),
    },
    children: buildViewNodes({
      sourceType: collection.sourceType,
      sourceId,
      selection: isSelectedSource ? selection : null,
      onActivate,
    }),
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
      children: (node.items || []).map((item) =>
        buildSourceNode({ collection: node, item, selection, onActivate })
      ),
    };
  }

  return {
    ...baseNode,
    children: (node.children || []).map((childNode) =>
      buildSidebarNode({ node: childNode, selection, onActivate })
    ),
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