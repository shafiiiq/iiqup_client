import { TRASH_NODE_KEY } from '../constants/document.constant';
import { formatBytes } from './document.helper';

const sourceKeyOf = (collection, item) => `${collection.sourceType}:${item._id || item.id}`;

const measureNode = (node, bySource, trashBytes, bytesByKey) => {
  if (node.key === TRASH_NODE_KEY) {
    bytesByKey[node.key] = trashBytes;
    return { node: { ...node, footer: formatBytes(trashBytes) }, bytes: trashBytes };
  }
  if (node.items) {
    const bytes = node.items.reduce((total, item) => total + (bySource[sourceKeyOf(node, item)] || 0), 0);
    bytesByKey[node.key] = bytes;
    return {
      node: {
        ...node,
        footer: formatBytes(bytes),
        getItemFooter: (item) => formatBytes(bySource[sourceKeyOf(node, item)] || 0),
      },
      bytes,
    };
  }
  const results = (node.children || []).map((child) => measureNode(child, bySource, trashBytes, bytesByKey));
  const bytes = results.reduce((total, result) => total + result.bytes, 0);
  bytesByKey[node.key] = bytes;
  return { node: { ...node, children: results.map((result) => result.node), footer: formatBytes(bytes) }, bytes };
};

export const decoratePickerTree = (root, bySource, trashBytes) => {
  const bytesByKey = {};
  const { node } = measureNode(root, bySource, trashBytes, bytesByKey);
  return { root: node, bytesByKey };
};

export const resolvePathLabel = (root, pathKeys) => {
  let current = root;
  for (let index = 1; index < pathKeys.length; index += 1) {
    const next = (current.children || []).find((child) => child.key === pathKeys[index]);
    if (!next) break;
    current = next;
  }
  return current.label;
};