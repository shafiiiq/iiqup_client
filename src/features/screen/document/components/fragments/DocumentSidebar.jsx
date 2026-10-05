import { memo } from 'react';
import Tabs from '@/shared/components/widgets/tabs/Tabs';

const DocumentSidebar = memo(function DocumentSidebar({ items, activePath, onSelect, onSearchChange }) {
  return (
    <Tabs
      maxHeight="1090px"
      title={null}
      items={items}
      activePath={activePath}
      onSelect={onSelect}
      showSearch
      filterOnSearch
      externalFilter
      onSearchChange={onSearchChange}
      mergeOpenKeys
      searchShortcut={null}
      searchPlaceholder="Search"
    />
  );
});

export default DocumentSidebar;