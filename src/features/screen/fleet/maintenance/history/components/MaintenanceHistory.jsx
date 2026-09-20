import './MaintenanceHistory.css';
import React from 'react';
import { useParams } from 'react-router-dom';
import Modal from '@/shared/components/widgets/modal/Modal';
import Controls from '@/shared/components/widgets/controls/Controls';
import Loader from '@/shared/components/widgets/loader/spinner/Spinner';
import Tabs from '@/shared/components/widgets/tabs/Tabs';
import MaintenanceHistoryFilters from './fragments/MaintenanceHistoryFilters';
import { getDateRangeLabel } from '../helper/maintenance.history.helper';

import HistoryTable from './fragments/HistoryTable';

import { useMaintenanceHistory } from '../hooks/useMaintenanceHistory';
import { BUTTON_PROPS } from '../constants/maintenance.history.constant';
import { buildMaintenanceHistoryNavTree } from '../constants/maintenance.history.nav.tree.constant';

const parseRegistrationNumbersParam = (regNosParam) =>
  regNosParam ? regNosParam.split(',').map((value) => value.trim()).filter(Boolean) : [];

const MaintenanceHistory = () => {
  const { regNos } = useParams();
  const registrationNumbers = React.useMemo(() => parseRegistrationNumbersParam(regNos), [regNos]);

  const maintenanceHistory = useMaintenanceHistory({
    registrationNumbers,
    isMultipleEquipment: registrationNumbers.length > 1,
  });

  const { signing } = maintenanceHistory;

  const navTree = buildMaintenanceHistoryNavTree(maintenanceHistory.tabCounts, {
    activeTab: maintenanceHistory.activeTab,
    loadedCount: maintenanceHistory.filteredItems.length,
  });

  return (
    <div className="equipment maintenance history page">

      <div className="equipment maintenance history layout">
        <div className="equipment maintenance history layout-sidebar">
          <Tabs
            title="Service Type"
            items={navTree}
            activePath={[maintenanceHistory.activeTab]}
            onSelect={([tabKey]) => maintenanceHistory.setActiveTab(tabKey)}
            maxHeight="1090px"
            controlsColumns={2}
            filterToggleLabel={`Filters · ${getDateRangeLabel(maintenanceHistory.appliedFilters)}`}
            filters={
              <MaintenanceHistoryFilters
                fields={maintenanceHistory.filterFormFields}
                values={maintenanceHistory.draftFilters}
                onChange={maintenanceHistory.handleFilterFormChange}
                onApply={maintenanceHistory.handleApplyFilters}
                onReset={maintenanceHistory.handleResetFilters}
              />
            }
            controls={[
              { ...BUTTON_PROPS, text: 'Excel', onClick: maintenanceHistory.handleExportToExcel, colorScheme: 'black-200', textColor: 'white-100', componentIconLeft: 'ExcelIcon', componentIconSize: '30', iconColor: 'white-200' },
              { ...BUTTON_PROPS, text: 'PDF', onClick: maintenanceHistory.handleExportToPdf, colorScheme: 'black-200', textColor: 'white-100', componentIconLeft: 'PdfIcon', componentIconSize: '30', iconColor: 'white-200' },
              { ...BUTTON_PROPS, text: 'PDFs', onClick: maintenanceHistory.handleExportToSeparatePdfs, colorScheme: 'black-200', textColor: 'white-100', componentIconLeft: 'LayeredPanelIcon', componentIconSize: '30', iconColor: 'white-200' },
              { ...BUTTON_PROPS, text: 'Print', onClick: maintenanceHistory.handlePrint, colorScheme: 'black-200', textColor: 'white-200', componentIconLeft: 'PrinterIcon', componentIconSize: '30', iconColor: 'white-200', },
            ]}
          />
        </div>

        <div className="equipment maintenance history layout-content">
          <Controls
            justify="space-between"
            margin="0 0 30px 0"
            rows={1}
            columns={3}
            buttons={[
              { ...BUTTON_PROPS, text: 'Add Service', componentIconLeft: 'IconlyPlus', componentIconSize: '25', iconColor: 'white-200', onClick: maintenanceHistory.navigateToAddSingleServiceRecord, colorScheme: 'success-800' },
              { ...BUTTON_PROPS, text: 'Add Multiple Records', componentIconLeft: 'CreateMutipleFilesIcon', componentIconSize: '25', iconColor: 'white-200', onClick: maintenanceHistory.navigateToAddMultipleServiceRecords, colorScheme: 'success-800' },
              { ...BUTTON_PROPS, text: 'View All Documents', componentIconLeft: 'MutipleFilesIcon', componentIconSize: '25', iconColor: 'white-200', onClick: maintenanceHistory.navigateToAllServiceDocuments, colorScheme: 'info-800', width: 'fit-content' },
            ]}
          />

          {maintenanceHistory.loading ? (
            <div className="equipment maintenance history loading state">
              <Loader />
            </div>
          ) : maintenanceHistory.error ? (
            <div className="equipment maintenance history error message">{maintenanceHistory.error}</div>
          ) : (
            <>
              <HistoryTable
                groupedData={maintenanceHistory.groupedData}
                activeTab={maintenanceHistory.activeTab}
                isMultipleEquipment={maintenanceHistory.isMultipleEquipment}
                multipleEquipmentData={maintenanceHistory.multipleEquipmentData}
                registrationNumbers={maintenanceHistory.registrationNumbers}
                expandedRemarks={maintenanceHistory.expandedRemarks}
                onToggleRemark={maintenanceHistory.handleToggleRemarkExpansion}
                onDeleteReport={maintenanceHistory.handleShowDeleteConfirmation}
                tableRef={maintenanceHistory.tableRef}
              />

              {maintenanceHistory.isLoadingMore && (
                <div className="equipment maintenance history loading more state">
                  <Loader />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={maintenanceHistory.showDeleteModal}
        onClose={maintenanceHistory.handleCloseDeleteModal}
        type="error"
        title="Delete Report?"
        message="Are you sure you want to delete this report? This action cannot be undone."
        buttonText="Delete"
        secondaryButtonText="Cancel"
        onButtonClick={maintenanceHistory.handleConfirmDeleteReport}
        onSecondaryClick={maintenanceHistory.handleCloseDeleteModal}
      />

      <Modal
        isOpen={signing.showPasswordModal}
        onClose={() => signing.setShowPasswordModal(false)}
        type="authentication"
        mode="dialog"
        title="Document Signature Authentication"
        message="Step 1: Enter your 6-digit password"
        showInput
        inputValue={signing.sixDigitPassword}
        onInputChange={signing.setSixDigitPassword}
        inputPlaceholder="Enter 6-digit password"
        inputMaxLength={6}
        inputError={signing.signError}
        buttonText={signing.signLoading ? 'Verifying...' : 'Verify & Send OTP'}
        onButtonClick={signing.handleSixDigitVerification}
        preventClose={signing.signLoading}
      />

      <Modal
        isOpen={signing.showOtpModal}
        onClose={() => signing.setShowOtpModal(false)}
        type="otp"
        mode="dialog"
        title="Enter OTP Code"
        message="OTP has been sent to the authorized email"
        showInput
        inputValue={signing.otpCode}
        onInputChange={signing.setOtpCode}
        inputPlaceholder="Enter 6-digit OTP"
        inputMaxLength={6}
        inputError={signing.signError}
        buttonText={signing.signLoading ? 'Signing...' : 'Sign Document'}
        secondaryButtonText="Back"
        onSecondaryClick={() => signing.setShowOtpModal(false)}
        onButtonClick={signing.handleOtpVerification}
        preventClose={signing.signLoading}
      />

      <Modal
        isOpen={signing.showWarningModal}
        onClose={() => signing.setShowWarningModal(false)}
        type="warning"
        title="Document Not Signed"
        message="You can sign the document, or print without a signature and sign it by hand."
        buttonText="Sign Document"
        secondaryButtonText="Continue Without Signature"
        onButtonClick={() => { signing.setShowWarningModal(false); signing.openPasswordModal(); }}
        onSecondaryClick={() => { signing.setShowWarningModal(false); signing.runPendingActionWithoutSignature(); }}
      />

      <Modal
        isOpen={signing.showSuccessModal}
        onClose={() => signing.setShowSuccessModal(false)}
        type="success"
        title="Document Signed Successfully!"
        message="The document was signed successfully."
        buttonText="Close"
        onButtonClick={() => signing.setShowSuccessModal(false)}
        onSecondaryClick={() => signing.setShowSuccessModal(false)}
      />

      <Modal
        isOpen={signing.showLoadingModal}
        onClose={undefined}
        type="progress"
        mode="dialog"
        title="Processing..."
        message={signing.loadingMessage || 'Processing...'}
        progress={100}
        preventClose
      />

    </div>
  );
};

export default MaintenanceHistory;