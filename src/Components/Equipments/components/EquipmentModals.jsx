// ─────────────────────────────────────────────────────────────────────────────
// EquipmentModals.jsx — All DevModal instances for the Equipments page.
// Grouped here so Equipments.jsx (the shell) stays clean.
// Each modal is clearly labelled and receives only the props it needs.
// ─────────────────────────────────────────────────────────────────────────────

import DevModal from '../../../Common/DevModal/DevModal';

// ─────────────────────────────────────────────────────────────────────────────
// Static field config — defined outside the component so they're not
// recreated on every render.
// ─────────────────────────────────────────────────────────────────────────────

const COMPANY_OPTIONS = [
  { value: 'ATE',   label: 'ATE'   },
  { value: 'ASK',   label: 'ASK'   },
  { value: 'HIRED', label: 'HIRED' },
];

const STATUS_OPTIONS_ADD = [
  { value: 'Active',      label: 'Active'      },
  { value: 'Inactive',    label: 'Inactive'    },
  { value: 'Maintenance', label: 'Maintenance' },
];

const STATUS_OPTIONS_EDIT = [
  { value: 'active',      label: 'Active'      },
  { value: 'idle',        label: 'Idle'        },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'going',       label: 'Going'       },
  { value: 'loading',     label: 'Loading'     },
  { value: 'leased',      label: 'Leased'      },
];

const EXPORT_COLUMN_OPTIONS = [
  { value: 'machine',         label: 'Machine'          },
  { value: 'regNo',           label: 'Registration No'  },
  { value: 'brand',           label: 'Brand'            },
  { value: 'year',            label: 'Year'             },
  { value: 'company',         label: 'Company'          },
  { value: 'operator',        label: 'Operator'         },
  { value: 'site',            label: 'Site'             },
  { value: 'status',          label: 'Status'           },
  { value: 'istimaraExpiry',  label: 'Istimara Expiry'  },
  { value: 'insuranceExpiry', label: 'Insurance Expiry' },
  { value: 'tpcExpiry',       label: 'TPC Expiry'       },
];

const DEFAULT_EXPORT_COLUMNS = {
  machine: true, regNo: true, brand: true, year: true,
  company: true, operator: true, site: true, status: true,
  istimaraExpiry: false, insuranceExpiry: false, tpcExpiry: false,
};

/**
 * Builds operator search-select field options from the operator list.
 * Extracted to avoid repetition across add/edit/mobilize/replace modals.
 */
const operatorOptions = (operatorList) =>
  operatorList.map(op => ({ label: op.name, value: op.name, id: op._id || op.id }));

const siteOptions = (sites) =>
  sites.map(s => ({ label: s, value: s }));

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

function EquipmentModals({
  // Shared data
  operator,
  sites,
  searchTerm,
  onSiteFocus,

  // Add Equipment
  showAddModal,
  addEquipmentForm,
  onAddFormChange,
  onAddSubmit,
  onAddClose,

  // Edit Equipment
  showEditModal,
  editFormData,
  onEditFormChange,
  onEditSubmit,
  onEditClose,

  // Delete Equipment
  showDeleteModal,
  equipmentToDelete,
  onDeleteConfirm,
  onDeleteClose,

  // Status (success / error feedback)
  showStatusModal,
  deleteStatus,
  onStatusClose,

  // Export
  showExportModal,
  exportColumns,
  onExportColumnChange,
  onExportConfirm,
  onExportReset,
  onExportClose,

  // Fuel Progress
  showFuelProgressModal,
  fuelProgress,

  // Equipment Loading Progress
  isLoadingEquipments,
  equipmentProgress,

  // No Results
  showNoResultsModal,
  outsideEquipmentForm,
  onNoResultsClose,
  onAddAsOutside,

  // Mobilize
  showMobilizeModal,
  mobilizeForm,
  selectedEquipmentForAction,
  onMobilizeFormChange,
  onMobilizeSubmit,
  onMobilizeClose,

  // Demobilize
  showDemobilizeModal,
  demobilizeDatePrompt,
  demobilizeForm,
  onDemobilizeFormChange,
  onDemobilizeAskDate,
  onDemobilizeSubmit,
  onDemobilizeClose,

  // Replace Operator
  showReplaceOperatorModal,
  replaceOperatorForm,
  onReplaceOperatorFormChange,
  onReplaceOperatorSubmit,
  onReplaceOperatorClose,

  // Replace Equipment
  showReplaceEquipmentModal,
  replaceEquipmentForm,
  replaceEquipmentResults,
  onReplaceEquipmentFormChange,
  onReplaceEquipmentSubmit,
  onReplaceEquipmentClose,
}) {
  return (
    <>
      {/* ── Add Equipment ── */}
      <DevModal
        isOpen={showAddModal}
        onClose={onAddClose}
        type="form"
        title="Add New Equipment"
        message="Fill in the details to add new equipment"
        formFields={[
          { name: 'machine',         label: 'Machine',          type: 'text',   placeholder: 'Enter machine name',  required: true },
          { name: 'regNo',           label: 'Registration No',  type: 'text',   placeholder: 'Enter reg number',    required: true },
          { name: 'coc',             label: 'COC',              type: 'text',   placeholder: 'Enter COC'            },
          { name: 'brand',           label: 'Brand',            type: 'text',   placeholder: 'Enter brand',         required: true },
          { name: 'year',            label: 'Year',             type: 'number', placeholder: 'Enter year',          required: true },
          { name: 'company',         label: 'Company',          type: 'select', required: true, options: COMPANY_OPTIONS },
          ...(addEquipmentForm.company === 'HIRED' ? [{
            name: 'hiredFrom', label: 'Hired From', type: 'text',
            placeholder: 'Enter company/organization name', required: true,
          }] : []),
          { name: 'istimaraExpiry',  label: 'Istimara Expiry',  type: 'date' },
          { name: 'insuranceExpiry', label: 'Insurance Expiry', type: 'date' },
          { name: 'tpcExpiry',       label: 'TPC Expiry',       type: 'date' },
          { name: 'status',          label: 'Status',           type: 'select', required: true, options: STATUS_OPTIONS_ADD },
          { name: 'operator',        label: 'Operator',         type: 'search-select', placeholder: 'Search operator...', required: true, options: operatorOptions(operator) },
          { name: 'site',            label: 'Site',             type: 'search-select', placeholder: 'Search or add site...', required: true, options: siteOptions(sites), onSearchFocus: onSiteFocus },
        ]}
        formValues={addEquipmentForm}
        onFormChange={onAddFormChange}
        buttonText="Add Equipment"
        onButtonClick={onAddSubmit}
        secondaryButtonText="Cancel"
        onSecondaryClick={onAddClose}
      />

      {/* ── Edit Equipment ── */}
      <DevModal
        isOpen={showEditModal}
        onClose={onEditClose}
        type="form"
        title="Update Equipment"
        message="Edit the equipment details below"
        formFields={[
          { name: 'machine', label: 'Machine',         type: 'text',   placeholder: 'Enter machine name', required: true },
          { name: 'regNo',   label: 'Registration No', type: 'text',   placeholder: 'Enter reg number',   required: true },
          { name: 'brand',   label: 'Brand',           type: 'text',   placeholder: 'Enter brand',        required: true },
          { name: 'year',    label: 'Year',            type: 'text',   placeholder: 'Enter year',         required: true },
          { name: 'company', label: 'Company',         type: 'select', required: true, options: COMPANY_OPTIONS },
          ...(editFormData.company === 'HIRED' ? [{
            name: 'hiredFrom', label: 'Hired From', type: 'text',
            placeholder: 'Enter company/organization name', required: true,
          }] : []),
          { name: 'operator', label: 'Operator', type: 'search-select', placeholder: 'Search operator...', required: true, options: operatorOptions(operator) },
          { name: 'site',     label: 'Site',     type: 'search-select', placeholder: 'Search or add site...', required: true, options: siteOptions(sites), onSearchFocus: onSiteFocus },
          { name: 'status',   label: 'Status',   type: 'select', required: true, options: STATUS_OPTIONS_EDIT },
        ]}
        formValues={editFormData}
        onFormChange={onEditFormChange}
        buttonText="Save Changes"
        onButtonClick={onEditSubmit}
        secondaryButtonText="Cancel"
        onSecondaryClick={onEditClose}
      />

      {/* ── Delete Confirmation ── */}
      <DevModal
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

      {/* ── Status (success / error feedback) ── */}
      <DevModal
        isOpen={showStatusModal}
        onClose={onStatusClose}
        type={deleteStatus.isError ? 'error' : 'success'}
        title={deleteStatus.isError ? 'Error' : 'Success'}
        message={deleteStatus.message}
        secondaryButtonText={deleteStatus.isError ? 'X' : 'Ok'}
        onSecondaryClick={onStatusClose}
      />

      {/* ── Export Column Selection ── */}
      <DevModal
        isOpen={showExportModal}
        onClose={onExportClose}
        type="filters"
        title="Select Columns to Export"
        message="Choose which columns to include in the Excel file"
        filterGroups={[{ name: 'columns', label: 'Available Columns', type: 'checkbox', options: EXPORT_COLUMN_OPTIONS }]}
        filterValues={{
          columns: Object.entries(exportColumns).filter(([, v]) => v).map(([k]) => k),
        }}
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

      {/* ── Fuel Loading Progress ── */}
      <DevModal
        isOpen={showFuelProgressModal}
        type="progress"
        title="Loading Fuel Data"
        message="Fetching fuel consumption data, please wait..."
        progress={fuelProgress}
        progressText="Processing..."
      />

      {/* ── Equipment Loading Progress ── */}
      <DevModal
        isOpen={isLoadingEquipments}
        type="progress"
        title="Loading Equipment Data"
        message="Fetching equipment information, please wait..."
        progress={equipmentProgress}
        progressText="Loading..."
      />

      {/* ── No Results / Add as Outside ── */}
      <DevModal
        isOpen={showNoResultsModal}
        onClose={onNoResultsClose}
        type="warning"
        title="No Equipment Found"
        message={`No matching records found for "${searchTerm}". Would you like to add this as a hired equipment?`}
        buttonText="Add as Outside Equipment"
        onButtonClick={onAddAsOutside}
        secondaryButtonText="Clear"
        onSecondaryClick={onNoResultsClose}
      />

      {/* ── Mobilize ── */}
      <DevModal
        isOpen={showMobilizeModal}
        onClose={onMobilizeClose}
        type="form"
        title={`Mobilize Equipment - ${selectedEquipmentForAction?.regNo || ''}`}
        message="Fill in the mobilization details"
        formFields={[
          { name: 'deployType',     label: 'Deploy To',            type: 'select',        required: true, options: [{ value: 'site', label: 'Site' }, { value: 'company', label: 'Client Company (Lease)' }] },
          { name: 'site',           label: 'Site',                 type: 'search-select', placeholder: 'Search or add site...',        required: mobilizeForm.deployType === 'site',    disabled: mobilizeForm.deployType === 'company',    options: siteOptions(sites), onSearchFocus: onSiteFocus },
          { name: 'clientCompany',  label: 'Client Company',       type: 'text',          placeholder: 'Enter client company name',    disabled: mobilizeForm.deployType === 'site' },
          { name: 'date',           label: 'Date (Optional)',      type: 'date' },
          { name: 'remarks',        label: 'Remarks (Optional)',   type: 'textarea',      placeholder: 'Add any additional notes' },
          { name: 'withOperator',   label: 'With Operator',        type: 'checkbox',      description: 'Check if equipment has an operator' },
          { name: 'operator',       label: 'Operator Name',        type: 'search-select', placeholder: 'Search operator...',           required: mobilizeForm.withOperator,             disabled: !mobilizeForm.withOperator,            options: operatorOptions(operator) },
        ]}
        formValues={mobilizeForm}
        onFormChange={onMobilizeFormChange}
        buttonText="Mobilize Equipment"
        onButtonClick={onMobilizeSubmit}
        secondaryButtonText="Cancel"
        onSecondaryClick={onMobilizeClose}
      />

      {/* ── Demobilize Step 1: Ask about date ── */}
      <DevModal
        isOpen={showDemobilizeModal && !demobilizeDatePrompt}
        onClose={onDemobilizeClose}
        type="warning"
        title={`Demobilize Equipment - ${selectedEquipmentForAction?.regNo || ''}`}
        message={`Are you sure you want to demobilize ${selectedEquipmentForAction?.machine || 'this equipment'}? Do you want to select a custom date?`}
        buttonText="Yes, Select Date"
        onButtonClick={onDemobilizeAskDate}
        secondaryButtonText="Demobilize"
        onSecondaryClick={onDemobilizeSubmit}
      />

      {/* ── Demobilize Step 2: Enter date ── */}
      <DevModal
        isOpen={showDemobilizeModal && demobilizeDatePrompt}
        onClose={onDemobilizeClose}
        type="form"
        title={`Demobilize Equipment - ${selectedEquipmentForAction?.regNo || ''}`}
        message="Select the demobilization date"
        formFields={[
          { name: 'date', label: 'Demobilization Date', type: 'date', required: true },
          { name: 'remarks', label: 'Remarks (Optional)', type: 'textarea', placeholder: 'Add any notes' },
        ]}
        formValues={demobilizeForm}
        onFormChange={onDemobilizeFormChange}
        buttonText="Demobilize"
        onButtonClick={onDemobilizeSubmit}
        secondaryButtonText="Cancel"
        onSecondaryClick={onDemobilizeClose}
      />

      {/* ── Replace Operator ── */}
      <DevModal
        isOpen={showReplaceOperatorModal}
        onClose={onReplaceOperatorClose}
        type="form"
        title={`Replace Operator - ${selectedEquipmentForAction?.regNo || ''}`}
        message="Enter the new operator details"
        formFields={[
          { name: 'currentOperator',  label: 'Current Operator',  type: 'text',          disabled: true },
          { name: 'replacedOperator', label: 'New Operator',       type: 'search-select', placeholder: 'Search operator...', required: true, options: operatorOptions(operator) },
          { name: 'date',             label: 'Date (Optional)',     type: 'date' },
          { name: 'remarks',          label: 'Remarks (Optional)',  type: 'textarea',      placeholder: 'Reason for replacement or notes' },
        ]}
        formValues={replaceOperatorForm}
        onFormChange={onReplaceOperatorFormChange}
        buttonText="Replace Operator"
        onButtonClick={onReplaceOperatorSubmit}
        secondaryButtonText="Cancel"
        onSecondaryClick={onReplaceOperatorClose}
      />

      {/* ── Replace Equipment ── */}
      <DevModal
        isOpen={showReplaceEquipmentModal}
        onClose={onReplaceEquipmentClose}
        type="form"
        title={`Replace Equipment - ${selectedEquipmentForAction?.regNo || ''}`}
        message={`Current equipment will be replaced. Current site: ${selectedEquipmentForAction?.site || 'N/A'}`}
        formFields={[
          { name: 'replacedEquipmentRegNo',   label: 'New Equipment Reg No',                    type: 'search-select', placeholder: 'Search equipment by reg no...', required: true, options: replaceEquipmentResults.map(eq => ({ label: `${eq.regNo} - ${eq.machine}`, value: eq.regNo })) },
          { name: 'replacedEquipmentMachine', label: 'New Equipment Machine',                    type: 'text',          placeholder: 'Auto-filled', disabled: true },
          { name: 'newSiteForReplaced',        label: 'New Site for Current Equipment (Optional)', type: 'search-select', placeholder: 'Search or add site...', options: siteOptions(sites), onSearchFocus: onSiteFocus },
          { name: 'date',                      label: 'Date (Optional)',                           type: 'date' },
          { name: 'remarks',                   label: 'Remarks (Optional)',                        type: 'textarea',      placeholder: 'Reason for replacement or notes' },
        ]}
        formValues={replaceEquipmentForm}
        onFormChange={onReplaceEquipmentFormChange}
        buttonText="Replace Equipment"
        onButtonClick={onReplaceEquipmentSubmit}
        secondaryButtonText="Cancel"
        onSecondaryClick={onReplaceEquipmentClose}
      />
    </>
  );
}

export default EquipmentModals;