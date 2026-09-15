import Modal from '@/shared/components/widgets/modal/Modal';
import Button from '@/shared/components/widgets/button/Button';
import TableSkeleton from '@/shared/components/widgets/table/TableSkeleton';
import Text from '@/shared/components/widgets/text/Text';
import Table from '@/shared/components/widgets/table/Table';
import Controls from '@/shared/components/widgets/controls/Controls';
import SparePartsSidebar from './fragments/SparePartsSidebar';
import { useSpareParts } from '../hooks/useSpareParts';
import { STOCK_BTN, ADD_STOCK_FORM_FIELDS } from '../constants/stock.part.constant';
import './SpareParts.css';

function SpareParts() {
  const {
    loading,
    error,
    selectedStock,
    showForm,
    formMode,
    message,
    showReduceForm,
    showAddForm,
    sidebarMinimized,
    sidebarMaximized,
    reduceFormData,
    addFormData,
    formData,
    filteredStocks,
    reduceStockFormFields,
    stockFormFields,
    calculateStatus,
    formatDate,
    handlePrint,
    openAddForm,
    exportToExcel,
    showDetails,
    handleSidebarClose,
    handleSidebarMinimizeToggle,
    handleSidebarMaximizeToggle,
    handleShowAddFormOpen,
    handleShowReduceFormOpen,
    handleEditSelectedStock,
    handleDeleteSelectedStock,
    handleCloseAddForm,
    handleCloseReduceForm,
    handleCloseStockForm,
    handleStockFormSubmit,
    handleAddFormChange,
    handleReduceFormChange,
    handleStockFormChange,
    handleAddStock,
    handleReduceStock,
  } = useSpareParts();

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (_item, index) => index + 1,
    },
    {
      key: 'for',
      header: 'For',
      render: (item) => item.type,
    },
    {
      key: 'product',
      header: 'Product Name',
      render: (item) => item.product,
    },
    {
      key: 'partNumber',
      header: 'Part Number',
      render: (item) => item.serialNumber,
    },
    {
      key: 'equipments',
      header: 'Equipment(s)',
      render: (item) =>
        item.equipments && item.equipments.length > 0 ? (
          <div className="stock spare parts equipment-list">
            {item.equipments.slice(0, 1).map((equip, i) => (
              <Text key={i} variant="caption" className="stock spare parts equipment-item">
                {equip}
              </Text>
            ))}
            {item.equipments.length > 2 && (
              <Text variant="caption" className="stock spare parts equipment-more">
                +{item.equipments.length - 1} more
              </Text>
            )}
          </div>
        ) : (
          'N/A'
        ),
    },
    {
      key: 'stockCount',
      header: 'Stock Count',
      render: (item) => item.stockCount,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const status = calculateStatus(item.stockCount);
        return (
          <span className={`stock spare parts status-badge ${status}`}>
            {status === 'available' ? 'In Stock' : status === 'low' ? 'Low Stock' : 'Out of Stock'}
          </span>
        );
      },
    },
    {
      key: 'view',
      header: 'View More',
      actions: true,
      render: (item) => (
        <Button {...STOCK_BTN} onClick={() => showDetails(item)} colorScheme="yellow-800" componentIconCenter= 'IconlyShow' componentIconSize= '25' iconColor= 'info-400' />
      ),
    },
  ];

  return (
    <div className="stock spare parts container">
      <div className="stock spare parts actions">
        <Controls
          justify="start"
          items={[
            { ...STOCK_BTN, text: 'Add Stock', componentIconLeft: 'IconlyPlus', componentIconSize: '25', iconColor: 'white-200', onClick: openAddForm, colorScheme: 'success-800', },
            { ...STOCK_BTN, text: 'Export to Excel', onClick: exportToExcel, colorScheme: 'success-100', textColor: 'black-100', componentIconLeft: 'ExcelIcon', componentIconSize: '30', },
            { ...STOCK_BTN, text: 'Print', onClick: handlePrint, colorScheme: 'info-100', textColor: 'black-200', componentIconLeft: 'PrinterIcon', componentIconSize: '30' },
          ]}
        />
      </div>

      {message.text && (
        <div className={`stock spare parts message ${message.type}`}>
          <Text variant="body">{message.text}</Text>
        </div>
      )}

      {loading ? (
        <TableSkeleton columns={columns.length} rows={25} />
      ) : error ? (
        <Text variant="body" className="stock spare parts error">
          {error}
        </Text>
      ) : (
        <div className="stock spare parts table-wrap">
          <Text variant="subtitle" className="stock spare parts print-header">
            Stock Inventory Report
          </Text>
          <Text variant="caption" className="stock spare parts print-date">
            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
          </Text>

          <Table
            columns={columns}
            data={filteredStocks}
            rowKey={(item) => item._id}
            emptyMessage="No stock records found"
          />
        </div>
      )}

      <SparePartsSidebar
        show={!!selectedStock}
        selectedStock={selectedStock}
        isMinimized={sidebarMinimized}
        isMaximized={sidebarMaximized}
        onClose={handleSidebarClose}
        onMinimize={handleSidebarMinimizeToggle}
        onMaximize={handleSidebarMaximizeToggle}
        calculateStatus={calculateStatus}
        formatDate={formatDate}
        onEditStock={handleEditSelectedStock}
        onAddStock={handleShowAddFormOpen}
        onReduceStock={handleShowReduceFormOpen}
        onDeleteStock={handleDeleteSelectedStock}
      />

      <Modal
        isOpen={showAddForm && selectedStock}
        onClose={handleCloseAddForm}
        type="form"
        mode="sheet"
        modalWidth="80%"
        title={`Add Stock: ${selectedStock?.product || ''}`}
        message={`Current stock: ${selectedStock?.stockCount || 0}`}
        formFields={ADD_STOCK_FORM_FIELDS}
        formValues={addFormData}
        onFormChange={handleAddFormChange}
        buttonText="Confirm Add"
        onButtonClick={handleAddStock}
        secondaryButtonText="Cancel"
        onSecondaryClick={handleCloseAddForm}
      />

      <Modal
        isOpen={showReduceForm && selectedStock}
        onClose={handleCloseReduceForm}
        type="form"
        mode="sheet"
        modalWidth="80%"
        title={`Reduce Stock: ${selectedStock?.product || ''}`}
        message={`Current stock: ${selectedStock?.stockCount || 0}`}
        formFields={reduceStockFormFields}
        formValues={reduceFormData}
        onFormChange={handleReduceFormChange}
        buttonText="Confirm Reduction"
        onButtonClick={handleReduceStock}
        secondaryButtonText="Cancel"
        onSecondaryClick={handleCloseReduceForm}
      />

      <Modal
        isOpen={showForm}
        onClose={handleCloseStockForm}
        type="form"
        mode="sheet"
        modalWidth="80%"
        title={formMode === 'add' ? 'Add New Stock' : 'Update Stock'}
        message="Fill in the stock details below"
        formFields={stockFormFields}
        formValues={formData}
        onFormChange={handleStockFormChange}
        buttonText={formMode === 'add' ? 'Add Stock' : 'Update Stock'}
        onButtonClick={handleStockFormSubmit}
        secondaryButtonText="Cancel"
        onSecondaryClick={handleCloseStockForm}
      />
    </div>
  );
}

export default SpareParts;