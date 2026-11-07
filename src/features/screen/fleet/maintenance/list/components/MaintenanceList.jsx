import React from 'react';
import { useParams } from 'react-router-dom';
import Modal from '@/shared/components/widgets/modal/Modal';
import Controls from '@/shared/components/widgets/controls/Controls';
import Loader from '@/shared/components/widgets/loader/spinner/Spinner';
import Tabs from '@/shared/components/widgets/tabs/Tabs';

import ListFilters from './fragments/ListFilters';
import ListTable from './fragments/ListTable';
import ListSigningModals from './fragments/ListSigningModals';
import { getDateRangeLabel } from '../helper/maintenance.list.helper';
import { useMaintenanceList } from '../hooks/useMaintenanceList';
import { BUTTON_PROPS } from '../constants/maintenance.list.constant';
import { buildMaintenanceListNavTree } from '../constants/maintenance.list.nav.tree.constant';

import './MaintenanceList.css';

const parseRegistrationNumbersParam = (regNosParam) =>
  regNosParam ? regNosParam.split(',').map((value) => value.trim()).filter(Boolean) : [];

const MaintenanceList = () => {
  const { regNos } = useParams();
  const registrationNumbers = React.useMemo(() => parseRegistrationNumbersParam(regNos), [regNos]);

  const list = useMaintenanceList({ registrationNumbers });
  const { signing } = list;

  const navTree = buildMaintenanceListNavTree(list.tabCounts, {
    activeTab: list.activeTab,
    loadedCount: list.filteredItems.length,
  });

  return (
    <div className="fleet maintenance list page">
      <div className="fleet maintenance list layout">
        <div className="fleet maintenance list layout-sidebar">
          <Tabs
            title="Service Type"
            items={navTree}
            activePath={[list.activeTab]}
            onSelect={([tabKey]) => list.setActiveTab(tabKey)}
            maxHeight="1090px"
            controlsColumns={2}
            filterToggleLabel={`Filters · ${getDateRangeLabel(list.appliedFilters)}`}
            filters={
              <ListFilters
                fields={list.filterFormFields}
                values={list.draftFilters}
                onChange={list.handleFilterFormChange}
                onApply={list.handleApplyFilters}
                onReset={list.handleResetFilters}
              />
            }
            controls={[
              { ...BUTTON_PROPS, text: 'Excel', onClick: list.handleExportToExcel, colorScheme: 'black-200', textColor: 'white-100', componentIconLeft: 'ExcelIcon', componentIconSize: '30', iconColor: 'white-200' },
              { ...BUTTON_PROPS, text: 'PDF', onClick: list.handleExportToPdf, colorScheme: 'black-200', textColor: 'white-100', componentIconLeft: 'PdfIcon', componentIconSize: '30', iconColor: 'white-200' },
              { ...BUTTON_PROPS, text: 'PDFs', onClick: list.handleExportToSeparatePdfs, colorScheme: 'black-200', textColor: 'white-100', componentIconLeft: 'LayeredPanelIcon', componentIconSize: '30', iconColor: 'white-200' },
              { ...BUTTON_PROPS, text: 'Print', onClick: list.handlePrint, colorScheme: 'black-200', textColor: 'white-200', componentIconLeft: 'PrinterIcon', componentIconSize: '30', iconColor: 'white-200' },
              ...(signing.flow.isActivationAvailable
                ? [{ ...BUTTON_PROPS, text: 'Activate E-Signs', onClick: signing.flow.openActivationModal, colorScheme: 'error-800' }]
                : []),
              ...(signing.flow.canRequestFamilyAccess
                ? [{ ...BUTTON_PROPS, text: 'Request Family Access', onClick: signing.flow.requestFamilyAccess, colorScheme: 'info-800' }]
                : []),
            ]}
          />
        </div>

        <div className="fleet maintenance list layout-content">
          <Controls
            justify="space-between"
            margin="0 0 30px 0"
            rows={1}
            columns={3}
            buttons={[
              { ...BUTTON_PROPS, text: 'Add Service', componentIconLeft: 'IconlyPlus', componentIconSize: '25', iconColor: 'white-200', onClick: list.navigateToAddMaintenance, colorScheme: 'success-800' },
              { ...BUTTON_PROPS, text: 'Add Multiple Records', componentIconLeft: 'CreateMutipleFilesIcon', componentIconSize: '25', iconColor: 'white-200', onClick: list.navigateToAddMultipleMaintenance, colorScheme: 'success-800' },
              { ...BUTTON_PROPS, text: 'View All Documents', componentIconLeft: 'MutipleFilesIcon', componentIconSize: '25', iconColor: 'white-200', onClick: list.navigateToAllDocuments, colorScheme: 'info-800', width: 'fit-content' },
            ]}
          />

          {list.loading ? (
            <div className="fleet maintenance list loading state">
              <Loader />
            </div>
          ) : list.error ? (
            <div className="fleet maintenance list error message">{list.error}</div>
          ) : (
            <>
              <ListTable
                groupedData={list.groupedData}
                activeTab={list.activeTab}
                expandedRemarks={list.expandedRemarks}
                onToggleRemark={list.handleToggleRemarkExpansion}
                onDeleteMaintenance={list.handleShowDeleteConfirmation}
                tableRef={list.tableRef}
              />

              {list.isLoadingMore && (
                <div className="fleet maintenance list loading more state">
                  <Loader />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={list.showDeleteModal}
        onClose={list.handleCloseDeleteModal}
        type="error"
        title="Delete Record?"
        message="Are you sure you want to delete this record? This action cannot be undone."
        buttonText="Delete"
        secondaryButtonText="Cancel"
        onButtonClick={list.handleConfirmDeleteMaintenance}
        onSecondaryClick={list.handleCloseDeleteModal}
      />

      <ListSigningModals signing={signing} />
    </div>
  );
};

export default MaintenanceList;