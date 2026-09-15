import { useEffect, useState } from 'react';
import { apiRequest } from '@/features/core/network/api/api.request';
import { useSearch as useUserSearch } from '@/shared/search/useSearch';
import { useSearch as useHeaderSearch } from '@/shared/context/SearchContext';
import { SEARCH_SOURCES } from '@/shared/search/search.constant';

const USER_SECTIONS = [
    { key: 'staff', label: 'Office', icon: 'business_center', endpoint: '/users/staff', extract: (data) => data.data || [] },
    { key: 'mechanic', label: 'Mechanics', icon: 'engineering', endpoint: '/users/mechanics', extract: (data) => data.data || [], searchSource: SEARCH_SOURCES.MECHANICS },
    { key: 'operator', label: 'Operators', icon: 'person', endpoint: '/users/operators', extract: (data) => data.data || [], searchSource: SEARCH_SOURCES.OPERATORS },
];

function useUserSections() {
    const [usersBySection, setUsersBySection] = useState({ staff: [], mechanic: [], operator: [] });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAllSections = async () => {
            setIsLoading(true);
            try {
                const results = await Promise.all(
                    USER_SECTIONS.map(async (section) => {
                        try {
                            const response = await apiRequest(section.endpoint, 'GET');
                            const data = await response.json();
                            return [section.key, section.extract(data)];
                        } catch (error) {
                            console.error(`Error fetching ${section.key}:`, error);
                            return [section.key, []];
                        }
                    })
                );
                setUsersBySection(Object.fromEntries(results));
            } finally {
                setIsLoading(false);
            }
        };

        loadAllSections();
    }, []);

    return { usersBySection, isLoading };
}

export function useUserPickerNode(onSelect) {
    const { usersBySection, isLoading } = useUserSections();
    const staffSearch = useUserSearch({ source: SEARCH_SOURCES.USERS });
    const mechanicSearch = useUserSearch({ source: SEARCH_SOURCES.MECHANICS });
    const operatorSearch = useUserSearch({ source: SEARCH_SOURCES.OPERATORS });
    const { searchTerm } = useHeaderSearch();

    const searchBySection = { staff: staffSearch, mechanic: mechanicSearch, operator: operatorSearch };

    useEffect(() => {
        const term = searchTerm.trim();
        Object.values(searchBySection).forEach((s) => (term ? s.search(term) : s.clear()));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const buildSearchCollection = (section, search) => ({
        items: search.results,
        isLoading: search.loading,
        isLoadingMore: false,
        hasMore: search.hasMore,
        onLoadMore: search.loadMore,
        getItemKey: (user) => user._id || user.id || user.qatarId,
        getItemPrimaryText: (user) => user.name,
        getItemSecondaryText: () => null,
        onSelectItem: (user) => onSelect(user, section.key),
    });

    const sectionNodes = USER_SECTIONS.map((section) => ({
        type: 'collection',
        key: `user-section-${section.key}`,
        label: section.label,
        icon: section.icon,
        items: usersBySection[section.key] || [],
        isLoading,
        isLoadingMore: false,
        hasMore: false,
        onLoadMore: undefined,
        getItemKey: (user) => user._id || user.id || user.qatarId,
        getItemPrimaryText: (user) => user.name,
        getItemSecondaryText: () => null,
        onSelectItem: (user) => onSelect(user, section.key),
        search: buildSearchCollection(section, searchBySection[section.key]),
    }));

       const combinedUsersSearchCollection = {
        items: USER_SECTIONS.flatMap((section) =>
            searchBySection[section.key].results.map((u) => ({ ...u, __sectionKey: section.key }))
        ),
        isLoading: Object.values(searchBySection).some((s) => s.loading),
        isLoadingMore: false,
        hasMore: Object.values(searchBySection).some((s) => s.hasMore),
        onLoadMore: undefined,
        getItemKey: (user) => user._id || user.id || user.qatarId,
        getItemPrimaryText: (user) => user.name,
        getItemSecondaryText: (user) => USER_SECTIONS.find((s) => s.key === user.__sectionKey)?.label,
        onSelectItem: (user) => onSelect(user, user.__sectionKey),
    };

    return {
        type: 'folder',
        key: 'users',
        label: 'Users',
        icon: 'group',
        isLoading,
        hasMore: false,
        isLoadingMore: false,
        onLoadMore: undefined,
        children: sectionNodes,
        search: combinedUsersSearchCollection,
    };
}