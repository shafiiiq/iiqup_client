import React from 'react';
import './BackchargeList.css';
import Button from '@/shared/components/widgets/button/Button';
import DevModal from '@/shared/components/widgets/modal/DevModal';
import Toast from '@/shared/components/widgets/toast/Toast';
import { useBackchargeList } from '../hooks/useBackchargeList';

function BackchargeList() {
  const {
    tableRef,
    backcharges,
    filteredData,
    showDeleteModal,
    selectedBackcharge,
    deleteStatus,
    showStatusModal,
    showFiltersModal,
    pendingSignatures,
    showPendingToast,
    filters,
    setShowFiltersModal,
    setShowPendingToast,
    handleFilterChange,
    handleApplyFilters,
    handleResetFilters,
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

  return (
    <div className="bcl-main-container">
      <div className="bcl-controls-wrapper">
        <div className="bcl-actions-wrapper">
          <Button
            text="Filters"
            onClick={() => setShowFiltersModal(true)}
            colorScheme="amber-600"
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="160px"
            height="38px"
            type="submit"
            textColor="white-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
          <Button
            text="Add Backcharge"
            onClick={handleAddBackcharge}
            colorScheme="lime-800"
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="160px"
            height="38px"
            type="submit"
            textColor="white-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
          <Button
            text="Print Backcharge"
            onClick={handlePrint}
            colorScheme="violet-800"
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="160px"
            height="38px"
            type="submit"
            textColor="white-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
        </div>
      </div>

      <div className="bcl-table-summary">
        {filters.suppliers.length > 0 || filters.dateFilter !== 'all' ? (
          `Found ${filteredData?.length || 0} matching ${filteredData?.length === 1 ? 'entry' : 'entries'}`
        ) : (
          `Showing ${filteredData?.length || 0} entries`
        )}
      </div>

      <div className="bcl-table-wrapper">
        <table className="bcl-data-table" ref={tableRef}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Ref No</th>
              <th>Report No</th>
              <th>Supplier</th>
              <th>Equipment</th>
              <th>Plate No</th>
              <th>Contact</th>
              <th>Scope of Work</th>
              <th>Work Summary</th>
              <th>Spare Parts</th>
              <th>Labour</th>
              <th>Total Cost</th>
              <th>Deduction</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData && filteredData.length > 0 ? (
              filteredData.map((backcharge) => (
                <tr
                  key={backcharge._id}
                  data-refno={backcharge.refNo}
                  onClick={() => handleRowClick(backcharge.reportNo)}
                  className={`bcl-table-row ${
                    isSignedByUser(backcharge.refNo)
                      ? 'bcl-row-signed'
                      : isPendingForUser(backcharge.refNo)
                      ? 'bcl-row-pending-sign'
                      : ''
                  }`}
                >
                  <td>{formatDate(backcharge.date)}</td>
                  <td>{backcharge.refNo}</td>
                  <td>{backcharge.reportNo}</td>
                  <td>{backcharge.supplierName}</td>
                  <td>{backcharge.equipmentType}</td>
                  <td>{backcharge.plateNo}</td>
                  <td>{backcharge.contactPerson}</td>
                  <td className="bcl-text-cell">
                    {(backcharge.scopeOfWork?.combinedText || '').substring(0, 50)}
                    {(backcharge.scopeOfWork?.combinedText || '').length > 50 ? '...' : ''}
                  </td>
                  <td className="bcl-text-cell">
                    {(backcharge.workshopComments?.combinedText || '').substring(0, 50)}
                    {(backcharge.workshopComments?.combinedText || '').length > 50 ? '...' : ''}
                  </td>
                  <td className="bcl-currency-cell">{formatCurrency(backcharge.costSummary?.sparePartsCost)}</td>
                  <td className="bcl-currency-cell">{formatCurrency(backcharge.costSummary?.labourCharges)}</td>
                  <td className="bcl-currency-cell">{formatCurrency(backcharge.costSummary?.totalCost)}</td>
                  <td className="bcl-currency-cell">{formatCurrency(backcharge.costSummary?.approvedDeduction)}</td>
                  <td className="bcl-actions-cell" onClick={(e) => e.stopPropagation()}>
                    <Button
                      text="View Doc"
                      onClick={() => handleViewBackcharge(backcharge)}
                      colorScheme="blue-800"
                      variant="gradient"
                      font="md"
                      animation=""
                      squircle="4xl"
                      width="160px"
                      height="38px"
                      type="submit"
                      textColor="white-200"
                      shadowPosition="to-bottom"
                      shadowColor="white-600"
                    />
                    <Button
                      text="Delete"
                      onClick={() => handleDeleteClick(backcharge)}
                      colorScheme="red-800"
                      variant="gradient"
                      font="md"
                      animation=""
                      squircle="4xl"
                      width="160px"
                      height="38px"
                      type="submit"
                      textColor="white-200"
                      shadowPosition="to-bottom"
                      shadowColor="white-600"
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="14" className="bcl-no-data">
                  {backcharges?.length > 0 ? 'No matching records found' : 'Loading backcharge data...'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showDeleteModal && (
        <div className="bcl-modal-backdrop">
          <div className="bcl-modal-container">
            <div className="bcl-modal-header">
              <h2>Confirm Deletion</h2>
              <button className="bcl-modal-close" onClick={cancelDelete}>×</button>
            </div>
            <div className="bcl-modal-body">
              <p>Are you sure you want to delete backcharge report <strong>{selectedBackcharge?.reportNo}</strong>?</p>
              <p>This action cannot be undone.</p>
            </div>
            <div className="bcl-modal-footer">
              <button className="bcl-btn bcl-btn-cancel" onClick={cancelDelete}>Cancel</button>
              <button className="bcl-btn bcl-btn-confirm-delete" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && (
        <div className="bcl-modal-backdrop">
          <div className={`bcl-modal-container ${deleteStatus.isError ? 'bcl-modal-error' : 'bcl-modal-success'}`}>
            <div className="bcl-modal-header">
              <h2>{deleteStatus.isError ? 'Error' : 'Success'}</h2>
              <button className="bcl-modal-close" onClick={closeStatusModal}>×</button>
            </div>
            <div className="bcl-modal-body">
              <p>{deleteStatus.message}</p>
            </div>
            <div className="bcl-modal-footer">
              <button className="bcl-btn bcl-btn-ok" onClick={closeStatusModal}>OK</button>
            </div>
          </div>
        </div>
      )}

      <DevModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        type="filters"
        title="Backcharge Filters"
        message="Customize your view with advanced filtering options"
        filterGroups={[
          {
            name: 'dateFilter',
            label: 'Date Range',
            type: 'select',
            options: [
              { value: 'all', label: 'All Time' },
              { value: 'thismonth', label: 'This Month' },
              { value: 'lastXmonths', label: 'Last X Months' },
              { value: 'custom', label: 'Custom Range' }
            ]
          },
          ...(filters.dateFilter === 'lastXmonths' ? [{
            name: 'lastMonthsCount',
            label: 'Number of Months',
            type: 'select',
            options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n =>
              ({ value: n, label: `${n} Month${n > 1 ? 's' : ''}` })
            )
          }] : []),
          ...(filters.dateFilter === 'custom' ? [
            {
              name: 'customStartDate',
              label: 'Start Date',
              type: 'date'
            },
            {
              name: 'customEndDate',
              label: 'End Date',
              type: 'date'
            }
          ] : []),
          {
            name: 'suppliers',
            label: 'Suppliers',
            type: 'checkbox',
            options: [...new Set(backcharges.map(item => item.supplierName).filter(Boolean))].map(s =>
              ({ value: s, label: s })
            )
          },
          {
            name: 'equipmentTypes',
            label: 'Equipment Types',
            type: 'checkbox',
            options: [...new Set(backcharges.map(item => item.equipmentType).filter(Boolean))].map(e =>
              ({ value: e, label: e })
            )
          },
          {
            name: 'costRange',
            label: 'Total Cost Range (QR)',
            type: 'range'
          }
        ]}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        buttonText="Apply Filters"
      />

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
