import { useEffect, useState } from 'react';
import './FolderPicker.css';
import { useSearch as useHeaderSearch } from '@/shared/context/SearchContext';

const FOLDER_PICKER_SCROLL_BOTTOM_OFFSET_PX = 400;
const FOLDER_PICKER_SCROLL_DEBOUNCE_MS = 200;

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

function FolderIcon({ name }) {
    return <span className="material-symbols-rounded shared pickers folder folder-icon">{name || 'folder'}</span>;
}

function FolderCard({ node, onOpen }) {
    return (
        <button type="button" className="shared pickers folder folder-card" onClick={() => onOpen(node)}>
            <FolderIcon name={node.icon} />
            <span className="shared pickers folder folder-card-label">{node.label}</span>
        </button>
    );
}

function ItemCard({ item, collection }) {
    const primary = collection.getItemPrimaryText(item);
    const secondary = collection.getItemSecondaryText ? collection.getItemSecondaryText(item) : undefined;
    return (
        <button type="button" className="shared pickers folder item-card" onClick={() => collection.onSelectItem(item)}>
            <span className="shared pickers folder item-card-primary">{primary}</span>
            {secondary && <span className="shared pickers folder item-card-separator">-</span>}
            {secondary && <span className="shared pickers folder item-card-secondary">{secondary}</span>}
        </button>
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

    const activePath = resolveActivePath(root, pathKeys);
    const activeNode = activePath[activePath.length - 1];
    const searchCollection = searchTerm.trim() ? findSearchCollection(activePath) : null;
    const activeCollection = searchCollection || (activeNode.type === 'collection' ? activeNode : null);

    const hasMore = activeCollection ? activeCollection.hasMore : activeNode.hasMore;
    const isLoadingMore = activeCollection ? activeCollection.isLoadingMore : activeNode.isLoadingMore;
    const onLoadMore = activeCollection ? activeCollection.onLoadMore : activeNode.onLoadMore;

    useEffect(() => {
        if (!hasMore || isLoadingMore || !onLoadMore) return undefined;

        let debounceTimer = null;
        const handleScroll = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const scrollBottom = window.scrollY + window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;
                if (scrollBottom > documentHeight - FOLDER_PICKER_SCROLL_BOTTOM_OFFSET_PX) {
                    onLoadMore();
                }
            }, FOLDER_PICKER_SCROLL_DEBOUNCE_MS);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    }, [hasMore, isLoadingMore, onLoadMore]);

    const openFolder = (node) => setPathKeys((prev) => [...prev, node.key]);
    const navigateToIndex = (index) => setPathKeys((prev) => prev.slice(0, index + 1));

    const renderBody = () => {
        if (activeCollection) {
            if (activeCollection.isLoading) {
                return <div className="shared pickers folder status">Loading...</div>;
            }
            if (!activeCollection.items.length) {
                return <div className="shared pickers folder status">No results found.</div>;
            }
            return (
                <div className="shared pickers folder item-grid">
                    {activeCollection.items.map((item) => (
                        <ItemCard key={activeCollection.getItemKey(item)} item={item} collection={activeCollection} />
                    ))}
                </div>
            );
        }

        if (activeNode.isLoading) {
            return <div className="shared pickers folder status">Loading...</div>;
        }
        if (!activeNode.children || !activeNode.children.length) {
            return <div className="shared pickers folder status">No folders found.</div>;
        }
        return (
            <div className="shared pickers folder folder-grid">
                {activeNode.children.map((node) => (
                    <FolderCard key={node.key} node={node} onOpen={openFolder} />
                ))}
            </div>
        );
    };

    return (
        <div className="shared pickers folder container">
            <Breadcrumb activePath={activePath} onNavigate={navigateToIndex} />
            {renderBody()}
            {isLoadingMore && <div className="shared pickers folder status">Loading more...</div>}
        </div>
    );
}

export default FolderPicker;