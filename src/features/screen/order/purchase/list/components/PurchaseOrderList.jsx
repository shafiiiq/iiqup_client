import './PurchaseOrderList.css';
import Modal from '@/shared/components/widgets/modal/Modal';
import Controls from '@/shared/components/widgets/controls/Controls';
import Tabs from '@/shared/components/widgets/tabs/Tabs';
import Text from '@/shared/components/widgets/text/Text';
import Toast from '@/shared/components/widgets/toast/Toast';
import Table from '@/shared/components/widgets/table/Table';
import TableSkeleton from '@/shared/components/widgets/table/TableSkeleton';
import LoadMoreSkeleton from '@/shared/components/widgets/loader/skeleton/LoadMoreSkeleton';
import EquipmentPicker from '@/shared/components/pickers/equipment/EquipmentPicker';
import { useMemo, useEffect } from 'react';

import usePurchaseOrderList from '../hooks/usePurchaseOrderList';
import { SHARED_BTN, SIGNATURE_LEGEND_GROUPS, PURCHASE_ORDER_TAB_ITEMS, PURCHASE_ORDER_SCROLL_DEBOUNCE_MS, PURCHASE_ORDER_SCROLL_BOTTOM_OFFSET_PX } from '../constants/purchase.order.list.constant';
import { buildVendorOptions, buildEquipmentTypeOptions, buildFilterGroups } from '../helper/purchase.order.list.helper';
import { buildPurchaseOrderTableColumns } from '../helper/purchase.order.list.column.helper';
import PurchaseOrderStats from './fragments/PurchaseOrderStats';

function PurchaseOrderFiltersPanel({ filterGroups, filterValues, onFilterChange, onApply, onReset }) {
    return (
        <div className="purchase order list filters panel">
            {filterGroups.map((group) => (
                <div key={group.name} className="purchase order list filters field">
                    <Text as="label" variant="label" className="purchase order list filters label">{group.label}</Text>

                    {group.type === 'select' && (
                        <select
                            className="purchase order list filters select"
                            value={filterValues[group.name]}
                            onChange={(e) => onFilterChange(group.name, e.target.value)}
                        >
                            {group.options.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    )}

                    {group.type === 'date' && (
                        <input
                            type="date"
                            className="purchase order list filters date"
                            value={filterValues[group.name] || ''}
                            onChange={(e) => onFilterChange(group.name, e.target.value)}
                        />
                    )}

                    {group.type === 'checkbox' && (
                        <div className="purchase order list filters checkbox-group">
                            {group.options.map((option) => {
                                const checked = filterValues[group.name]?.includes(option.value);
                                return (
                                    <label key={option.value} className="purchase order list filters checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => {
                                                const current = filterValues[group.name] || [];
                                                const next = e.target.checked
                                                    ? [...current, option.value]
                                                    : current.filter((v) => v !== option.value);
                                                onFilterChange(group.name, next);
                                            }}
                                        />
                                        {option.label}
                                    </label>
                                );
                            })}
                        </div>
                    )}

                    {group.type === 'range' && (
                        <div className="purchase order list filters range">
                            <input
                                type="number"
                                placeholder="Min"
                                value={filterValues[group.name]?.min ?? ''}
                                onChange={(e) => onFilterChange(group.name, { ...filterValues[group.name], min: e.target.value })}
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                value={filterValues[group.name]?.max ?? ''}
                                onChange={(e) => onFilterChange(group.name, { ...filterValues[group.name], max: e.target.value })}
                            />
                        </div>
                    )}
                </div>
            ))}

            <div className="purchase order list filters actions">
                <button type="button" className="purchase order list filters reset" onClick={onReset}>Reset</button>
                <button type="button" className="purchase order list filters apply" onClick={onApply}>Apply</button>
            </div>
        </div>
    );
}

function PurchaseOrderList({ purchaseOrderOfSpecificEquipment }) {
    const {
        searchTerm,
        purchaseorders,
        filteredData,
        isLoading,
        isLoadingMore,
        hasMore,
        loadMore,
        activeView,
        activeListType,
        statsTab,
        showDeleteModal,
        selectedPurchaseOrder,
        deleteStatus,
        showStatusModal,
        showLegendModal,
        setShowLegendModal,
        isPickingEquipment,
        pendingSignatures,
        showPendingToast,
        sigToast,
        filters,
        tableRef,
        getRowClass,
        handleTabSelect,
        handleRowClick,
        handlePrint,
        handleDeleteClick,
        handleAmendment,
        confirmDelete,
        cancelDelete,
        closeStatusModal,
        handleViewPurchaseOrder,
        handleAddPurchaseOrder,
        handleCreateForAllEquipments,
        handleCreateForStock,
        handleOpenEquipmentPicker,
        handleCloseEquipmentPicker,
        handleEquipmentPicked,
        handleFilterChange,
        handleApplyFilters,
        handleResetFilters,
        handleSigCellEnter,
        handleSigCellLeave,
        closeSigToast,
        closePendingToast,
        handlePendingToastAction,
        registerExpandControls,
        toggleExpandRow,
    } = usePurchaseOrderList({ purchaseOrderOfSpecificEquipment });

    useEffect(() => {
        if (!hasMore || isLoading || isLoadingMore) return undefined;

        let debounceTimer = null;

        const handleScroll = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const scrollBottom = window.scrollY + window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;
                if (scrollBottom > documentHeight - PURCHASE_ORDER_SCROLL_BOTTOM_OFFSET_PX) {
                    loadMore();
                }
            }, PURCHASE_ORDER_SCROLL_DEBOUNCE_MS);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    }, [hasMore, isLoading, isLoadingMore, loadMore]);

    const vendorOptions = useMemo(() => buildVendorOptions(purchaseorders), [purchaseorders]);
    const equipmentTypeOptions = useMemo(() => buildEquipmentTypeOptions(purchaseorders), [purchaseorders]);
    const filterGroups = useMemo(
        () => buildFilterGroups({ filters, vendorOptions, equipmentTypeOptions }),
        [filters, vendorOptions, equipmentTypeOptions]
    );
    const columns = useMemo(
        () => buildPurchaseOrderTableColumns({
            getRowClass,
            handleSigCellEnter,
            handleSigCellLeave,
            handleViewPurchaseOrder,
            handleDeleteClick,
            handleAmendment,
            toggleExpandRow,
        }),
        [getRowClass, handleSigCellEnter, handleSigCellLeave, handleViewPurchaseOrder, handleDeleteClick, handleAmendment, toggleExpandRow]
    );

    const isStatsView = activeView === 'stats';

    const controlsItems = purchaseOrderOfSpecificEquipment
        ? [
            { text: 'Add PurchaseOrder', onClick: handleAddPurchaseOrder, colorScheme: 'lime-800', textColor: 'white-200', ...SHARED_BTN },
        ]
        : isPickingEquipment
            ? [
                { text: 'Back to List', onClick: handleCloseEquipmentPicker, colorScheme: 'warning-800', textColor: 'white-200', ...SHARED_BTN },
            ]
            : [
                { text: 'Color Hint', onClick: () => setShowLegendModal(true), colorScheme: 'info-800', textColor: 'white-200', ...SHARED_BTN },
                { text: 'Create > For All Equipments', onClick: handleCreateForAllEquipments, colorScheme: 'success-800', textColor: 'white-200', ...SHARED_BTN },
                { text: 'Create > For Stock', onClick: handleCreateForStock, colorScheme: 'success-800', textColor: 'white-200', ...SHARED_BTN },
                { text: 'Create > For Equipment', onClick: handleOpenEquipmentPicker, colorScheme: 'success-800', textColor: 'white-200', ...SHARED_BTN },
            ];

    const tabControlItems = [
        {
            componentIconCenter: 'PrinterIcon',
            componentIconSize: 40,
            onClick: handlePrint,
            colorScheme: 'yellow-800',
            iconColor: 'primary-100',
            padding: 0,
            ...SHARED_BTN,
        },
    ];

    return (
        <div className="purchase order list">
            <div className="purchase order list layout">
                {!purchaseOrderOfSpecificEquipment && (
                    <Tabs
                        title="Purchase Order"
                        items={PURCHASE_ORDER_TAB_ITEMS}
                        activePath={isStatsView ? ['statistics', statsTab] : ['purchase-order', activeListType]}
                        onSelect={handleTabSelect}
                        showSearch={false}
                        controls={isStatsView ? [] : tabControlItems}
                        filterToggleLabel="Filters"
                        filters={
                            isStatsView ? null : (
                                <PurchaseOrderFiltersPanel
                                    filterGroups={filterGroups}
                                    filterValues={filters}
                                    onFilterChange={handleFilterChange}
                                    onApply={handleApplyFilters}
                                    onReset={handleResetFilters}
                                />
                            )
                        }
                    />
                )}

                <div className="purchase order list content">
                    {!isStatsView && (
                        <Controls
                            justify="space-between"
                            margin='0 20px 0 auto'
                            width='900px'
                            items={controlsItems}
                        />
                    )}

                    {isStatsView ? (
                        <PurchaseOrderStats statsTab={statsTab} />
                    ) : isPickingEquipment ? (
                        <EquipmentPicker onSelect={handleEquipmentPicked} />
                    ) : (
                        <>
                            <Text
                                as="div"
                                variant="caption"
                                color="disabled"
                                className="purchase order list table info"
                                style={{ marginRight: '40px' }}
                            >
                                {searchTerm ? (
                                    `Found ${filteredData?.length || 0} matching ${filteredData?.length === 1 ? 'entry' : 'entries'}`
                                ) : (
                                    `Showing ${filteredData?.length || 0} entries`
                                )}
                            </Text>

                            {isLoading ? (
                                <TableSkeleton columns={columns.length} rows={25} />
                            ) : (
                                <>
                                    <Table
                                        tableRef={tableRef}
                                        columns={columns}
                                        data={filteredData || []}
                                        emptyMessage="No PurchaseOrder data available"
                                        rowKey={(purchaseorder) => purchaseorder._id}
                                        getRowProps={(purchaseorder) => ({ 'data-purchaseorderref': purchaseorder.purchaseorderRef })}
                                        onRowClick={(purchaseorder) => handleRowClick(purchaseorder.purchaseorderRef)}
                                        onExpandControlsReady={registerExpandControls}
                                        getExpandedRows={(purchaseorder) => (purchaseorder.items || []).slice(1)}
                                        rowNavigation={false}
                                        columnNavigation={false}
                                        cellNavigation={false}
                                        buttonNavigation
                                        style={{ margin: '0 20px' }}
                                    />
                                    {isLoadingMore && (
                                        <div style={{ margin: '0 20px' }}>
                                            <LoadMoreSkeleton
                                                count={1}
                                                renderItem={() => (
                                                    <TableSkeleton columns={columns.length} rows={3} showHeader={false} />
                                                )}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            {showDeleteModal && (
                <div className="purchase order list modal overlay">
                    <div className="purchase order list modal content">
                        <div className="purchase order list modal header">
                            <Text as="h2" variant="title">Confirm Deletion</Text>
                            <button className="purchase order list close button" onClick={cancelDelete}>
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <div className="purchase order list modal body">
                            <Text variant="body">
                                Are you sure you want to delete PurchaseOrder{' '}
                                <Text as="span" variant="label" weight="bold">{selectedPurchaseOrder?.purchaseorderRef}</Text>?
                            </Text>
                            <Text variant="body">This action cannot be undone.</Text>
                        </div>
                        <div className="purchase order list modal footer">
                            <button className="purchase order list action button cancel" onClick={cancelDelete}>Cancel</button>
                            <button className="purchase order list action button confirm delete" onClick={confirmDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {showStatusModal && (
                <div className="purchase order list modal overlay">
                    <div className={`purchase order list modal content ${deleteStatus.isError ? 'error' : 'success'}`}>
                        <div className="purchase order list modal header">
                            <Text as="h2" variant="title" color={deleteStatus.isError ? 'error' : 'success'}>
                                {deleteStatus.isError ? 'Error' : 'Success'}
                            </Text>
                            <button className="purchase order list close button" onClick={closeStatusModal}>
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <div className="purchase order list modal body">
                            <Text variant="body">{deleteStatus.message}</Text>
                        </div>
                        <div className="purchase order list modal footer">
                            <button className="purchase order list action button ok" onClick={closeStatusModal}>OK</button>
                        </div>
                    </div>
                </div>
            )}

            <Modal
                isOpen={showLegendModal}
                onClose={() => setShowLegendModal(false)}
                type="hint"
                title="Signature Status Color Hint"
                modalWidth="680px"
                buttonText="Got it"
                onButtonClick={() => setShowLegendModal(false)}
                filterGroups={SIGNATURE_LEGEND_GROUPS}
            />

            <Toast
                isOpen={sigToast.show}
                onClose={closeSigToast}
                type="info"
                message={sigToast.message}
                duration={0}
                position="top-center"
                showCloseButton={false}
            />

            <Toast
                isOpen={showPendingToast}
                onClose={closePendingToast}
                type="warning"
                message={`You have ${pendingSignatures.length} PurchaseOrder${pendingSignatures.length > 1 ? 's' : ''} pending your signature`}
                duration={6000}
                position="top-center"
                showActionButton
                actionButtonText="View"
                onActionClick={handlePendingToastAction}
            />
        </div>
    );
}

export default PurchaseOrderList;