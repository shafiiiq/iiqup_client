import React from 'react';
import './BackchargeList.css';
import Table from '@/shared/components/widgets/table/Table';
import TableSkeleton from '@/shared/components/widgets/table/TableSkeleton';
import LoadMoreSkeleton from '@/shared/components/widgets/loader/skeleton/LoadMoreSkeleton';
import Controls from '@/shared/components/widgets/controls/Controls';
import Tabs from '@/shared/components/widgets/tabs/Tabs';
import Button from '@/shared/components/widgets/button/Button';
import Text from '@/shared/components/widgets/text/Text';
import Toast from '@/shared/components/widgets/toast/Toast';
import { useBackchargeList } from '../hooks/useBackchargeList';
import { buildBackchargeFilterGroups } from '../helper/backcharge.list.filter.helper';
import { ACTION_BUTTON_PROPS, BACKCHARGE_TAB_ITEMS, BACKCHARGE_VIEW } from '../constants/backcharge.list.constant';
import BackchargeStats from './fragments/BackchargeStats';

const truncate = (text, length = 50) => {
  const value = text || '';
  return value.length > length ? `${value.slice(0, length)}...` : value;
};

function BackchargeFiltersPanel({ filterGroups, filterValues, onFilterChange, onApply, onReset }) {
  return (
    <div className="features screens backcharge list filters panel">
      {filterGroups.map((group) => (
        <div key={group.name} className="features screens backcharge list filters field">
          <Text as="label" variant="label" className="features screens backcharge list filters label">{group.label}</Text>

          {group.type === 'select' && (
            <select
              className="features screens backcharge list filters select"
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
              className="features screens backcharge list filters date"
              value={filterValues[group.name] || ''}
              onChange={(e) => onFilterChange(group.name, e.target.value)}
            />
          )}

          {group.type === 'checkbox' && (
            <div className="features screens backcharge list filters checkbox-group">
              {group.options.map((option) => {
                const checked = filterValues[group.name]?.includes(option.value);
                return (
                  <label key={option.value} className="features screens backcharge list filters checkbox-item">
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
            <div className="features screens backcharge list filters range">
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

      <div className="features screens backcharge list filters actions">
        <button type="button" className="features screens backcharge list filters reset" onClick={onReset}>Reset</button>
        <button type="button" className="features screens backcharge list filters apply" onClick={onApply}>Apply</button>
      </div>
    </div>
  );
}

function BackchargeList() {
  const {
    tableRef,
    activeView,
    statsTab,
    backcharges,
    filteredData,
    isLoading,
    isLoadingMore,
    loadMore,
    showDeleteModal,
    selectedBackcharge,
    deleteStatus,
    showStatusModal,
    pendingSignatures,
    showPendingToast,
    filters,
    setShowPendingToast,
    handleFilterChange,
    handleApplyFilters,
    handleResetFilters,
    handleTabSelect,
    handleRowClick,
    handleViewBackcharge,
    handleAddBackcharge,
    handleDeleteClick,
    confirmDelete,
    cancelDelete,
    closeStatusModal,
    handlePrint,
    formatDate,
    formatCurrency,
    isPendingForUser,
    isSignedByUser,
  } = useBackchargeList();

  const filterGroups = buildBackchargeFilterGroups({ filters, backcharges });
  const isStatsView = activeView === BACKCHARGE_VIEW.STATS;

  const columns = [
    { key: 'date', header: 'Date', render: (item) => formatDate(item.date) },
    { key: 'refNo', header: 'Ref No' },
    { key: 'supplierName', header: 'Supplier' },
    { key: 'equipmentType', header: 'Equipment' },
    { key: 'plateNo', header: 'Plate No' },
    { key: 'contactPerson', header: 'Contact' },
    {
      key: 'scopeOfWork',
      header: 'Scope of Work',
      variant: () => 'truncate',
      render: (item) => truncate(item.scopeOfWork?.combinedText),
    },
    {
      key: 'workshopComments',
      header: 'Work Summary',
      variant: () => 'truncate',
      render: (item) => truncate(item.workshopComments?.combinedText),
    },
    {
      key: 'sparePartsCost',
      header: 'Spare Parts',
      variant: () => 'currency',
      render: (item) => formatCurrency(item.costSummary?.sparePartsCost),
    },
    {
      key: 'labourCharges',
      header: 'Labour',
      variant: () => 'currency',
      render: (item) => formatCurrency(item.costSummary?.labourCharges),
    },
    {
      key: 'totalCost',
      header: 'Total Cost',
      variant: () => 'currency',
      render: (item) => formatCurrency(item.costSummary?.totalCost),
    },
    {
      key: 'approvedDeduction',
      header: 'Deduction',
      variant: () => 'currency',
      render: (item) => formatCurrency(item.costSummary?.approvedDeduction),
    },
    {
      key: 'report',
      header: 'Report',
      actions: true,
      render: (item) => (
        <Button
          componentIconCenter="IconlyShow"
          componentIconSize={30}
          onClick={() => handleViewBackcharge(item)}
          colorScheme="yellow-800"
          iconColor="info-300"
          padding='0'
          {...ACTION_BUTTON_PROPS}
        />
      ),
    },
    {
      key: 'delete',
      header: 'Delete',
      actions: true,
      render: (item) => (
        <Button
          componentIconCenter="IconlyDelete"
          componentIconSize={30}
          onClick={() => handleDeleteClick(item)}
          colorScheme="yellow-800"
          iconColor="error-300"
          padding='0'
          {...ACTION_BUTTON_PROPS}
        />
      ),
    },
  ];

  const getRowVariant = (item) => {
    if (isSignedByUser(item.refNo)) return 'signed';
    if (isPendingForUser(item.refNo)) return 'pending';
    return undefined;
  };

  return (
    <div className="features screens backcharge list main container">
      <div className="features screens backcharge list layout">
        <Tabs
          title="Backcharge"
          items={BACKCHARGE_TAB_ITEMS}
          activePath={isStatsView ? ['statistics', statsTab] : ['list']}
          onSelect={handleTabSelect}
          showSearch={false}
          filterToggleLabel="Filters"
          filters={
            isStatsView ? null : (
              <BackchargeFiltersPanel
                filterGroups={filterGroups}
                filterValues={filters}
                onFilterChange={handleFilterChange}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
              />
            )
          }
        />

        <div className="features screens backcharge list content">
          {isStatsView ? (
            <BackchargeStats statsTab={statsTab} />
          ) : (
            <>
              <Controls
                width='fit-content'
                justify="start"
                margin="0 20px 24px auto"
                items={[
                  {
                    text: 'Create Backcharge',
                    onClick: handleAddBackcharge,
                    colorScheme: 'success-800',
                    ...ACTION_BUTTON_PROPS,
                  },
                  {
                    text: 'Print',
                    onClick: handlePrint,
                    colorScheme: 'success-800',
                    ...ACTION_BUTTON_PROPS,
                  },
                ]}
              />

              <div className="features screens backcharge list table summary">
                {filters.suppliers.length > 0 || filters.dateFilter !== 'all'
                  ? `Found ${filteredData?.length || 0} matching ${filteredData?.length === 1 ? 'entry' : 'entries'}`
                  : `Showing ${filteredData?.length || 0} entries`}
              </div>

              {isLoading ? (
                <TableSkeleton columns={columns.length} rows={25} />
              ) : (
                <>
                  <Table
                    tableRef={tableRef}
                    columns={columns}
                    data={filteredData}
                    rowKey={(item) => item._id}
                    getRowVariant={getRowVariant}
                    getRowProps={(item) => ({ 'data-refno': item.refNo })}
                    onRowClick={(item) => handleRowClick(item.refNo)}
                    onScrollEnd={loadMore}
                    emptyMessage="No matching records found"
                  />
                  {isLoadingMore && (
                    <LoadMoreSkeleton count={1} renderItem={() => <TableSkeleton columns={columns.length} rows={5} />} />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="features screens backcharge list modal backdrop">
          <div className="features screens backcharge list modal container">
            <div className="features screens backcharge list modal header">
              <h2>Confirm Deletion</h2>
              <button className="features screens backcharge list modal close" onClick={cancelDelete}>×</button>
            </div>
            <div className="features screens backcharge list modal body">
              <p>Are you sure you want to delete backcharge report <strong>{selectedBackcharge?.refNo}</strong>?</p>
              <p>This action cannot be undone.</p>
            </div>
            <div className="features screens backcharge list modal footer">
              <button className="features screens backcharge list btn cancel" onClick={cancelDelete}>Cancel</button>
              <button className="features screens backcharge list btn confirm delete" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && (
        <div className="features screens backcharge list modal backdrop">
          <div className={`features screens backcharge list modal container features screens backcharge list modal ${deleteStatus.isError ? 'error' : 'success'}`}>
            <div className="features screens backcharge list modal header">
              <h2>{deleteStatus.isError ? 'Error' : 'Success'}</h2>
              <button className="features screens backcharge list modal close" onClick={closeStatusModal}>×</button>
            </div>
            <div className="features screens backcharge list modal body">
              <p>{deleteStatus.message}</p>
            </div>
            <div className="features screens backcharge list modal footer">
              <button className="features screens backcharge list btn ok" onClick={closeStatusModal}>OK</button>
            </div>
          </div>
        </div>
      )}

      <Toast
        isOpen={showPendingToast}
        onClose={() => setShowPendingToast(false)}
        type="warning"
        message={`You have ${pendingSignatures.length} backcharge document${pendingSignatures.length > 1 ? 's' : ''} pending your signature`}
        duration={6000}
        position="top-center"
        showActionButton
        actionButtonText="View"
        onActionClick={() => {
          setShowPendingToast(false);
          const firstPending = pendingSignatures[0];
          if (firstPending && tableRef.current) {
            const row = tableRef.current.querySelector(`[data-refno="${firstPending.refNo}"]`);
            row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
      />
    </div>
  );
}

export default BackchargeList;