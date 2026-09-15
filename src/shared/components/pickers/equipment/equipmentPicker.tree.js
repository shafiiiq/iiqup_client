import { useEffect, useState } from 'react';
import { apiRequest } from '@/features/core/network/api/api.request';
import { appendPaginationToUrl } from '@/shared/pagination/pagination.util';
import { useSearch as useEquipmentSearch } from '@/shared/search/useSearch';
import { useSearch as useHeaderSearch } from '@/shared/context/SearchContext';
import { SEARCH_SOURCES } from '@/shared/search/search.constant';

const EQUIPMENT_PAGE_SIZE = 30;

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

function groupEquipmentsByMachine(equipments) {
    const groups = new Map();
    equipments.forEach((equipment) => {
        const machineName = equipment.machine || 'Unspecified';
        if (!groups.has(machineName)) groups.set(machineName, []);
        groups.get(machineName).push(equipment);
    });
    return Array.from(groups.entries()).map(([machineName, items]) => ({ machineName, items }));
}

export function useEquipmentPickerNode(onSelect) {
    const dataset = useEquipmentDataset();
    const search = useEquipmentSearch({ source: SEARCH_SOURCES.EQUIPMENT });
    const { searchTerm } = useHeaderSearch();

    useEffect(() => {
        searchTerm.trim() ? search.search(searchTerm.trim()) : search.clear();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const categoryNodes = groupEquipmentsByMachine(dataset.equipments).map(({ machineName, items }) => ({
        type: 'collection',
        key: `equipment-category-${machineName}`,
        label: machineName,
        icon: 'category',
        items,
        isLoading: false,
        isLoadingMore: dataset.isLoadingMore,
        hasMore: dataset.hasMore,
        onLoadMore: dataset.loadMore,
        getItemKey: (equipment) => equipment._id || equipment.regNo,
        getItemPrimaryText: (equipment) => equipment.regNo,
        getItemSecondaryText: () => undefined,
        onSelectItem: onSelect,
    }));

    const equipmentSearchCollection = {
        items: search.results,
        isLoading: search.loading,
        isLoadingMore: false,
        hasMore: search.hasMore,
        onLoadMore: search.loadMore,
        getItemKey: (equipment) => equipment._id || equipment.regNo,
        getItemPrimaryText: (equipment) => equipment.regNo,
        getItemSecondaryText: (equipment) => equipment.machine,
        onSelectItem: onSelect,
    };

    return {
        type: 'folder',
        key: 'equipments',
        label: 'Equipments',
        icon: 'construction',
        isLoading: dataset.isLoading,
        hasMore: dataset.hasMore,
        isLoadingMore: dataset.isLoadingMore,
        onLoadMore: dataset.loadMore,
        children: categoryNodes,
        search: equipmentSearchCollection,
    };
}