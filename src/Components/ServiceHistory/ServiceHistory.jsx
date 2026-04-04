// ─────────────────────────────────────────────────────────────────────────────
// ServiceHistory.jsx — Shell component. Composes hooks and sub-components.
// Contains NO business logic, NO fetch calls, NO inline handlers.
// ─────────────────────────────────────────────────────────────────────────────

import './ServiceHistory.css';
import React, { useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DevModal                   from '../../Common/DevModal/DevModal';
import Button                     from '../../Common/Button/Button';
import Loader                     from '../../Common/Loader/Loader';

// Hooks
import { useServiceData }     from './hooks/useServiceData';
import { useDocumentSigning } from './hooks/useDocumentSigning';

// Components
import ServiceTable from './components/ServiceTable';

// Exports
import { exportToExcel, exportToPDF, printServiceHistory } from './utils/serviceExport';

// ─────────────────────────────────────────────────────────────────────────────
// Shared button defaults for the controls bar
// ─────────────────────────────────────────────────────────────────────────────

const BAR_BTN = {
  variant:        'gradient',
  font:           'md',
  animation:      '',
  squircle:       '4xl',
  height:         '38px',
  type:           'submit',
  shadowPosition: 'to-bottom',
  shadowColor:    'white-600',
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const ServiceHistory = () => {
  const { regNos } = useParams();
  const navigate   = useNavigate();
  const tableRef   = useRef(null);

  const regNoArray = useMemo(() => {
    if (!regNos) { console.error('No regNos in URL!'); return []; }
    return regNos.split(',').map(r => r.trim()).filter(Boolean);
  }, [regNos]);

  const isMultipleEquipment = regNoArray.length > 1;

  // ── Hooks ──────────────────────────────────────────────────────────────────

  const data = useServiceData({ regNoArray, regNos, isMultipleEquipment });

  const signing = useDocumentSigning({
    onSigned: () => {
      if (signing.pendingAction === 'pdf')   handleExportToPDF();
      if (signing.pendingAction === 'print') handlePrint();
    },
  });

  // ── Export / Print Handlers ────────────────────────────────────────────────

  const exportContext = {
    groupedData:           data.groupedData,
    activeTab:             data.activeTab,
    isMultipleEquipment,
    multipleEquipmentData: data.multipleEquipmentData,
    equipmentData:         data.equipmentData,
    regNoArray,
    searchTerm:            data.searchTerm,
    filterState:           data.filterState,
    supervisorSignUrl:     signing.supervisorSignUrl,
  };

  const handleExportToExcel = () => exportToExcel(exportContext).catch(console.error);

  const handleExportToPDF = () => {
    if (!signing.isDocumentSigned) { signing.requireSignature('pdf');   return; }
    exportToPDF(exportContext).catch(console.error);
  };

  const handlePrint = () => {
    if (!signing.isDocumentSigned) { signing.requireSignature('print'); return; }
    printServiceHistory({ ...exportContext, tableRef, filteredData: data.filteredData });
  };

  // ── Navigation Handlers ────────────────────────────────────────────────────

  const addMutiServices = () => {
    navigate(`/batch-service-form/${regNoArray[0]}`);
  };

  // All history types now share a single unified form route.
  // activeTab values: 'oil' | 'normal' | 'tyre' | 'battery' | 'major'
  const handleAddService = () => {
    const type = data.activeTab || 'oil';
    navigate(`/service-history-form/${type}/${regNoArray[0]}`);
  };

  const handleViewAllDocuments = () => {
    const { dateFilter, customStartDate, customEndDate, lastMonthsCount } = data.filterState;
    const { formatDate } = require('./utils/serviceHelpers');

    let basePath;
    if (dateFilter === 'custom' && customStartDate && customEndDate) {
      basePath = `/all/date-range/all-histories/${regNoArray[0]}/${formatDate(customStartDate)}/${formatDate(customEndDate)}`;
    } else if (dateFilter === 'lastXmonths') {
      basePath = `/all/last-months/all-histories/${regNoArray[0]}/${lastMonthsCount}`;
    } else if (dateFilter === 'thismonth') {
      const today    = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay  = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      basePath = `/all/date-range/all-histories/${regNoArray[0]}/${formatDate(firstDay)}/${formatDate(lastDay)}`;
    } else {
      basePath = `/all/all-histories/${regNoArray[0]}`;
    }

    navigate(basePath, { state: { serviceTypes: data.filters.serviceTypes } });
  };

  // ── View All Label ─────────────────────────────────────────────────────────

  const viewAllLabel = (() => {
    const { dateFilter, lastMonthsCount, customStartDate, customEndDate } = data.filterState;
    if (dateFilter === 'custom' && customStartDate && customEndDate) return 'View Date Range Data';
    if (dateFilter === 'lastXmonths') return `View Last ${lastMonthsCount} Months Data`;
    if (dateFilter === 'thismonth') return 'View This Month Data';
    return 'View All Documents';
  })();

  // ── Add Service Label ──────────────────────────────────────────────────────
  // 'major' replaces old 'maintenance' key

  const addServiceLabel = {
    oil:     'Add Oil Service',
    normal:  'Add Normal Service',
    major:   'Add Major Work',
    tyre:    'Add Tyre Service',
    battery: 'Add Battery Service',
  }[data.activeTab] || 'Add Service';

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="service-history-container-cnt">

      {/* ── Controls Bar ── */}
      <div className="controls-bar">
        <div className="action-buttons left">
          <Button {...BAR_BTN} text="Filters"      onClick={() => data.setShowFiltersModal(true)} colorScheme="violet-800"    width="160px"      textColor="white-200" />
          <Button {...BAR_BTN} text={viewAllLabel} onClick={handleViewAllDocuments}               colorScheme="lime-800"      width="fit-content" textColor="white-200" />
        </div>
        <div className="action-buttons right">
          <Button {...BAR_BTN} text="Multiple Records"  onClick={addMutiServices}      colorScheme="info-800"     width="160px" textColor="white-200" />
          <Button {...BAR_BTN} text={addServiceLabel}   onClick={handleAddService}      colorScheme="info-800"     width="160px" textColor="white-200" />
          <Button {...BAR_BTN} text="Export to Excel"   onClick={handleExportToExcel}  colorScheme="primary-800"  width="160px" textColor="white-200" />
          <Button {...BAR_BTN} text="Print"             onClick={handlePrint}           colorScheme="success-800"  width="160px" textColor="white-200" />
          <Button {...BAR_BTN} text="Export to PDF"     onClick={handleExportToPDF}    colorScheme="fuchsia-800"  width="160px" textColor="white-200" />
        </div>
      </div>

      {/* ── Main Content ── */}
      {data.loading ? (
        <div className="loading"><Loader /></div>
      ) : data.error ? (
        <div className="error-message">{data.error}</div>
      ) : (
        <ServiceTable
          groupedData={data.groupedData}
          activeTab={data.activeTab}
          isMultipleEquipment={isMultipleEquipment}
          multipleEquipmentData={data.multipleEquipmentData}
          regNoArray={regNoArray}
          expandedRemarks={data.expandedRemarks}
          onToggleRemark={data.toggleRemarkExpansion}
          onDeleteReport={data.handleDeleteReport}
          tableRef={tableRef}
        />
      )}

      {/* ── Modals ── */}

      {/* Delete Confirmation */}
      <DevModal
        isOpen={data.showDeleteModal}
        onClose={() => data.setShowDeleteModal(false)}
        type="error"
        title="Delete Report?"
        message="Are you sure you want to delete this report? This action cannot be undone."
        buttonText="Delete"
        secondaryButtonText="Cancel"
        onButtonClick={data.confirmDeleteReport}
        onSecondaryClick={() => data.setShowDeleteModal(false)}
      />

      {/* Filters */}
      <DevModal
        isOpen={data.showFiltersModal}
        onClose={() => data.setShowFiltersModal(false)}
        type="form"
        title="Service History Filters"
        message="Customize your view with advanced filtering options"
        formFields={[
          { name: 'dateFilter', label: 'Date Range', type: 'select', options: [
            { value: 'all',         label: 'All Time'      },
            { value: 'thismonth',   label: 'This Month'    },
            { value: 'lastXmonths', label: 'Last X Months' },
            { value: 'custom',      label: 'Custom Range'  },
          ]},
          ...(data.filters.dateFilter === 'lastXmonths' ? [{
            name: 'lastMonthsCount', label: 'Number of Months', type: 'select',
            options: Array.from({ length: 12 }, (_, i) => i + 1).map(n => ({ value: n, label: `${n} Month${n > 1 ? 's' : ''}` })),
          }] : []),
          ...(data.filters.dateFilter === 'custom' ? [
            { name: 'customStartDate', label: 'Start Date', type: 'date' },
            { name: 'customEndDate',   label: 'End Date',   type: 'date' },
          ] : []),
          // serviceTypes filter reflects new type names — 'major' not 'maintenance'
          { name: 'serviceTypes',    label: 'Service Types (comma-separated)', type: 'text', placeholder: 'oil, normal, major, tyre, battery' },
          { name: 'serviceHoursMin', label: 'Min Service Hours',               type: 'number', placeholder: 'Minimum hours' },
          { name: 'serviceHoursMax', label: 'Max Service Hours',               type: 'number', placeholder: 'Maximum hours' },
          { name: 'hasRemarks', label: 'Has Remarks', type: 'select', options: [
            { value: '',    label: 'All' },
            { value: 'yes', label: 'Yes' },
            { value: 'no',  label: 'No'  },
          ]},
        ]}
        formValues={{
          dateFilter:      data.filters.dateFilter,
          lastMonthsCount: data.filters.lastMonthsCount,
          customStartDate: data.filters.customStartDate,
          customEndDate:   data.filters.customEndDate,
          serviceTypes:    data.filters.serviceTypes.join(', '),
          serviceHoursMin: data.filters.serviceHoursRange.min,
          serviceHoursMax: data.filters.serviceHoursRange.max,
          hasRemarks:      data.filters.hasRemarks,
        }}
        onFormChange={(name, value) => {
          if (name === 'serviceTypes') {
            data.handleFilterChange('serviceTypes', value.split(',').map(t => t.trim()).filter(Boolean));
          } else if (name === 'serviceHoursMin' || name === 'serviceHoursMax') {
            data.handleFilterChange('serviceHoursRange', {
              ...data.filters.serviceHoursRange,
              [name === 'serviceHoursMin' ? 'min' : 'max']: value,
            });
          } else {
            data.handleFilterChange(name, value);
          }
        }}
        buttonText="Apply Filters"
        secondaryButtonText="Reset"
        onButtonClick={data.handleApplyFilters}
        onSecondaryClick={data.handleResetFilters}
      />

      {/* 6-Digit Password (Step 1) */}
      <DevModal
        isOpen={signing.showPasswordModal}
        onClose={() => { signing.setShowPasswordModal(false); signing.setSixDigitPassword(''); }}
        type="authentication"
        title="Document Signature Authentication"
        message="Step 1: Enter your 6-digit password"
        showInput={true}
        inputValue={signing.sixDigitPassword}
        onInputChange={(v) => signing.setSixDigitPassword(v.replace(/\D/g, ''))}
        inputPlaceholder="Enter 6-digit password"
        inputMaxLength={6}
        inputError={signing.signError}
        buttonText={signing.signLoading ? 'Verifying...' : 'Verify & Send OTP'}
        onButtonClick={signing.handleSixDigitVerification}
        preventClose={signing.signLoading}
      />

      {/* OTP (Step 2) */}
      <DevModal
        isOpen={signing.showOtpModal}
        onClose={() => { signing.setShowOtpModal(false); signing.setOtpCode(''); }}
        type="otp"
        title="Enter OTP Code"
        message="OTP has been sent to the authorized email"
        showInput={true}
        inputValue={signing.otpCode}
        onInputChange={(v) => signing.setOtpCode(v.replace(/\D/g, ''))}
        inputPlaceholder="Enter 6-digit OTP"
        inputMaxLength={6}
        inputError={signing.signError}
        buttonText={signing.signLoading ? 'Signing...' : 'Sign Document'}
        secondaryButtonText="Back"
        onSecondaryClick={() => { signing.setShowOtpModal(false); signing.setShowPasswordModal(true); }}
        onButtonClick={signing.handleOtpVerification}
        preventClose={signing.signLoading}
      />

      {/* Sign Warning */}
      <DevModal
        isOpen={signing.showWarningModal}
        onClose={() => { signing.setShowWarningModal(false); signing.setPendingAction(null); }}
        type="warning"
        title="Document Not Signed"
        message="You must sign the document before printing/exporting. This ensures document authenticity."
        buttonText="Sign Document Now"
        secondaryButtonText="Cancel"
        onButtonClick={() => { signing.setShowWarningModal(false); signing.openPasswordModal(); }}
        onSecondaryClick={() => { signing.setShowWarningModal(false); signing.setPendingAction(null); }}
      />

      {/* Sign Success */}
      <DevModal
        isOpen={signing.showSuccessModal}
        onClose={() => { signing.setShowSuccessModal(false); signing.setPendingAction(null); }}
        type="success"
        title="Document Signed Successfully!"
        message={`Your document has been digitally signed. Signature valid for 10 seconds. You can now ${signing.pendingAction === 'pdf' ? 'export to PDF' : 'print'} the document.`}
        buttonText={signing.pendingAction === 'pdf' ? 'Export to PDF Now' : 'Print Now'}
        secondaryButtonText="Close"
        onButtonClick={() => {
          signing.setShowSuccessModal(false);
          signing.pendingAction === 'pdf' ? handleExportToPDF() : handlePrint();
          signing.setPendingAction(null);
        }}
        onSecondaryClick={() => { signing.setShowSuccessModal(false); signing.setPendingAction(null); }}
      />

      {/* Loading Progress */}
      <DevModal
        isOpen={signing.showLoadingModal}
        onClose={() => {}}
        type="progress"
        title="Processing..."
        message={signing.loadingMessage}
        progress={100}
        preventClose={true}
      />

    </div>
  );
};

export default ServiceHistory;