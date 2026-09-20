import Modal from '@/shared/components/widgets/modal/Modal';
import Text from '@/shared/components/widgets/text/Text';
import Toast from '@/shared/components/widgets/toast/Toast';
import Table from '@/shared/components/widgets/table/Table';
import TableSkeleton from '@/shared/components/widgets/table/TableSkeleton';

import useHireOrderList from '../hooks/useHireOrderList';
import { SHARED_BTN, SIGNATURE_LEGEND_GROUPS } from '../constants/hire.order.list.constant';
import { buildVendorOptions, buildFilterGroups } from '../helper/hire.order.list.helper';
import { buildHireOrderTableColumns } from '../helper/hire.order.list.column.helper';
import './HireOrderList.css';
import Controls from '@/shared/components/widgets/controls/Controls';

function HireOrderList() {
  const {
    searchTerm,
    hireOrders,
    filteredData,
    isLoading,
    showDeleteModal,
    selectedHireOrder,
    deleteStatus,
    showStatusModal,
    showFiltersModal,
    setShowFiltersModal,
    pendingSignatures,
    showPendingToast,
    showLegendModal,
    setShowLegendModal,
    sigToast,
    filters,
    tableRef,
    getRowClass,
    handleRowClick,
    handlePrint,
    handleDeleteClick,
    handleAmendment,
    confirmDelete,
    cancelDelete,
    closeStatusModal,
    handleViewHireOrder,
    handleAddHireOrder,
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
  } = useHireOrderList();

  const vendorOptions = buildVendorOptions(hireOrders);
  const filterGroups = buildFilterGroups({ filters, vendorOptions });
  const columns = buildHireOrderTableColumns({
    getRowClass,
    handleSigCellEnter,
    handleSigCellLeave,
    handleViewHireOrder,
    handleDeleteClick,
    handleAmendment,
    toggleExpandRow,
  });

  return (
    <div className="features screen order hire list">
      <Controls
        justify="space-between"
        width="20%"
        columns={3}
        margin="0 20px 20px auto"
        buttons={[
          { ...SHARED_BTN, text: 'Color Hint', onClick: () => setShowLegendModal(true), colorScheme: 'info-800' },
          { ...SHARED_BTN, text: 'Create Hire Order', onClick: handleAddHireOrder, colorScheme: 'success-800' },
          { ...SHARED_BTN, text: 'Print', onClick: handlePrint, colorScheme: 'success-800' },
        ]}
      />

      <Text
        as="div"
        variant="caption"
        color="disabled"
        className="features screen order hire list table-info"
        style={{ marginRight: '40px' }}
      >
        {searchTerm
          ? `Found ${filteredData?.length || 0} matching ${filteredData?.length === 1 ? 'entry' : 'entries'}`
          : `Showing ${filteredData?.length || 0} entries`}
      </Text>

      {isLoading ? (
        <TableSkeleton columns={columns.length} rows={20} />
      ) : (
        <Table
          tableRef={tableRef}
          columns={columns}
          data={filteredData || []}
          emptyMessage="No Hire Order data available"
          rowKey={(h) => h._id}
          getRowProps={(h) => ({ 'data-hireorderref': h.hireOrderRef })}
          onRowClick={(h) => handleRowClick(h.hireOrderRef)}
          onExpandControlsReady={registerExpandControls}
          getExpandedRows={(h) => (h.items || []).slice(1)}
          rowNavigation={false}
          columnNavigation={false}
          cellNavigation={false}
          buttonNavigation
          style={{ margin: '0 20px' }}
        />
      )}

      {showDeleteModal && (
        <div className="features screen order hire list modal-overlay">
          <div className="features screen order hire list modal-content">
            <div className="features screen order hire list modal-header">
              <Text as="h2" variant="title">Confirm Deletion</Text>
              <button className="features screen order hire list close-button" onClick={cancelDelete}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <div className="features screen order hire list modal-body">
              <Text variant="body">
                Are you sure you want to delete Hire Order{' '}
                <Text as="span" variant="label" weight="bold">{selectedHireOrder?.hireOrderRef}</Text>?
              </Text>
              <Text variant="body">This action cannot be undone.</Text>
            </div>
            <div className="features screen order hire list modal-footer">
              <button className="features screen order hire list action-button cancel" onClick={cancelDelete}>Cancel</button>
              <button className="features screen order hire list action-button confirm-delete" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && (
        <div className="features screen order hire list modal-overlay">
          <div className={`features screen order hire list modal-content ${deleteStatus.isError ? 'error' : 'success'}`}>
            <div className="features screen order hire list modal-header">
              <Text as="h2" variant="title" color={deleteStatus.isError ? 'error' : 'success'}>
                {deleteStatus.isError ? 'Error' : 'Success'}
              </Text>
              <button className="features screen order hire list close-button" onClick={closeStatusModal}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <div className="features screen order hire list modal-body">
              <Text variant="body">{deleteStatus.message}</Text>
            </div>
            <div className="features screen order hire list modal-footer">
              <button className="features screen order hire list action-button ok" onClick={closeStatusModal}>OK</button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        type="filters"
        title="Hire Order Filters"
        message="Customize your view with advanced filtering options"
        filterGroups={filterGroups}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        buttonText="Apply Filters"
      />

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
        message={`You have ${pendingSignatures.length} Hire Order${pendingSignatures.length > 1 ? 's' : ''} pending your signature`}
        duration={6000}
        position="top-center"
        showActionButton
        actionButtonText="View"
        onActionClick={handlePendingToastAction}
      />
    </div>
  );
}

export default HireOrderList;