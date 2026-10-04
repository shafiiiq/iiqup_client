import { memo } from 'react';
import Tabs from '@/shared/components/widgets/tabs/Tabs';

const DocumentSidebar = memo(function DocumentSidebar({ items, activePath, onSelect }) {
  return (
    <Tabs
      maxHeight="1090px"
      title={null}
      items={items}
      activePath={activePath}
      onSelect={onSelect}
      showSearch
      filterOnSearch
      mergeOpenKeys
      searchShortcut={null}
      searchPlaceholder="Search"
    />
  );
});

export default DocumentSidebar;