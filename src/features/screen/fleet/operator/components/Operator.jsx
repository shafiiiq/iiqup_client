import React from 'react';
import './Operator.css';

import Tabs from '@/shared/components/widgets/tabs/Tabs';
import Table from '@/shared/components/widgets/table/Table';
import TableSkeleton from '@/shared/components/widgets/table/TableSkeleton';
import LoadMoreSkeleton from '@/shared/components/widgets/loader/skeleton/LoadMoreSkeleton';
import Controls from '@/shared/components/widgets/controls/Controls';
import Modal from '@/shared/components/widgets/modal/Modal';

import OperatorSidebar from './fragments/OperatorSidebar';
import { useOperator } from '../hooks/useOperator';
import { SHARED_BUTTON, OPERATOR_NAV_TREE, VERIFICATION_STATUS_LABELS, MOBILIZATION_STATUS_LABELS } from '../constants/operator.constant';

const FullScreenImageViewer = ({ src, onClose }) => {
  if (!src) return null;

  return (
    <div className="fullscreen-image-overlay" onClick={onClose}>
      <button className="fullscreen-close-btn" onClick={onClose}>×</button>
      <img
        src={src}
        alt="Full screen"
        className="fullscreen-image"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

const buildColumns = ({ handleSort, handleSelectOperator, handleDemobilizeClick, handleMobilizeClick, handleShowFullScreen, handleProfilePicError }) => [
  {
    key: 'profile',
    header: 'Profile',
    render: (row) => (
      <div
        className="profile-pic-small"
        onClick={() => handleShowFullScreen(row.picUrl)}
        style={{ cursor: row.picUrl ? 'pointer' : 'default' }}
      >
        {row.picUrl && <img src={row.picUrl} alt={row.operator.name} onError={handleProfilePicError} />}
        <div className="profile-initials" style={{ display: row.picUrl ? 'none' : 'flex' }}>{row.initials}</div>
      </div>
    ),
  },
  { key: 'name', header: 'Name', onHeaderClick: () => handleSort('name'), render: (row) => row.operator.name },
  { key: 'qatarId', header: 'Qatar ID', render: (row) => row.operator.qatarId },
  { key: 'uniqueCode', header: 'Unique Code', render: (row) => row.operator.uniqueCode },
  { key: 'nationality', header: 'Nationality', render: (row) => row.operator.nationality },
  { key: 'sponsorship', header: 'Sponsorship', render: (row) => row.operator.sponsorship },
  { key: 'equipmentNumber', header: 'Equipment No', render: (row) => row.operator.equipmentNumber || 'N/A' },
  {
    key: 'mobStatus',
    header: 'Mobilization',
    progress: true,
    headerCenter: true,
    dataCenter: true,
    render: (row) => MOBILIZATION_STATUS_LABELS[row.operator.status] ?? MOBILIZATION_STATUS_LABELS.demobilized,
  },
  {
    key: 'status',
    header: 'Status',
    progress: true,
    headerCenter: true,
    dataCenter: true,
    render: (row) => VERIFICATION_STATUS_LABELS[row.status],
  },
  {
    key: 'details',
    header: 'View More',
    actions: true,
    headerCenter: true,
    dataCenter: true,
    render: (row) => (
      <Controls
        justify="center"
        gap="6px"
        items={[
          { componentIconCenter: 'IconlyShow', componentIconSize: '25', iconColor: 'info-400', onClick: () => handleSelectOperator(row.operator), colorScheme: 'orange-800', textColor: 'white-200', ...SHARED_BUTTON },
        ]}
      />
    ),
  },
  {
    key: 'mob',
    header: 'Mob/Demob',
    actions: true,
    headerCenter: true,
    dataCenter: true,
    render: (row) => (
      <Controls
        justify="center"
        gap="6px"
        items={[
          row.operator.status === 'mobilized'
            ? { componentIconCenter: 'DepartureIcon', componentIconSize: '25', iconColor: 'error-500', onClick: () => handleDemobilizeClick(row.operator), colorScheme: 'yellow-700', textColor: 'white-200', ...SHARED_BUTTON }
            : { componentIconCenter: 'ApartureIcon', componentIconSize: '25', iconColor: 'success-500', onClick: () => handleMobilizeClick(row.operator), colorScheme: 'yellow-700', textColor: 'white-200', ...SHARED_BUTTON },
        ]}
      />
    ),
  },
];

const Operator = () => {
  const {
    loading,
    error,

    operatorsView,
    selectedOperatorView,
    fullScreenImage,
    activeTab,

    sidebarMinimized,
    sidebarMaximized,

    hasMoreOperators,
    isLoadingMoreOperators,

    formMode,
    formData,
    formOpen,
    uploading,
    operatorFormFields,

    showDeleteModal,
    deleteModalMessage,

    showMobilizeModal,
    mobilizeForm,
    mobilizeFormFields,
    isMobilizing,
    selectedOperatorForAction,

    showDemobilizeModal,
    demobilizeForm,
    demobilizeFormFields,
    isDemobilizing,

    handleTabSelect,
    handleSort,

    openAddForm,
    openEditForm,
    handleFormSubmit,
    handleCloseForm,
    handleFormFieldChange,
    handleProfilePicFileChange,

    handleDeleteClick,
    handleCloseDeleteModal,
    confirmDelete,

    handleSelectOperator,
    handleCloseOperatorDetails,
    handleSidebarMinimize,
    handleSidebarMaximize,

    handleShowFullScreen,
    handleCloseFullScreen,
    handleProfilePicError,

    handleMobilizeClick,
    closeMobilizeModal,
    onMobilizeFormChange,
    handleMobilizeSubmit,

    handleDemobilizeClick,
    closeDemobilizeModal,
    onDemobilizeFormChange,
    handleDemobilizeSubmit,

    formatDate,
    isExpired,
  } = useOperator();

  const columns = buildColumns({ handleSort, handleSelectOperator, handleDemobilizeClick, handleMobilizeClick, handleShowFullScreen, handleProfilePicError });
  const activePath = [activeTab];

  return (
    <div className="operators-container">
      <div className="operators-layout">
        <div className="operators-layout-sidebar">
          <Tabs title="View" items={OPERATOR_NAV_TREE} activePath={activePath} onSelect={handleTabSelect} />
        </div>

        <div className="operators-layout-content">
          <Controls
            justify="start"
            items={[{ ...SHARED_BUTTON, text: 'Add Operator', componentIconLeft: 'IconlyPlus', componentIconSize: '25', iconColor: 'white-200', onClick: openAddForm, colorScheme: 'success-800', textColor: 'white-200'}]}
          />

          {loading ? (
            <TableSkeleton columns={columns.length} rows={10} />
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              <Table
                columns={columns}
                data={operatorsView}
                emptyMessage="No operators found"
                rowKey={(row) => row.operator._id || row.operator.qatarId}
                onRowClick={(row) => handleSelectOperator(row.operator)}
              />

              {isLoadingMoreOperators && (
                <LoadMoreSkeleton
                  count={1}
                  renderItem={() => <TableSkeleton columns={columns.length} rows={5} />}
                />
              )}
            </>
          )}
        </div>
      </div>

      <OperatorSidebar
        show={!!selectedOperatorView}
        selectedOperatorView={selectedOperatorView}
        isMinimized={sidebarMinimized}
        isMaximized={sidebarMaximized}
        onClose={handleCloseOperatorDetails}
        onMinimize={handleSidebarMinimize}
        onMaximize={handleSidebarMaximize}
        onShowFullScreen={handleShowFullScreen}
        onProfilePicError={handleProfilePicError}
        onEditOperator={openEditForm}
        onMobilizeOperator={handleMobilizeClick}
        onDemobilizeOperator={handleDemobilizeClick}
        onDeleteOperator={handleDeleteClick}
        formatDate={formatDate}
        isExpired={isExpired}
      />

      <Modal
        isOpen={formOpen}
        onClose={handleCloseForm}
        type="form"
        title={formMode === 'add' ? 'Add New Operator' : 'Edit Operator'}
        buttonText={uploading ? 'Uploading...' : formMode === 'add' ? 'Add Operator' : 'Update Operator'}
        secondaryButtonText="Cancel"
        onSecondaryClick={handleCloseForm}
        onButtonClick={handleFormSubmit}
        formFields={operatorFormFields}
        formValues={formData}
        onFormChange={handleFormFieldChange}
        onFileChange={handleProfilePicFileChange}
      />

      <Modal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        type="error"
        title="Delete Operator?"
        message={deleteModalMessage}
        buttonText="Delete"
        secondaryButtonText="Cancel"
        onButtonClick={confirmDelete}
        onSecondaryClick={handleCloseDeleteModal}
      />

      <Modal
        isOpen={showMobilizeModal}
        onClose={closeMobilizeModal}
        type='form'
        mode="sheet"
        modalWidth="98%"
        title={`Mobilize Operator - ${selectedOperatorForAction?.name || ''}`}
        message="Fill in the mobilization details"
        formFields={mobilizeFormFields}
        formValues={mobilizeForm}
        onFormChange={onMobilizeFormChange}
        buttonText={isMobilizing ? 'Mobilizing...' : 'Mobilize Operator'}
        onButtonClick={handleMobilizeSubmit}
        secondaryButtonText="Cancel"
        onSecondaryClick={closeMobilizeModal}
      />

      <Modal
        isOpen={showDemobilizeModal}
        onClose={closeDemobilizeModal}
        type="form"
        title={`Demobilize Operator - ${selectedOperatorForAction?.name || ''}`}
        message="Confirm demobilization details"
        formFields={demobilizeFormFields}
        formValues={demobilizeForm}
        onFormChange={onDemobilizeFormChange}
        buttonText={isDemobilizing ? 'Demobilizing...' : 'Demobilize Operator'}
        onButtonClick={handleDemobilizeSubmit}
        secondaryButtonText="Cancel"
        onSecondaryClick={closeDemobilizeModal}
      />

      <FullScreenImageViewer src={fullScreenImage} onClose={handleCloseFullScreen} />
    </div>
  );
};

export default Operator;