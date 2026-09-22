import { useEffect, useRef, useState, memo } from 'react';
import './FolderPicker.css';
import { useSearch as useHeaderSearch } from '@/shared/context/SearchContext';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import Skeleton from '@/shared/components/widgets/loader/skeleton/Skeleton';
import LoadMoreSkeleton from '@/shared/components/widgets/loader/skeleton/LoadMoreSkeleton';

const FOLDER_PICKER_INTERSECTION_ROOT_MARGIN = '400px';
const FOLDER_PICKER_SKELETON_COUNT = 6;
const FOLDER_PICKER_LOAD_MORE_SKELETON_COUNT = 3;

function resolveActivePath(root, keys) {
    const resolved = [root];
    let current = root;
    for (let index = 1; index < keys.length; index += 1) {
        const next = (current.children || []).find((child) => child.key === keys[index]);
        if (!next) break;
        resolved.push(next);
        current = next;
    }
    return resolved;
}

function findSearchCollection(activePath) {
    for (let index = activePath.length - 1; index >= 0; index -= 1) {
        if (activePath[index].search) return activePath[index].search;
    }
    return null;
}

function FolderIcon({ iconName }) {
    return renderComponentIcon(iconName, 130, 'var(--color-primary-200)')
}

const FolderCard = memo(function FolderCard({ node, onOpen }) {
    return (
        <button type="button" className="shared pickers folder folder-card" onClick={() => onOpen(node)}>
            <FolderIcon iconName={node.icon} />
            <span className="shared pickers folder folder-card-label">{node.label}</span>
        </button>
    );
});

const ItemCard = memo(function ItemCard({ item, collection }) {
    const primary = collection.getItemPrimaryText(item);
    const secondary = collection.getItemSecondaryText ? collection.getItemSecondaryText(item) : undefined;
    return (
        <button type="button" className="shared pickers folder item-card" onClick={() => collection.onSelectItem(item)}>
            <span className="shared pickers folder item-card-primary">{primary}</span>
            {secondary && <span className="shared pickers folder item-card-separator">-</span>}
            {secondary && <span className="shared pickers folder item-card-secondary">{secondary}</span>}
        </button>
    );
});

function FolderCardSkeleton() {
    return (
        <div className="shared pickers folder folder-card folder-card-skeleton">
            <Skeleton width="48px" height="48px" circle />
            <Skeleton width="70%" height="14px" />
        </div>
    );
}

function ItemCardSkeleton() {
    return (
        <div className="shared pickers folder item-card item-card-skeleton">
            <Skeleton width="60%" height="14px" />
            <Skeleton width="85%" height="12px" />
        </div>
    );
}

function Breadcrumb({ activePath, onNavigate }) {
    return (
        <div className="shared pickers folder breadcrumb">
            {activePath.map((node, index) => (
                <span key={node.key} className="shared pickers folder breadcrumb-segment">
                    <button type="button" className="shared pickers folder breadcrumb-item" onClick={() => onNavigate(index)}>
                        {node.label}
                    </button>
                    {index < activePath.length - 1 && (
                        <span className="shared pickers folder breadcrumb-separator">{'>'}</span>
                    )}
                </span>
            ))}
        </div>
    );
}

function FolderPicker({ root }) {
    const [pathKeys, setPathKeys] = useState([root.key]);
    const { searchTerm } = useHeaderSearch();
    const sentinelRef = useRef(null);

    const activePath = resolveActivePath(root, pathKeys);
    const activeNode = activePath[activePath.length - 1];
    const searchCollection = searchTerm.trim() ? findSearchCollection(activePath) : null;
    const activeCollection = searchCollection || (activeNode.type === 'collection' ? activeNode : null);

    const hasMore = activeCollection ? activeCollection.hasMore : activeNode.hasMore;
    const isLoadingMore = activeCollection ? activeCollection.isLoadingMore : activeNode.isLoadingMore;
    const onLoadMore = activeCollection ? activeCollection.onLoadMore : activeNode.onLoadMore;

    useEffect(() => {
        if (!hasMore || isLoadingMore || !onLoadMore) return undefined;
        const sentinel = sentinelRef.current;
        if (!sentinel) return undefined;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) onLoadMore();
            },
            { root: null, rootMargin: FOLDER_PICKER_INTERSECTION_ROOT_MARGIN, threshold: 0 }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, onLoadMore, activeNode, activeCollection]);

    const openFolder = (node) => setPathKeys((prev) => [...prev, node.key]);
    const navigateToIndex = (index) => setPathKeys((prev) => prev.slice(0, index + 1));

    const renderBody = () => {
        if (activeCollection) {
            if (activeCollection.isLoading) {
                return (
                    <div className="shared pickers folder item-grid">
                        {Array.from({ length: FOLDER_PICKER_SKELETON_COUNT }).map((_, index) => (
                            <ItemCardSkeleton key={`item-skeleton-${index}`} />
                        ))}
                    </div>
                );
            }
            if (!activeCollection.items.length) {
                return <div className="shared pickers folder status">No results found.</div>;
            }
            return (
                <div className="shared pickers folder item-grid">
                    {activeCollection.items.map((item) => {
                        const ItemComponent =
                            activeCollection.resolveItemRenderer?.(item) || activeCollection.renderItem || ItemCard;
                        return (
                            <ItemComponent key={activeCollection.getItemKey(item)} item={item} collection={activeCollection} />
                        );
                    })}
                    {isLoadingMore && (
                        <LoadMoreSkeleton
                            count={FOLDER_PICKER_LOAD_MORE_SKELETON_COUNT}
                            renderItem={(index) => <ItemCardSkeleton key={`item-load-more-skeleton-${index}`} />}
                        />
                    )}
                    {hasMore && !isLoadingMore && <div ref={sentinelRef} className="shared pickers folder load-more-sentinel" />}
                </div>
            );
        }

        if (activeNode.isLoading) {
            return (
                <div className="shared pickers folder folder-grid">
                    {Array.from({ length: FOLDER_PICKER_SKELETON_COUNT }).map((_, index) => (
                        <FolderCardSkeleton key={`folder-skeleton-${index}`} />
                    ))}
                </div>
            );
        }
        if (!activeNode.children || !activeNode.children.length) {
            return <div className="shared pickers folder status">No folders found.</div>;
        }
        return (
            <div className="shared pickers folder folder-grid">
                {activeNode.children.map((node) => (
                    <FolderCard key={node.key} node={node} onOpen={openFolder} />
                ))}
                {isLoadingMore && (
                    <LoadMoreSkeleton
                        count={FOLDER_PICKER_LOAD_MORE_SKELETON_COUNT}
                        renderItem={(index) => <FolderCardSkeleton key={`folder-load-more-skeleton-${index}`} />}
                    />
                )}
                {hasMore && !isLoadingMore && <div ref={sentinelRef} className="shared pickers folder load-more-sentinel" />}
            </div>
        );
    };

    return (
        <div className="shared pickers folder container">
            <Breadcrumb activePath={activePath} onNavigate={navigateToIndex} />
            {renderBody()}
        </div>
    );
}

export default FolderPicker;