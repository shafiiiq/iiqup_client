import Modal from '@/shared/components/widgets/modal/Modal';
import { COMPANY_OPTIONS, RENT_BASIS_OPTIONS, SHIFT_OPTIONS, STATUS_OPTIONS_ADD, STATUS_OPTIONS_EDIT, EXPORT_COLUMN_OPTIONS, DEFAULT_EXPORT_COLUMNS } from '../../constants/equipment.modal.constant';
import { EQUIPMENT_IDLE_AT_OPTIONS } from '../../constants/equipment.constant';

const operatorOptions = (operatorList) =>
  operatorList.map(op => ({ label: op.name, value: op.name, id: op._id || op.id }));

const siteOptions = (sites) =>
  sites.map(s => ({ label: s, value: s }));

function EquipmentModals({
  operator,
  sites,
  searchTerm,
  onSiteFocus,

  showAddModal,
  addEquipmentForm,
  onAddFormChange,
  onAddSubmit,
  onAddClose,

  showEditModal,
  editFormData,
  onEditFormChange,
  onEditSubmit,
  onEditClose,

  showDeleteModal,
  equipmentToDelete,
  onDeleteConfirm,
  onDeleteClose,

  showStatusModal,
  deleteStatus,
  onStatusClose,

  showExportModal,
  exportColumns,
  onExportColumnChange,
  onExportConfirm,
  onExportReset,
  onExportClose,

  showFuelProgressModal,
  fuelProgress,
  outsideEquipmentForm,
  onAddAsOutside,

  showMobilizeModal,
  mobilizeForm,
  selectedEquipmentForAction,
  onMobilizeFormChange,
  onMobilizeOperatorAdd,
  onMobilizeOperatorChange,
  onMobilizeOperatorRemove,
  onMobilizeSubmit,
  onMobilizeClose,
  isMobilizing,

  showAddShiftModal,
  addShiftForm,
  onAddShiftFormChange,
  onAddShiftOperatorAdd,
  onAddShiftOperatorRemove,
  onAddShiftSubmit,
  onAddShiftClose,
  isAddingShift,

  showDemobilizeModal,
  demobilizeDatePrompt,
  demobilizeForm,
  onDemobilizeFormChange,
  onDemobilizeAskDate,
  onDemobilizeSubmit,
  onDemobilizeClose,
  isDemobilizing,

  showReplaceOperatorModal,
  replaceOperatorForm,
  onReplaceOperatorFormChange,
  onReplaceOperatorSubmit,
  onReplaceOperatorClose,
  isReplacingOperator,

  showReplaceEquipmentModal,
  replaceEquipmentForm,
  replaceEquipmentResults,
  onReplaceEquipmentFormChange,
  onReplaceEquipmentSubmit,
  onReplaceEquipmentClose,

  showMarkSoldModal,
  equipmentToMarkSold,
  onMarkSoldConfirm,
  onMarkSoldClose,

  showIdleLocationModal,
  idleLocationForm,
  onIdleLocationFormChange,
  onIdleLocationSubmit,
  onIdleLocationClose,

  showRemarksModal,
  remarksForm,
  onRemarksFormChange,
  onRemarksSubmit,
  onRemarksClose,
}) {
  return (
    <>
      <Modal
        isOpen={showAddModal}
        onClose={onAddClose}
        type="form"
        mode="sheet"
        modalWidth="98%"
        title="Add New Equipment"
        message="Fill in the details to add new equipment"
        formFields={[
          { name: 'machine', label: 'Machine', type: 'text', placeholder: 'Enter machine name', required: true },
          { name: 'regNo', label: 'Registration No', type: 'text', placeholder: 'Enter reg number', required: true },
          { name: 'coc', label: 'COC', type: 'text', placeholder: 'Enter COC' },
          { name: 'brand', label: 'Brand', type: 'text', placeholder: 'Enter brand', required: true },
          { name: 'year', label: 'Year', type: 'number', placeholder: 'Enter year', required: true },
          { name: 'company', label: 'Company', type: 'select', required: true, options: COMPANY_OPTIONS },
          ...(addEquipmentForm.company === 'HIRED' ? [
            { name: 'hiredFrom', label: 'Hired From', type: 'text', placeholder: 'Enter company/organization name', required: true },
          ] : []),
          { name: 'rentRate.basis', label: 'Rent Basis', type: 'select', options: RENT_BASIS_OPTIONS },
          { name: 'rentRate.rate', label: 'Rent Rate (QAR)', type: 'number', placeholder: 'Enter rate amount' },
          { name: 'istimaraExpiry', label: 'Istimara Expiry', type: 'date' },
          { name: 'insuranceExpiry', label: 'Insurance Expiry', type: 'date' },
          { name: 'tpcExpiry', label: 'TPC Expiry', type: 'date' },
          { name: 'status', label: 'Status', type: 'select', required: true, options: STATUS_OPTIONS_ADD },
          { name: 'operator', label: 'Operator', type: 'search-select', placeholder: 'Search operator...', required: true, options: operatorOptions(operator) },
          { name: 'operatorShift', label: 'Operator Shift', type: 'select', options: SHIFT_OPTIONS },
          { name: 'site', label: 'Site', type: 'search-select', placeholder: 'Search or add site...', required: true, options: siteOptions(sites), onSearchFocus: onSiteFocus },
          { name: 'location', label: 'Location (Optional)', type: 'search-select', placeholder: 'Search or add location...', options: siteOptions(sites), onSearchFocus: onSiteFocus },
        ]}
        formValues={addEquipmentForm}
        onFormChange={onAddFormChange}
        buttonText="Add Equipment"
        onButtonClick={onAddSubmit}
        secondaryButtonText="Cancel"
        onSecondaryClick={onAddClose}
      />

      <Modal
        isOpen={showEditModal}
        onClose={onEditClose}
        type="form"
        title="Update Equipment"
        mode="sheet"
        modalWidth="98%"
        message="Edit the equipment details below"
        formFields={[
          { name: 'machine', label: 'Machine', type: 'text', placeholder: 'Enter machine name', required: true },
          { name: 'regNo', label: 'Registration No', type: 'text', placeholder: 'Enter reg number', required: true },
          { name: 'coc', label: 'COC', type: 'text', placeholder: 'Enter COC' },
          { name: 'brand', label: 'Brand', type: 'text', placeholder: 'Enter brand', required: true },
          { name: 'year', label: 'Year', type: 'text', placeholder: 'Enter year', required: true },
          { name: 'company', label: 'Company', type: 'select', required: true, options: COMPANY_OPTIONS },
          ...(editFormData.company === 'HIRED' ? [
            { name: 'hiredFrom', label: 'Hired From', type: 'text', placeholder: 'Enter company/organization name', required: true },
          ] : []),
          { name: 'rentRate.basis', label: 'Rent Basis', type: 'select', options: RENT_BASIS_OPTIONS },
          { name: 'rentRate.rate', label: 'Rent Rate (QAR)', type: 'number', placeholder: 'Enter rate amount' },
          { name: 'istimaraExpiry', label: 'Istimara Expiry', type: 'date' },
          { name: 'insuranceExpiry', label: 'Insurance Expiry', type: 'date' },
          { name: 'tpcExpiry', label: 'TPC Expiry', type: 'date' },
          { name: 'status', label: 'Status', type: 'select', required: true, options: STATUS_OPTIONS_EDIT },
          { name: 'operator', label: 'Operator', type: 'search-select', placeholder: 'Search operator...', required: true, options: operatorOptions(operator) },
          { name: 'operatorShift', label: 'Operator Shift', type: 'select', options: SHIFT_OPTIONS },
          { name: 'site', label: 'Site', type: 'search-select', placeholder: 'Search or add site...', required: true, options: siteOptions(sites), onSearchFocus: onSiteFocus },
          { name: 'location', label: 'Location (Optional)', type: 'search-select', placeholder: 'Search or add location...', options: siteOptions(sites), onSearchFocus: onSiteFocus },
        ]}
        formValues={editFormData}
        onFormChange={onEditFormChange}
        buttonText="Save Changes"
        onButtonClick={onEditSubmit}
        secondaryButtonText="Reset Changes"
        onSecondaryClick={onEditClose}
      />

      <Modal
        isOpen={showDeleteModal}
        onClose={onDeleteClose}
        type="error"
        title="Delete Equipment?"
        message={`Are you sure you want to delete equipment ${equipmentToDelete?.regNo}?`}
        buttonText="Delete"
        onButtonClick={onDeleteConfirm}
        secondaryButtonText="Cancel"
        onSecondaryClick={onDeleteClose}
      />

      <Modal
        isOpen={showStatusModal}
        onClose={onStatusClose}
        type={deleteStatus.isError ? 'error' : 'success'}
        title={deleteStatus.isError ? 'Error' : 'Success'}
        message={deleteStatus.message}
        secondaryButtonText={deleteStatus.isError ? 'X' : 'Ok'}
        onSecondaryClick={onStatusClose}
      />

      <Modal
        isOpen={showExportModal}
        onClose={onExportClose}
        type="filters"
        title="Select Columns to Export"
        message="Choose which columns to include in the Excel file"
        filterGroups={[{ name: 'columns', label: 'Available Columns', type: 'checkbox', options: EXPORT_COLUMN_OPTIONS }]}
        filterValues={{ columns: Object.entries(exportColumns).filter(([, v]) => v).map(([k]) => k) }}
        onFilterChange={(_, value) => {
          const updated = { ...DEFAULT_EXPORT_COLUMNS };
          Object.keys(updated).forEach(key => { updated[key] = value.includes(key); });
          onExportColumnChange(updated);
        }}
        onApplyFilters={onExportConfirm}
        onResetFilters={onExportReset}
        buttonText="Export to Excel"
        secondaryButtonText="Cancel"
        onSecondaryClick={onExportClose}
      />

      <Modal
        isOpen={showFuelProgressModal}
        type="progress"
        title="Loading Fuel Data"
        message="Fetching fuel consumption data, please wait..."
        progress={fuelProgress}
        progressText="Processing..."
      />

      <Modal
        isOpen={showMobilizeModal}
        onClose={onMobilizeClose}
        type="form"
        mode="sheet"
        modalWidth="98%"
        title={`Mobilize Equipment - ${selectedEquipmentForAction?.regNo || ''}`}
        message="Fill in the mobilization details"
        formFields={[
          { name: 'deployType', label: 'Deploy To', type: 'select', required: true, options: [{ value: 'site', label: 'Site' }, { value: 'company', label: 'Client Company (Lease)' }] },
          { name: 'site', label: 'Site', type: 'search-select', placeholder: 'Search or add site...', required: mobilizeForm.deployType === 'site', disabled: mobilizeForm.deployType === 'company', options: siteOptions(sites), onSearchFocus: onSiteFocus },
          { name: 'clientCompany', label: 'Client Company', type: 'text', placeholder: 'Enter client company name', disabled: mobilizeForm.deployType === 'site' },
          { name: 'location', label: 'Location (Optional)', type: 'search-select', placeholder: 'Search or add location...', options: siteOptions(sites), onSearchFocus: onSiteFocus },
          { name: 'rentRate.basis', label: 'Rent Basis (Optional)', type: 'select', options: RENT_BASIS_OPTIONS },
          { name: 'rentRate.rate', label: 'Rent Rate QAR (Optional)', type: 'number', placeholder: 'Enter rate amount' },
          { name: 'date', label: 'Date (Optional)', type: 'date' },
          { name: 'time', label: 'Time (Optional)', type: 'time' },
          { name: 'remarks', label: 'Remarks (Optional)', type: 'textarea', placeholder: 'Add any additional notes' },
          { name: 'isOneDayMob', label: 'One Day Mobilization', type: 'checkbox', description: 'Equipment will be mobilized and demobilized on the same day' },
          { name: 'demobDate', label: 'Demob Date', type: 'date', required: mobilizeForm.isOneDayMob, disabled: !mobilizeForm.isOneDayMob },
          { name: 'demobTime', label: 'Demob Time (Optional)', type: 'time', disabled: !mobilizeForm.isOneDayMob },
          { name: 'demobRemarks', label: 'Demob Remarks', type: 'textarea', placeholder: 'Add demob notes', disabled: !mobilizeForm.isOneDayMob },
          { name: 'withOperator', label: 'With Operator', type: 'checkbox', description: 'Check if equipment is deployed with an operator' },

          ...(mobilizeForm.withOperator && !mobilizeForm.withShift ? [
            { name: 'operator', label: 'Operator', type: 'search-select', placeholder: 'Search operator...', required: true, options: operatorOptions(operator) },
            {
              name: 'singleOperatorShift', label: 'Shift', type: 'select', options: [
                { value: 'Full Shift', label: 'Full Shift' },
                { value: 'Day Shift', label: 'Day Shift' },
                { value: 'Night Shift', label: 'Night Shift' },
              ]
            },
          ] : []),

          ...(mobilizeForm.withOperator ? [
            { name: 'withShift', label: 'Multiple Shifts', type: 'checkbox', description: 'Enable if operators work in different shifts' },
          ] : []),

          ...(mobilizeForm.withOperator && mobilizeForm.withShift && !mobilizeForm.moreShifts ? [
            { name: 'operators[0].operatorName', label: 'Day Shift Operator', type: 'search-select', placeholder: 'Search operator...', options: operatorOptions(operator) },
            { name: 'operators[1].operatorName', label: 'Night Shift Operator', type: 'search-select', placeholder: 'Search operator...', options: operatorOptions(operator) },
            { name: 'moreShifts', label: 'More Shifts', type: 'checkbox', description: 'Add additional custom shifts beyond day and night' },
          ] : []),

          ...(mobilizeForm.withOperator && mobilizeForm.withShift && mobilizeForm.moreShifts ? [
            { name: 'moreShifts', label: 'More Shifts', type: 'checkbox', description: 'Add additional custom shifts beyond day and night' },
            ...mobilizeForm.operators.flatMap((op, index) => [
              {
                name: `operators[${index}].operatorName`,
                label: index === 0 ? 'Operator' : `Operator ${index + 1}`,
                type: 'search-select', placeholder: 'Search operator...', required: true,
                options: operatorOptions(operator), groupKey: `operator-row-${index}`,
              },
              {
                name: `operators[${index}].shiftStart`,
                label: index === 0 ? 'Shift Start (optional)' : `Shift Start ${index + 1} (optional)`,
                type: 'time', groupKey: `operator-row-${index}`,
              },
              {
                name: `operators[${index}].shiftEnd`,
                label: index === 0 ? 'Shift End (optional)' : `Shift End ${index + 1} (optional)`,
                type: 'time', groupKey: `operator-row-${index}`,
                groupAction: { onDelete: () => onMobilizeOperatorRemove(index), isLast: true },
              },
            ]),
            {
              name: '__add-operator-row', type: 'add-row-button', label: '+ Add Shift',
              onAddRow: onMobilizeOperatorAdd,
              onRemoveRow: mobilizeForm.operators.length > 0
                ? () => onMobilizeOperatorRemove(mobilizeForm.operators.length - 1)
                : undefined,
            },
          ] : []),
        ]}
        formValues={mobilizeForm}
        onFormChange={onMobilizeFormChange}
        buttonText={isMobilizing ? 'Mobilizing...' : 'Mobilize Equipment'}
        onButtonClick={onMobilizeSubmit}
        buttonDisabled={isMobilizing}
        secondaryButtonText="Reset"
        onSecondaryClick={onMobilizeClose}
      />

      <Modal
        isOpen={showAddShiftModal}
        onClose={onAddShiftClose}
        type="form"
        mode="sheet"
        modalWidth="98%"
        title={`Add Shifts - ${selectedEquipmentForAction?.regNo || ''}`}
        message={`Current operators: ${selectedEquipmentForAction?.certificationBody?.map(cb => `${cb.operatorName}${cb.shiftName ? ` (${cb.shiftName})` : ''}`).join(', ') || 'None'}`}
        formFields={[
          ...addShiftForm.operators.flatMap((op, index) => [
            {
              name: `addShift_operators[${index}].operatorName`,
              label: `Operator ${index + 1}`,
              type: 'search-select', placeholder: 'Search operator...', required: true,
              options: operatorOptions(operator), groupKey: `add-shift-row-${index}`,
            },
            {
              name: `addShift_operators[${index}].shiftName`,
              label: `Shift ${index + 1}`,
              type: 'select',
              options: [
                { value: 'Day Shift', label: 'Day Shift' },
                { value: 'Night Shift', label: 'Night Shift' },
                { value: 'Full Shift', label: 'Full Shift' },
              ],
              groupKey: `add-shift-row-${index}`,
            },
            {
              name: `addShift_operators[${index}].shiftStart`,
              label: `Shift Start ${index + 1} (Optional)`,
              type: 'time', groupKey: `add-shift-row-${index}`,
            },
            {
              name: `addShift_operators[${index}].shiftEnd`,
              label: `Shift End ${index + 1} (Optional)`,
              type: 'time', groupKey: `add-shift-row-${index}`,
              groupAction: { onDelete: () => onAddShiftOperatorRemove(index), isLast: true },
            },
          ]),
          {
            name: '__add-shift-row', type: 'add-row-button', label: '+ Add Operator',
            onAddRow: onAddShiftOperatorAdd,
            onRemoveRow: addShiftForm.operators.length > 0
              ? () => onAddShiftOperatorRemove(addShiftForm.operators.length - 1)
              : undefined,
          },
          { name: 'addShift_date', label: 'Date (Optional)', type: 'date' },
          { name: 'addShift_time', label: 'Time (Optional)', type: 'time' },
          { name: 'addShift_remarks', label: 'Remarks (Optional)', type: 'textarea', placeholder: 'Notes about this shift addition' },
        ]}
        formValues={{
          ...addShiftForm.operators.reduce((acc, op, i) => ({
            ...acc,
            [`addShift_operators[${i}].operatorName`]: op.operatorName || '',
            [`addShift_operators[${i}].shiftName`]: op.shiftName || '',
            [`addShift_operators[${i}].shiftStart`]: op.shiftStart || '',
            [`addShift_operators[${i}].shiftEnd`]: op.shiftEnd || '',
          }), {}),
          addShift_date: addShiftForm.date || '',
          addShift_time: addShiftForm.time || '',
          addShift_remarks: addShiftForm.remarks || '',
        }}
        onFormChange={onAddShiftFormChange}
        buttonText={isAddingShift ? 'Adding Shifts...' : 'Add Shifts'}
        onButtonClick={onAddShiftSubmit}
        buttonDisabled={isAddingShift}
        secondaryButtonText="Cancel"
        onSecondaryClick={onAddShiftClose}
      />

      <Modal
        isOpen={showDemobilizeModal && !demobilizeDatePrompt}
        onClose={onDemobilizeClose}
        type="warning"
        title={`Demobilize Equipment - ${selectedEquipmentForAction?.regNo || ''}`}
        message={`Are you sure you want to demobilize ${selectedEquipmentForAction?.machine || 'this equipment'}? Do you want to select a custom date?`}
        buttonText="Yes, Select Date"
        onButtonClick={onDemobilizeAskDate}
        buttonDisabled={isDemobilizing}
        secondaryButtonText={isDemobilizing ? 'Demobilizing...' : 'Demobilize'}
        onSecondaryClick={onDemobilizeSubmit}
        secondaryButtonDisabled={isDemobilizing}
      />

      <Modal
        isOpen={showDemobilizeModal && demobilizeDatePrompt}
        onClose={onDemobilizeClose}
        type="form"
        mode="sheet"
        modalWidth="98%"
        title={`Demobilize Equipment - ${selectedEquipmentForAction?.regNo || ''}`}
        message="Select the demobilization date"
        formFields={[
          ...(demobilizeForm.allShifts?.length > 1 ? [{
            name: 'demobAll', label: 'Demobilize Entire Equipment', type: 'checkbox',
            description: 'Uncheck to demobilize only one shift',
          }] : []),
          ...(demobilizeForm.allShifts?.length > 1 && !demobilizeForm.demobAll ? [{
            name: 'selectedShift', label: 'Select Shift to Demobilize', type: 'select', required: true,
            options: demobilizeForm.allShifts.map(s => ({
              value: s.shiftName || s.operatorName,
              label: s.shiftName ? `${s.shiftName} — ${s.operatorName}` : s.operatorName,
            })),
          }] : []),
          { name: 'date', label: 'Demobilization Date', type: 'date', required: true },
          { name: 'time', label: 'Time (Optional)', type: 'time' },
          { name: 'remarks', label: 'Remarks (Optional)', type: 'textarea', placeholder: 'Add any notes' },
        ]}
        formValues={demobilizeForm}
        onFormChange={onDemobilizeFormChange}
        buttonText={isDemobilizing ? 'Demobilizing...' : 'Demobilize'}
        onButtonClick={onDemobilizeSubmit}
        buttonDisabled={isDemobilizing}
        secondaryButtonText="Reset"
        onSecondaryClick={onDemobilizeClose}
      />

      <Modal
        isOpen={showReplaceOperatorModal}
        onClose={onReplaceOperatorClose}
        type="form"
        mode="sheet"
        modalWidth="98%"
        title={`Replace Operator - ${selectedEquipmentForAction?.regNo || ''}`}
        message="Enter the new operator details"
        formFields={[
          ...(replaceOperatorForm.allShifts?.length > 1 ? [{
            name: 'replaceAll',
            label: 'Replace All Operators',
            type: 'checkbox',
            description: 'Replace all shift operators with a single new operator',
          }] : []),

          ...(replaceOperatorForm.allShifts?.length > 1 && !replaceOperatorForm.replaceAll ? [{
            name: 'selectedShift',
            label: 'Select Operator to Replace',
            type: 'select',
            required: true,
            options: replaceOperatorForm.allShifts.map(s => ({
              value: s.shiftName || s.operatorName,
              label: s.shiftName ? `${s.shiftName} — ${s.operatorName}` : s.operatorName,
            })),
          }] : []),

          ...(!replaceOperatorForm.replaceAll ? [
            { name: 'currentOperator', label: 'Current Operator', type: 'text', disabled: true },
            { name: 'targetShiftName', label: 'Shift Being Replaced', type: 'text', disabled: true },
          ] : []),

          { name: 'replacedOperator', label: replaceOperatorForm.replaceAll ? 'New Operator (All Shifts)' : 'New Operator', type: 'search-select', placeholder: 'Search operator...', required: true, options: operatorOptions(operator) },
          { name: 'date', label: 'Date (Optional)', type: 'date' },
          { name: 'time', label: 'Time (Optional)', type: 'time' },
          { name: 'remarks', label: 'Remarks (Optional)', type: 'textarea', placeholder: 'Reason for replacement or notes' },
        ]}
        formValues={replaceOperatorForm}
        onFormChange={onReplaceOperatorFormChange}
        buttonText={isReplacingOperator ? 'Replacing...' : 'Replace Operator'}
        onButtonClick={onReplaceOperatorSubmit}
        buttonDisabled={isReplacingOperator}
        secondaryButtonText="Cancel"
        onSecondaryClick={onReplaceOperatorClose}
      />

      <Modal
        isOpen={showReplaceEquipmentModal}
        onClose={onReplaceEquipmentClose}
        type="form"
        mode="sheet"
        modalWidth="98%"
        title={`Replace Equipment - ${selectedEquipmentForAction?.regNo || ''}`}
        message={`Current equipment will be replaced. Current site: ${selectedEquipmentForAction?.site || 'N/A'}`}
        formFields={[
          { name: 'replacedEquipmentRegNo', label: 'New Equipment Reg No', type: 'search-select', placeholder: 'Search equipment by reg no...', required: true, options: replaceEquipmentResults.map(eq => ({ label: `${eq.regNo} - ${eq.machine}`, value: eq.regNo })) },
          { name: 'replacedEquipmentMachine', label: 'New Equipment Machine', type: 'text', placeholder: 'Auto-filled', disabled: true },
          ...(replaceEquipmentForm.operators || []).flatMap((op, index) => [
            {
              name: `operators[${index}].operatorName`,
              label: replaceEquipmentForm.operators.length > 1
                ? `Operator ${index + 1}${op.shiftName ? ` — ${op.shiftName}` : ''} (Current Equipment)`
                : 'Operator (Current Equipment)',
              type: 'search-select', placeholder: 'Search operator...',
              options: operatorOptions(operator),
            },
          ]),
          { name: 'newSiteForReplaced', label: 'New Site for Current Equipment (Optional)', type: 'search-select', placeholder: 'Search or add site...', options: siteOptions(sites), onSearchFocus: onSiteFocus },
          { name: 'date', label: 'Date (Optional)', type: 'date' },
          { name: 'time', label: 'Time (Optional)', type: 'time' },
          { name: 'remarks', label: 'Remarks (Optional)', type: 'textarea', placeholder: 'Reason for replacement or notes' },
        ]}
        formValues={{
          ...replaceEquipmentForm,
          ...(replaceEquipmentForm.operators || []).reduce((acc, op, i) => ({
            ...acc,
            [`operators[${i}].operatorName`]: op.operatorName || '',
          }), {}),
        }}
        onFormChange={onReplaceEquipmentFormChange}
        buttonText="Replace Equipment"
        onButtonClick={onReplaceEquipmentSubmit}
        secondaryButtonText="Cancel"
        onSecondaryClick={onReplaceEquipmentClose}
      />

      <Modal
        isOpen={showMarkSoldModal}
        onClose={onMarkSoldClose}
        type="warning"
        title="Mark Equipment as Sold?"
        message={`Are you sure you want to mark ${equipmentToMarkSold?.regNo || 'this equipment'} as sold? It will move to the Sold state and stop appearing in active listings.`}
        buttonText="Mark as Sold"
        onButtonClick={onMarkSoldConfirm}
        secondaryButtonText="Cancel"
        onSecondaryClick={onMarkSoldClose}
      />

      <Modal
        isOpen={showIdleLocationModal}
        onClose={onIdleLocationClose}
        type="form"
        mode="dialog"
        modalHeight="450px"
        title={`Set Idle Location - ${selectedEquipmentForAction?.regNo || ''}`}
        message="Choose whether this equipment is idle at a site or in the garage"
        formFields={[
          { name: 'idleAt', label: 'Idle At', type: 'select', required: true, options: EQUIPMENT_IDLE_AT_OPTIONS },
          ...(idleLocationForm.idleAt === 'site' ? [
            { name: 'idleSite', label: 'Site', type: 'search-select', placeholder: 'Search or select site...', required: true, options: siteOptions(sites), onSearchFocus: onSiteFocus },
          ] : []),
        ]}
        formValues={idleLocationForm}
        onFormChange={onIdleLocationFormChange}
        buttonText="Save"
        onButtonClick={onIdleLocationSubmit}
        secondaryButtonText="Cancel"
        onSecondaryClick={onIdleLocationClose}
      />

      <Modal
        isOpen={showRemarksModal}
        onClose={onRemarksClose}
        type="form"
        mode="dialog"
        modalHeight="400px"
        title={`Remarks - ${selectedEquipmentForAction?.regNo || ''}`}
        message="Add or update remarks for this equipment"
        formFields={[
          { name: 'remarks', label: 'Remarks', type: 'textarea', placeholder: 'Enter remarks...' },
        ]}
        formValues={remarksForm}
        onFormChange={onRemarksFormChange}
        buttonText="Save"
        onButtonClick={onRemarksSubmit}
        secondaryButtonText="Cancel"
        onSecondaryClick={onRemarksClose}
      />
    </>
  );
}

export default EquipmentModals;