import Text from '@/shared/components/widgets/text/Text';
import Table from '@/shared/components/widgets/table/Table';
import TableSkeleton from '@/shared/components/widgets/table/TableSkeleton';
import Tabs from '@/shared/components/widgets/tabs/Tabs';
import Controls from '@/shared/components/widgets/controls/Controls';

import useQuotationList from '../hooks/useQuotationList';
import { QUOTATION_TAB_ITEMS, SHARED_BTN } from '../constants/quotation.list.constant';
import { buildQuotationTableColumns } from '../helper/quotation.list.column.helper';
import QuotationStats from './fragments/QuotationStats';
import './QuotationList.css';

function QuotationList() {
  const {
    searchTerm,
    filteredData,
    isLoading,
    showDeleteModal,
    selectedQuotation,
    deleteStatus,
    showStatusModal,
    tableRef,
    handleRowClick,
    handleViewQuotation,
    handleAddQuotation,
    handleAmendment,
    handleDeleteClick,
    confirmDelete,
    cancelDelete,
    closeStatusModal,
    registerExpandControls,
    toggleExpandRow,
    activeView,
    statsTab,
    handleTabSelect
  } = useQuotationList();

  const columns = buildQuotationTableColumns({ handleViewQuotation, handleDeleteClick, handleAmendment, toggleExpandRow });

  return (
    <div className="features screen quotation list">
      <div className="features screen quotation list layout">
        <Tabs
          title="Quotation"
          items={QUOTATION_TAB_ITEMS}
          activePath={activeView === 'stats' ? ['statistics', statsTab] : ['quotation', 'all']}
          onSelect={handleTabSelect}
          showSearch={false}
        />

        <div className="features screen quotation list content">
          {activeView !== 'stats' && (
            <Controls
              justify="space-between"
              margin="0 20px 0 auto"
              width="fit-content"
              items={[
                { text: 'Create Quotation', onClick: handleAddQuotation, colorScheme: 'success-800', textColor: 'white-200', ...SHARED_BTN },
              ]}
            />
          )}

          {activeView === 'stats' ? (
            <QuotationStats statsTab={statsTab} />
          ) : (
            <>
              <Text as="div" variant="caption" color="disabled" className="features screen quotation list table-info">
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
                  emptyMessage="No Quotation data available"
                  rowKey={(q) => q._id}
                  getRowProps={(q) => ({ 'data-quotationref': q.quotationRef })}
                  onRowClick={(q) => handleRowClick(q.quotationRef)}
                  onExpandControlsReady={registerExpandControls}
                  getExpandedRows={(q) => (q.items || []).slice(1)}
                />
              )}
            </>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="features screen quotation list modal-overlay">
          <div className="features screen quotation list modal-content">
            <div className="features screen quotation list modal-header">
              <Text as="h2" variant="title">Confirm Deletion</Text>
            </div>
            <div className="features screen quotation list modal-body">
              <Text variant="body">
                Are you sure you want to delete Quotation{' '}
                <Text as="span" variant="label" weight="bold">{selectedQuotation?.quotationRef}</Text>?
              </Text>
              <Text variant="body">This action cannot be undone.</Text>
            </div>
            <div className="features screen quotation list modal-footer">
              <button className="features screen quotation list action-button cancel" onClick={cancelDelete}>Cancel</button>
              <button className="features screen quotation list action-button confirm-delete" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && (
        <div className="features screen quotation list modal-overlay">
          <div className={`features screen quotation list modal-content ${deleteStatus.isError ? 'error' : 'success'}`}>
            <div className="features screen quotation list modal-header">
              <Text as="h2" variant="title" color={deleteStatus.isError ? 'error' : 'success'}>
                {deleteStatus.isError ? 'Error' : 'Success'}
              </Text>
            </div>
            <div className="features screen quotation list modal-body">
              <Text variant="body">{deleteStatus.message}</Text>
            </div>
            <div className="features screen quotation list modal-footer">
              <button className="features screen quotation list action-button ok" onClick={closeStatusModal}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuotationList;