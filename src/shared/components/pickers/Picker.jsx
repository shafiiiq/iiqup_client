import FolderPicker from '@/shared/components/pickers/folder/FolderPicker';
import { useEquipmentPickerNode } from '@/shared/components/pickers/equipment/equipmentPicker.tree';
import { useUserPickerNode } from '@/shared/components/pickers/user/userPicker.tree';

function usePickerRoot(types, onSelect) {
    const nodesByType = {
        equipment: useEquipmentPickerNode((item, meta) => onSelect('equipment', item, meta)),
        user: useUserPickerNode((item, meta) => onSelect('user', item, meta)),
    };

    const children = types.map((typeKey) => nodesByType[typeKey]).filter(Boolean);
    const searchableChildren = children.filter((child) => child.search);

    const rootSearch = searchableChildren.length
        ? {
            items: searchableChildren.flatMap((child) =>
                child.search.items.map((item) => ({ ...item, __nodeKey: child.key }))
            ),
            isLoading: searchableChildren.some((child) => child.search.isLoading),
            isLoadingMore: false,
            hasMore: searchableChildren.some((child) => child.search.hasMore),
            onLoadMore: undefined,
            getItemKey: (item) => `${item.__nodeKey}-${searchableChildren.find((c) => c.key === item.__nodeKey).search.getItemKey(item)}`,
            getItemPrimaryText: (item) => searchableChildren.find((c) => c.key === item.__nodeKey).search.getItemPrimaryText(item),
            getItemSecondaryText: (item) => searchableChildren.find((c) => c.key === item.__nodeKey).search.getItemSecondaryText?.(item),
            renderItem: undefined,
            resolveItemRenderer: (item) => {
                const childCollection = searchableChildren.find((c) => c.key === item.__nodeKey).search;
                return childCollection.renderItem;
            },
            onSelectItem: (item) => searchableChildren.find((c) => c.key === item.__nodeKey).search.onSelectItem(item),
        }
        : undefined;

    return {
        type: 'folder',
        key: 'root',
        label: 'Root',
        icon: 'home',
        children,
        search: rootSearch,
    };
}

function Picker({ types, onSelect }) {
    const root = usePickerRoot(types, onSelect);
    return <FolderPicker root={root} />;
}

export default Picker;