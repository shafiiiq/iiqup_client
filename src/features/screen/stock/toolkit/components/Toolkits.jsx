import React from 'react';
import './Toolkits.css';
import Modal from '@/shared/components/widgets/modal/Modal';
import Button from '@/shared/components/widgets/button/Button';
import Text from '@/shared/components/widgets/text/Text';
import Table from '@/shared/components/widgets/table/Table';
import Controls from '@/shared/components/widgets/controls/Controls';
import ToolkitSidebar from './fragments/ToolkitSidebar';
import useToolkits from '../hooks/useToolkits';
import { PREDEFINED_COLORS, PREDEFINED_TYPES, PREDEFINED_SIZES } from '../constants/stock.toolkit.constant';
import { calculateStatus, formatDate, getUniqueValues } from '../helper/stock.toolkit.helper';
import TableSkeleton from '@/shared/components/widgets/table/TableSkeleton';

const STATUS_LABEL = {
  available: 'In Stock',
  low: 'Low Stock',
  out: 'Out of Stock',
};

const Toolkits = () => {
  const {
    showSizeSearchDropdown,
    sizeDropdownItems,
    showColorSearchDropdown,
    colorDropdownItems,
    variantSearchTerm,
    variantFilterSize,
    variantFilterColor,
    variantFilterStatus,
    loading,
    error,
    selectedToolkit,
    selectedVariant,
    showForm,
    showVariantForm,
    formMode,
    sidebarMinimized,
    sidebarMaximized,
    variantFormMode,
    exporting,
    showReduceStockModal,
    reduceStockData,
    variantFormData,
    showUnregisteredPersonWarning,
    handleConfirmUnregisteredPerson,
    handleCancelUnregisteredPersonWarning,
    showFiltersModal,
    filters,
    filteredUsers,
    userSearchTerm,
    nameSearchTerm,
    typeSearchTerm,
    showToolkitHistory,
    toolkitHistory,
    filteredToolkits,
    historyFilter,
    toolkits,
    getFilteredAndGroupedVariants,
    showDetails,
    showVariantDetails,
    openAddForm,
    openUpdateForm,
    openAddVariantForm,
    openUpdateVariantForm,
    handleFormSubmit,
    handleVariantFormSubmit,
    deleteToolkit,
    deleteVariant,
    handleFilterChange,
    handleApplyFilters,
    handleResetFilters,
    exportToExcel,
    handleViewHistoryClick,
    handleOpenFiltersModal,
    handleCloseFiltersModal,
    handleSidebarClose,
    handleSidebarMinimize,
    handleSidebarMaximize,
    handleClearVariantFilters,
    handlePrintBarcode,
    handleCloseToolkitHistory,
    handleHistoryFilterTypeAllChange,
    handleHistoryFilterTypeChange,
    handleHistoryDateFromChange,
    handleHistoryDateToChange,
    handleHistoryLastNChange,
    handleHistoryLastUnitChange,
    fetchAllToolkitsHistory,
    handleVariantSearchChange,
    handleVariantFilterSizeChange,
    handleVariantFilterColorChange,
    handleVariantFilterStatusChange,
    handlePersonSearchFocus,
    handleReduceStockFormChange,
    handleReduceStockButtonClick,
    handleCloseReduceStockModal,
    handleToolkitFormChange,
    handleCloseToolkitForm,
    handleSizeSearchFocus,
    handleSizeSearch,
    handleSizeSearchBlur,
    handleSizeItemSelect,
    handleColorSearchFocus,
    handleColorSearch,
    handleColorSearchBlur,
    handleColorItemSelect,
    handleVariantFormChange,
    handleCloseVariantForm,
  } = useToolkits();

  const toolkitColumns = [
    { key: 'id', header: 'ID', render: (_item, index) => index + 1 },
    { key: 'name', header: 'Tool Name', render: (item) => item.name },
    { key: 'type', header: 'Type', render: (item) => item.type },
    { key: 'totalStock', header: 'Total Stock', render: (item) => item.totalStock },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span className={`stock toolkit status-badge ${item.overallStatus}`}>
          {STATUS_LABEL[item.overallStatus] || 'Out of Stock'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      actions: true,
      render: (item) => (
        <Button
          text="Details"
          onClick={() => showDetails(item)}
          colorScheme="orange-800"
          variant="gradient"
          font="md"
          animation=""
          squircle="6xl"
          width="160px"
          height="38px"
          type="submit"
          textColor="white-200"
          shadowPosition="to-bottom"
          shadowColor="white-600"
        />
      ),
    },
  ];

  const historyColumns = [
    { key: 'date', header: 'Date', render: (h) => formatDate(h.date || h.assignedDate || h.timestamp) },
    { key: 'toolkit', header: 'Toolkit', render: (h) => <strong>{h.toolkitName}</strong> },
    { key: 'variant', header: 'Variant', render: (h) => `${h.variantSize} - ${h.variantColor}` },
    {
      key: 'action',
      header: 'Action',
      render: (h) => (
        <span className={`stock toolkit history-badge ${h.action || ''}`}>
          {h.action?.charAt(0).toUpperCase() + h.action?.slice(1)}
        </span>
      ),
    },
    { key: 'previous', header: 'Previous', render: (h) => h.previousStock },
    {
      key: 'change',
      header: 'Change',
      render: (h) => (
        <span className={h.changeAmount > 0 ? 'stock toolkit positive' : 'stock toolkit negative'}>
          {h.changeAmount > 0 ? '+' : ''}{h.changeAmount}
        </span>
      ),
    },
    { key: 'new', header: 'New', render: (h) => h.newStock },
    { key: 'person', header: 'Person', render: (h) => h.person || '-' },
    { key: 'reason', header: 'Reason', render: (h) => h.reason },
  ];

  return (
    <div className="stock toolkit container">
      <div className="stock toolkit actions">
        <Controls
          justify="start"
          items={[
            {
              text: 'Add Toolkit',
              onClick: openAddForm,
              colorScheme: 'success-800',
              componentIconLeft: 'IconlyPlus', 
              componentIconSize: '25', 
              iconColor: 'white-200',
              variant: 'gradient',
              font: 'md',
              animation: '',
              squircle: '6xl',
              width: '160px',
              height: '38px',
              type: 'submit',
              textColor: 'white-200',
              shadowPosition: 'to-bottom',
              shadowColor: 'white-600',
            },
            {
              text: 'View History',
              onClick: handleViewHistoryClick,
              colorScheme: 'info-800',
              componentIconLeft: 'IconlyShow', 
              componentIconSize: '25', 
              iconColor: 'white-200',
              variant: 'gradient',
              font: 'md',
              animation: '',
              squircle: '6xl',
              width: '160px',
              height: '38px',
              type: 'submit',
              textColor: 'white-200',
              shadowPosition: 'to-bottom',
              shadowColor: 'white-600',
            },
            {
              text: exporting ? 'Exporting...' : 'Export to Excel',
              onClick: exportToExcel,
              colorScheme: 'success-200',
              componentIconLeft: 'ExcelIcon', 
              componentIconSize: '25', 
              iconColor: 'white-200',
              variant: 'gradient',
              font: 'md',
              animation: '',
              squircle: '6xl',
              width: '160px',
              height: '38px',
              type: 'submit',
              textColor: 'black-100',
              shadowPosition: 'to-bottom',
              shadowColor: 'white-600',
            },
            {
              text: 'Filters',
              onClick: handleOpenFiltersModal,
              colorScheme: 'warning-500',
              componentIconLeft: 'IconlyFilter', 
              componentIconSize: '25', 
              iconColor: 'black-100',
              variant: 'gradient',
              font: 'md',
              animation: '',
              squircle: '6xl',
              width: '160px',
              height: '38px',
              type: 'submit',
              textColor: 'black-100',
              shadowPosition: 'to-bottom',
              shadowColor: 'white-600',
            },
          ]}
        />
      </div>

      {loading ? (
        <TableSkeleton columns={toolkitColumns.length} rows={25} />
      ) : error ? (
        <Text variant="body" className="stock toolkit error-message">
          {error}
        </Text>
      ) : (
        <div className="stock toolkit table-wrap">
          <Table
            columns={toolkitColumns}
            data={filteredToolkits}
            rowKey={(item) => item._id}
            emptyMessage="No toolkits found"
          />
        </div>
      )}

      <ToolkitSidebar
        show={!!selectedToolkit}
        selectedToolkit={selectedToolkit}
        isMinimized={sidebarMinimized}
        isMaximized={sidebarMaximized}
        onClose={handleSidebarClose}
        onMinimize={handleSidebarMinimize}
        onMaximize={handleSidebarMaximize}
        variantSearchTerm={variantSearchTerm}
        variantFilterSize={variantFilterSize}
        variantFilterColor={variantFilterColor}
        variantFilterStatus={variantFilterStatus}
        onVariantSearchChange={handleVariantSearchChange}
        onVariantFilterSizeChange={handleVariantFilterSizeChange}
        onVariantFilterColorChange={handleVariantFilterColorChange}
        onVariantFilterStatusChange={handleVariantFilterStatusChange}
        onClearVariantFilters={handleClearVariantFilters}
        getFilteredAndGroupedVariants={getFilteredAndGroupedVariants}
        onVariantRowClick={showVariantDetails}
        onEditVariant={openUpdateVariantForm}
        onDeleteVariant={deleteVariant}
        onEditToolkit={openUpdateForm}
        onAddVariant={openAddVariantForm}
        onPrintBarcode={handlePrintBarcode}
        onDeleteToolkit={deleteToolkit}
      />

      <Modal
        isOpen={showReduceStockModal}
        onClose={handleCloseReduceStockModal}
        type="form"
        mode="sheet"
        title="Reduce Stock"
        modalHeight="80%"
        modalWidth="80%"
        message={`Reducing stock for: ${selectedVariant?.size} - ${selectedVariant?.color}`}
        formFields={[
          { name: 'quantity', label: 'Quantity', type: 'number', placeholder: '1', required: true },
          { name: 'assignedDate', label: 'Assigned Date', type: 'date', required: true },
          {
            name: 'person',
            label: 'Assigned To',
            type: 'search-select',
            placeholder: 'Search for a person...',
            required: true,
            options: [
              ...filteredUsers.map((u) => ({ label: `${u.name} (${u.type})`, value: u._id })),
              ...(userSearchTerm && !filteredUsers.some((u) => u.name.toLowerCase() === userSearchTerm.toLowerCase())
                ? [{ label: `Add "${userSearchTerm}" as new`, value: userSearchTerm }]
                : []),
            ],
            onSearchFocus: handlePersonSearchFocus,
          },
          { name: 'reason', label: 'Reason', type: 'text', placeholder: 'Enter reason', required: true },
        ]}
        formValues={{
          quantity: reduceStockData.quantity,
          assignedDate: reduceStockData.assignedDate instanceof Date
            ? reduceStockData.assignedDate.toISOString().split('T')[0]
            : reduceStockData.assignedDate,
          person: userSearchTerm,
          reason: reduceStockData.reason,
        }}
        onFormChange={handleReduceStockFormChange}
        buttonText="Reduce Stock"
        onButtonClick={handleReduceStockButtonClick}
        secondaryButtonText="Cancel"
        onSecondaryClick={handleCloseReduceStockModal}
      />

      <Modal
        isOpen={showUnregisteredPersonWarning}
        onClose={handleCancelUnregisteredPersonWarning}
        type="warning"
        title="Unregistered Person"
        message={`"${reduceStockData.person}" is not registered anywhere in the system. You can skip and continue, or go back and select a registered person.`}
        buttonText="Skip Anyway"
        onButtonClick={handleConfirmUnregisteredPerson}
        secondaryButtonText="Go Back"
        onSecondaryClick={handleCancelUnregisteredPersonWarning}
      />

      <Modal
        isOpen={showForm}
        onClose={handleCloseToolkitForm}
        type="form"
        mode="sheet"
        modalHeight="80%"
        modalWidth="80%"
        title={formMode === 'add' ? 'Add New Toolkit' : 'Update Toolkit'}
        message="Enter the toolkit details below"
        formFields={[
          { name: 'name', label: 'Tool Name', type: 'text', placeholder: 'Search or enter tool name', required: true },
          { name: 'type', label: 'Type', type: 'select', placeholder: 'Select type', required: true, options: PREDEFINED_TYPES.map((t) => ({ value: t, label: t })) },
        ]}
        formValues={{ name: nameSearchTerm, type: typeSearchTerm }}
        onFormChange={handleToolkitFormChange}
        buttonText={formMode === 'add' ? 'Add Toolkit' : 'Update Toolkit'}
        onButtonClick={handleFormSubmit}
        secondaryButtonText="Cancel"
        onSecondaryClick={handleCloseToolkitForm}
      />

      <Modal
        isOpen={showVariantForm}
        onClose={handleCloseVariantForm}
        type="form"
        mode="sheet"
        modalHeight="80%"
        modalWidth="80%"
        title={variantFormMode === 'add' ? 'Add New Variant' : 'Update Variant'}
        message={`${variantFormMode === 'add' ? 'Adding' : 'Updating'} variant for: ${selectedToolkit?.name || ''}`}
        formFields={[
          {
            name: 'size', label: 'Size', type: 'searchable-select', placeholder: 'Type to search or add new size...',
            required: true, allowCustom: true, showDropdown: showSizeSearchDropdown,
            dropdownItems: sizeDropdownItems.map((s) => ({ value: s, label: s })),
            onSearchFocus: handleSizeSearchFocus, onSearch: handleSizeSearch,
            onSearchBlur: handleSizeSearchBlur, onItemSelect: handleSizeItemSelect,
          },
          {
            name: 'color', label: 'Color', type: 'searchable-select', placeholder: 'Type to search or add new color...',
            required: true, allowCustom: true, showDropdown: showColorSearchDropdown,
            dropdownItems: colorDropdownItems.map((c) => ({ value: c, label: c })),
            onSearchFocus: handleColorSearchFocus, onSearch: handleColorSearch,
            onSearchBlur: handleColorSearchBlur, onItemSelect: handleColorItemSelect,
          },
          { name: 'stockCount', label: 'Stock Count', type: 'number', placeholder: '0', required: true },
          { name: 'minStockLevel', label: 'Minimum Stock Level', type: 'number', placeholder: '5', required: true },
        ]}
        formValues={{
          size: variantFormData.size,
          color: variantFormData.color,
          stockCount: variantFormData.stockCount,
          minStockLevel: variantFormData.minStockLevel,
        }}
        onFormChange={handleVariantFormChange}
        buttonText={variantFormMode === 'add' ? 'Add Variant' : 'Update Variant'}
        onButtonClick={handleVariantFormSubmit}
        secondaryButtonText="Cancel"
        onSecondaryClick={handleCloseVariantForm}
      />

      {showToolkitHistory && (
        <div className="stock toolkit history-overlay">
          <div className="stock toolkit history-modal">
            <div className="stock toolkit history-header">
              <Text variant="title">All Toolkits History</Text>
              <button className="stock toolkit history-close-btn" onClick={handleCloseToolkitHistory}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <div className="stock toolkit history-filters">
              <div className="stock toolkit history-filter-type">
                <label className="stock toolkit history-filter-label">
                  <input type="radio" value="all" checked={historyFilter.type === 'all'} onChange={handleHistoryFilterTypeAllChange} />
                  All History
                </label>
                <label className="stock toolkit history-filter-label">
                  <input type="radio" value="range" checked={historyFilter.type === 'range'} onChange={handleHistoryFilterTypeChange} />
                  Date Range
                </label>
                <label className="stock toolkit history-filter-label">
                  <input type="radio" value="last" checked={historyFilter.type === 'last'} onChange={handleHistoryFilterTypeChange} />
                  Last N Period
                </label>
              </div>

              {historyFilter.type === 'range' && (
                <div className="stock toolkit history-date-range">
                  <div className="stock toolkit history-form-group">
                    <Text variant="label" as="label">From Date</Text>
                    <input type="date" value={historyFilter.dateFrom} onChange={handleHistoryDateFromChange} />
                  </div>
                  <div className="stock toolkit history-form-group">
                    <Text variant="label" as="label">To Date</Text>
                    <input type="date" value={historyFilter.dateTo} onChange={handleHistoryDateToChange} />
                  </div>
                  <Button
                    text="Apply Filter"
                    onClick={fetchAllToolkitsHistory}
                    colorScheme="amber-800"
                    variant="gradient"
                    textColor="white-100"
                    squircle="6xl"
                    font="md"
                    height="42px"
                    width="auto"
                    padding="0 20px"
                    animation=""
                  />
                </div>
              )}

              {historyFilter.type === 'last' && (
                <div className="stock toolkit history-last-n">
                  <div className="stock toolkit history-form-group">
                    <Text variant="label" as="label">Last</Text>
                    <input type="number" min="1" value={historyFilter.lastN} onChange={handleHistoryLastNChange} />
                  </div>
                  <div className="stock toolkit history-form-group">
                    <Text variant="label" as="label">Unit</Text>
                    <select value={historyFilter.lastUnit} onChange={handleHistoryLastUnitChange}>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                  <Button
                    text="Apply Filter"
                    onClick={fetchAllToolkitsHistory}
                    colorScheme="amber-800"
                    variant="gradient"
                    textColor="white-100"
                    squircle="6xl"
                    font="md"
                    height="42px"
                    width="auto"
                    padding="0 20px"
                    animation=""
                  />
                </div>
              )}

              <div className="stock toolkit history-summary">
                <Text variant="body" className="stock toolkit history-count">
                  Total Records: <strong>{toolkitHistory.length}</strong>
                </Text>
                {historyFilter.type === 'range' && historyFilter.dateFrom && historyFilter.dateTo && (
                  <Text variant="caption" className="stock toolkit history-range-display">
                    Showing: {new Date(historyFilter.dateFrom).toLocaleDateString()} - {new Date(historyFilter.dateTo).toLocaleDateString()}
                  </Text>
                )}
                {historyFilter.type === 'last' && (
                  <Text variant="caption" className="stock toolkit history-range-display">
                    Showing: Last {historyFilter.lastN} {historyFilter.lastUnit}
                  </Text>
                )}
              </div>
            </div>

            <div className="stock toolkit history-content">
              <Table
                columns={historyColumns}
                data={toolkitHistory}
                rowKey={(_item, index) => index}
                emptyMessage="No history available for selected filter"
              />
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showFiltersModal}
        onClose={handleCloseFiltersModal}
        type="filters"
        title="Toolkit Filters"
        message="Customize your export and view with advanced filtering options"
        filterGroups={[
          {
            name: 'dateFilter',
            label: 'Date Range',
            type: 'select',
            options: [
              { value: 'all', label: 'All Time' },
              { value: 'thismonth', label: 'This Month' },
              { value: 'lastXmonths', label: 'Last X Months' },
              { value: 'custom', label: 'Custom Range' },
            ],
          },
          ...(filters.dateFilter === 'lastXmonths' ? [{
            name: 'lastMonthsCount',
            label: 'Number of Months',
            type: 'select',
            options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({ value: n, label: `${n} Month${n > 1 ? 's' : ''}` })),
          }] : []),
          ...(filters.dateFilter === 'custom' ? [
            { name: 'customStartDate', label: 'Start Date', type: 'date' },
            { name: 'customEndDate', label: 'End Date', type: 'date' },
          ] : []),
          { name: 'toolkits', label: 'Toolkits', type: 'checkbox', options: toolkits.map((t) => ({ value: t._id, label: t.name })) },
          { name: 'sizes', label: 'Sizes', type: 'checkbox', options: PREDEFINED_SIZES.map((s) => ({ value: s, label: s })) },
          { name: 'colors', label: 'Colors', type: 'checkbox', options: PREDEFINED_COLORS.map((c) => ({ value: c, label: c })) },
          {
            name: 'statuses',
            label: 'Stock Status',
            type: 'checkbox',
            options: [
              { value: 'available', label: 'In Stock' },
              { value: 'low', label: 'Low Stock' },
              { value: 'out', label: 'Out of Stock' },
            ],
          },
        ]}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        buttonText="Apply Filters"
      />
    </div>
  );
};

export default Toolkits;