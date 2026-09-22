import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/features/core/network/api/api.request';
import { appendPaginationToUrl } from '@/shared/pagination/pagination.util';
import { useSearch as useEquipmentSearch } from '@/shared/search/useSearch';
import { useSearch as useHeaderSearch } from '@/shared/context/SearchContext';
import { SEARCH_SOURCES } from '@/shared/search/search.constant';
import EquipmentItemCard from './EquipmentItemCard';

const EQUIPMENT_PAGE_SIZE = 200;

function useEquipmentDataset() {
    const [equipments, setEquipments] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const fetchPage = async (targetPage, append) => {
        append ? setIsLoadingMore(true) : setIsLoading(true);
        try {
            const url = appendPaginationToUrl('/equipments', { page: targetPage, limit: EQUIPMENT_PAGE_SIZE });
            const response = await apiRequest(url, 'GET');
            const data = await response.json();
            if (!data.ok) throw new Error(data.message || 'Failed to fetch equipments');
            setPage(data.pagination.currentPage);
            setHasMore(data.pagination.hasMore);
            setEquipments((prev) => (append ? [...prev, ...data.data] : data.data));
        } catch (error) {
            console.error('Error fetching equipments:', error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchPage(1, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadMore = () => {
        if (!hasMore || isLoadingMore || isLoading) return;
        fetchPage(page + 1, true);
    };

    return { equipments, isLoading, isLoadingMore, hasMore, loadMore };
}


function buildEquipmentCollection(items, onSelect, dataset) {
    return {
        type: 'collection',
        items,
        isLoading: false,
        isLoadingMore: dataset.isLoadingMore,
        hasMore: dataset.hasMore,
        onLoadMore: dataset.loadMore,
        getItemKey: (equipment) => equipment._id || equipment.regNo,
        getItemPrimaryText: (equipment) => equipment.regNo,
        getItemSecondaryText: (equipment) => equipment.machine,
        renderItem: EquipmentItemCard,
        onSelectItem: onSelect,
    };
}

function groupEquipmentsByCategory(equipments, onSelect, dataset) {
    const categoryMap = new Map();

    equipments.forEach((equipment) => {
        const categoryKey = equipment.category || equipment.machine || 'Other';
        if (!categoryMap.has(categoryKey)) categoryMap.set(categoryKey, []);
        categoryMap.get(categoryKey).push(equipment);
    });

    return Array.from(categoryMap.entries()).map(([categoryName, categoryItems]) => {
        const subCategoryMap = new Map();
        const uncategorized = [];

        categoryItems.forEach((equipment) => {
            if (equipment.subCategory) {
                if (!subCategoryMap.has(equipment.subCategory)) subCategoryMap.set(equipment.subCategory, []);
                subCategoryMap.get(equipment.subCategory).push(equipment);
            } else {
                uncategorized.push(equipment);
            }
        });

        if (subCategoryMap.size === 0) {
            return {
                type: 'collection',
                key: `equipment-category-${categoryName}`,
                label: categoryName,
                icon: 'CraneIcon',
                ...buildEquipmentCollection(uncategorized, onSelect, dataset),
            };
        }

        const subCategoryNodes = Array.from(subCategoryMap.entries())
            .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
            .map(([subCategoryName, items]) => ({
                type: 'folder',
                key: `equipment-category-${categoryName}-${subCategoryName}`,
                label: subCategoryName,
                icon: 'IconlyWeight',
                children: [],
                search: undefined,
                ...buildEquipmentCollection(items, onSelect, dataset),
            }));

        if (uncategorized.length) {
            subCategoryNodes.push({
                type: 'collection',
                key: `equipment-category-${categoryName}-general`,
                label: 'General',
                icon: 'IconlyFolder',
                ...buildEquipmentCollection(uncategorized, onSelect, dataset),
            });
        }

        return {
            type: 'folder',
            key: `equipment-category-${categoryName}`,
            label: categoryName,
            icon: 'CraneIcon',
            isLoading: false,
            hasMore: false,
            isLoadingMore: false,
            onLoadMore: undefined,
            children: subCategoryNodes,
        };
    });
}

export function useEquipmentPickerNode(onSelect) {
    const dataset = useEquipmentDataset();
    const search = useEquipmentSearch({ source: SEARCH_SOURCES.EQUIPMENT });
    const { searchTerm } = useHeaderSearch();

    useEffect(() => {
        searchTerm.trim() ? search.search(searchTerm.trim()) : search.clear();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const categoryNodes = useMemo(
        () => groupEquipmentsByCategory(dataset.equipments, onSelect, dataset),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dataset.equipments, dataset.isLoadingMore, dataset.hasMore, dataset.loadMore, onSelect]
    );

    const equipmentSearchCollection = useMemo(
        () => ({
            items: search.results,
            isLoading: search.loading,
            isLoadingMore: false,
            hasMore: search.hasMore,
            onLoadMore: search.loadMore,
            getItemKey: (equipment) => equipment._id || equipment.regNo,
            getItemPrimaryText: (equipment) => equipment.regNo,
            getItemSecondaryText: (equipment) => equipment.machine,
            renderItem: EquipmentItemCard,
            onSelectItem: onSelect,
        }),
        [search.results, search.loading, search.hasMore, search.loadMore, onSelect]
    );

    return useMemo(
        () => ({
            type: 'folder',
            key: 'equipments',
            label: 'Equipments',
            icon: 'CraneIcon',
            isLoading: dataset.isLoading,
            hasMore: dataset.hasMore,
            isLoadingMore: dataset.isLoadingMore,
            onLoadMore: dataset.loadMore,
            children: categoryNodes,
            search: equipmentSearchCollection,
        }),
        [dataset.isLoading, dataset.hasMore, dataset.isLoadingMore, dataset.loadMore, categoryNodes, equipmentSearchCollection]
    );
}