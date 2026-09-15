export function resolveNavTreeView(rootLabel, tree, selectedPath) {
  let label = rootLabel;
  let levelNodes = tree;
  let depth = 0;

  while (levelNodes?.length) {
    const selectedKey = selectedPath[depth] ?? levelNodes[0].key;
    const selectedNode = levelNodes.find((n) => n.key === selectedKey) ?? levelNodes[0];

    if (selectedNode.children?.length) {
      label = selectedNode.label;
      levelNodes = selectedNode.children;
      depth += 1;
    } else {
      break;
    }
  }

  return {
    label,
    depth,
    options: levelNodes ?? [],
    selectedKey: selectedPath[depth] ?? levelNodes?.[0]?.key,
  };
}