import './Equipments.css';

import { useEquipmentPage } from '../hooks/useEquipmentPage';
import { useEquipmentGridVirtualization } from '../hooks/useEquipmentGridVirtualization';

import LoadMoreSkeleton from '@/shared/components/widgets/loader/skeleton/LoadMoreSkeleton';
import Tabs from '@/shared/components/widgets/tabs/Tabs';

import CompletedWorkAlert from './fragments/CompletedWorkAlert';
import EquipmentControls from './fragments/EquipmentControls';
import EquipmentCard from './fragments/EquipmentCard';
import EquipmentCardSkeleton from './fragments/EquipmentCardSkeleton';
import SiteCard from './fragments/SiteCard';
import EquipmentSkeletonGrid from './fragments/EquipmentSkeletonGrid';
import EquipmentSidebar from './fragments/EquipmentSidebar';
import FullscreenViewer from './fragments/FullscreenViewer';
import EquipmentModals from './fragments/EquipmentModals';
import EquipmentRecords from './fragments/EquipmentRecords';
import IdleRoster from './fragments/IdleRoster';
import EquipmentTable, { EQUIPMENT_TABLE_COLUMN_COUNT } from './fragments/EquipmentTable';
import Button from '@/shared/components/widgets/button/Button';
import TableSkeleton from '@/shared/components/widgets/table/TableSkeleton';

import { BUTTON_PROPS, EQUIPMENT_TABS, EQUIPMENT_ALL_SITES_FILTER } from '../constants/equipment.constant';
import { buildEquipmentNavTree } from '../constants/equipment.nav.tree.constant';
import NothingToSeeHere from '@/shared/components/widgets/nothing/NothingToSeeHere';
import { useEquipmentTableScroll } from '../hooks/useEquipmentTableScroll';
import SiteMachineBreakdown from './fragments/SiteMachineBreakdown';
import { useEquipmentRecordsComparison } from '../hooks/useEquipmentRecordsComparison';
import { useState } from 'react';

function Equipments() {
  const { searchTerm, equipment, actions, isEquipmentGridTab } = useEquipmentPage();
  const comparison = useEquipmentRecordsComparison();
  const [isDragOverSidebar, setIsDragOverSidebar] = useState(false);
  const [viewMode, setViewMode] = useState('card');

  const handleEquipmentDragStart = (e, item) => {
    const isDraggingSelection = actions.isSelectMode
      && actions.selectedEquipment.includes(item.regNo)
      && actions.selectedEquipment.length > 1;

    const regNosToCompare = isDraggingSelection ? actions.selectedEquipment : [item.regNo];
    e.dataTransfer.setData('text/plain', regNosToCompare.join(','));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleSidebarDragOver = (e) => {
    e.preventDefault();
    setIsDragOverSidebar(true);
  };

  const handleSidebarDragLeave = () => setIsDragOverSidebar(false);

  const handleSidebarDrop = (e) => {
    e.preventDefault();
    setIsDragOverSidebar(false);
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    raw.split(',').map((regNo) => regNo.trim()).filter(Boolean).forEach(comparison.addComparedEquipment);
    equipment.changeTab(EQUIPMENT_TABS.RECORDS);
  };

  const gridVirtualization = useEquipmentGridVirtualization({
    items: equipment.equipmentList,
    activeTab: equipment.activeTab,
    currentPage: equipment.currentPage,
    hasMore: equipment.hasMoreEquipmentPages,
    isLoadingMore: equipment.isLoadingMoreEquipment,
    isLoading: equipment.isLoadingEquipmentList,
    fetchEquipmentList: equipment.fetchEquipmentList,
    enabled: isEquipmentGridTab && viewMode === 'card',
  });

  const tableInfiniteScroll = useEquipmentTableScroll({
    items: equipment.equipmentList,
    currentPage: equipment.currentPage,
    hasMore: equipment.hasMoreEquipmentPages,
    isLoadingMore: equipment.isLoadingMoreEquipment,
    isLoading: equipment.isLoadingEquipmentList,
    fetchEquipmentList: equipment.fetchEquipmentList,
    enabled: isEquipmentGridTab && viewMode === 'table',
  });

  const navTree = buildEquipmentNavTree(equipment.tabCounts, {
    activeTab: equipment.activeTab,
    statusFilter: equipment.statusFilter,
    loadedCount: equipment.equipmentList.length,
    loadedSiteCount: equipment.displayedSiteGroups.length,
    siteFilter: equipment.siteFilter,
  });

  const activeTabPath = equipment.activeTab === EQUIPMENT_TABS.EQUIPMENT_BASED
    ? [equipment.activeTab, equipment.statusFilter]
    : equipment.activeTab === EQUIPMENT_TABS.SITE_BASED
      ? [equipment.activeTab, equipment.siteFilter]
      : [equipment.activeTab];

  const handleTabSelect = (path) => {
    const [tabKey, childKey] = path;

    if (tabKey !== equipment.activeTab) {
      equipment.changeTab(tabKey);
    }

    if (childKey) {
      if (tabKey === EQUIPMENT_TABS.SITE_BASED) {
        equipment.setSiteFilter(childKey);
      } else {
        equipment.setStatusFilter(childKey);
      }
    }
  };

  const isRecordsTab = equipment.activeTab === EQUIPMENT_TABS.RECORDS;
  const isIdleListTab = equipment.activeTab === EQUIPMENT_TABS.IDLE_LIST;
  const isSiteAllView = equipment.activeTab === EQUIPMENT_TABS.SITE_BASED && equipment.siteFilter === EQUIPMENT_ALL_SITES_FILTER;
  const isSiteSpecificView = equipment.activeTab === EQUIPMENT_TABS.SITE_BASED && equipment.siteFilter !== EQUIPMENT_ALL_SITES_FILTER;

  return (
    <div className="fleet equipment container">

      {equipment.isCompletedWorkAlertVisible && (
        <CompletedWorkAlert
          completedWorks={equipment.completedWorkAlerts}
          onClose={actions.closeCompletedWorkAlert}
        />
      )}

      <div className="fleet equipment layout">
        <div
          className={`fleet equipment layout-sidebar${isDragOverSidebar ? ' drag-over' : ''}`}
          onDragOver={handleSidebarDragOver}
          onDragLeave={handleSidebarDragLeave}
          onDrop={handleSidebarDrop}
        >
          <Tabs
            title="View"
            items={navTree}
            activePath={activeTabPath}
            onSelect={handleTabSelect}
            maxHeight='1090px'
            controlsColumns={2}
            controls={[
              { text: 'Print', ...BUTTON_PROPS, onClick: actions.printVisibleEquipment, colorScheme: 'black-200', textColor: 'white-200', componentIconLeft: 'PrinterIcon', componentIconSize: '30', iconColor: 'white-200' },
              { text: 'Export', ...BUTTON_PROPS, onClick: actions.requestExport, colorScheme: 'black-200', textColor: 'white-100', componentIconLeft: 'ExcelIcon', componentIconSize: '30', iconColor: 'white-200' },
              { ...BUTTON_PROPS, text: 'Cache', onClick: actions.clearImageCache, colorScheme: 'black-200', textColor: 'white-100', componentIconLeft: 'CleanIcon', componentIconSize: '36', iconColor: 'white-200' },
            ]}
          />
        </div>

        <div className="fleet equipment layout-content">
          {!isRecordsTab && !isIdleListTab && (
            <EquipmentControls
              isSelectMode={actions.isSelectMode}
              selectedEquipment={actions.selectedEquipment}
              onToggleSelectMode={actions.toggleSelectMode}
              onAdd={actions.handleAdd}
              onQuickServices={actions.handleQuickServices}
            />
          )}

          {isSiteSpecificView && <SiteMachineBreakdown site={equipment.siteFilter} />}

          {isEquipmentGridTab && !equipment.isLoadingEquipmentList && (
            <div className="fleet equipment view-toggle">
              <Button
                {...BUTTON_PROPS}
                width="42px"
                height="42px"
                componentIconCenter="GridViewIcon"
                componentIconSize={22}
                onClick={() => setViewMode('card')}
                colorScheme={viewMode === 'card' ? 'primary-600' : 'black-200'}
                iconColor="white-200"
              />
              <Button
                {...BUTTON_PROPS}
                width="42px"
                height="42px"
                componentIconCenter="TableViewIcon"
                componentIconSize={22}
                onClick={() => setViewMode('table')}
                colorScheme={viewMode === 'table' ? 'primary-600' : 'black-200'}
                iconColor="white-200"
              />
            </div>
          )}

          {isRecordsTab ? (
            <EquipmentRecords
              comparedEquipment={comparison.comparedEquipment}
              isLoadingComparedEquipment={comparison.isLoadingComparedEquipment}
              onRemoveCompared={comparison.removeComparedEquipment}
              onClearCompared={comparison.clearComparedEquipment}
            />
          ) : isIdleListTab ? (
            <IdleRoster actions={actions} />
          ) : equipment.isLoadingEquipmentList ? (
            isEquipmentGridTab && viewMode === 'table' ? (
              <TableSkeleton columns={EQUIPMENT_TABLE_COLUMN_COUNT} rows={8} />
            ) : (
              <EquipmentSkeletonGrid isSiteAllView={isSiteAllView} />
            )
          ) : (
            <>
              {isEquipmentGridTab && viewMode === 'table' && (
                <div>
                  <EquipmentTable
                    items={equipment.equipmentList}
                    onScrollEnd={tableInfiniteScroll.onScrollEnd}
                    onEdit={actions.handleEdit}
                    onDelete={actions.handleDeleteClick}
                    onServiceHistory={actions.handleRowClick}
                    onViewDetails={actions.handleViewDetails}
                    onMobilize={actions.handleMobilizeClick}
                    onDemobilize={actions.handleDemobilizeClick}
                    onMarkAsSold={actions.handleMarkAsSoldClick}
                    onSetIdleLocation={actions.handleSetIdleLocationClick}
                    onOpenRemarks={actions.handleOpenRemarksModal}
                  />
                  {equipment.isLoadingMoreEquipment && (
                    <LoadMoreSkeleton
                      count={1}
                      renderItem={() => (
                        <TableSkeleton columns={EQUIPMENT_TABLE_COLUMN_COUNT} rows={3} showHeader={false} />
                      )}
                    />
                  )}
                </div>
              )}

              {isEquipmentGridTab && viewMode === 'card' && (
                <div
                  ref={gridVirtualization.containerRef}
                  className="fleet equipment grid virtual-grid"
                  style={{ position: 'relative', width: '100%' }}
                >
                  {gridVirtualization.rowCount === 0 ? (
                    <div className="fleet equipment no-results">
                      <NothingToSeeHere
                        title="No equipments found"
                        subtitle="Try seaching something else or adjust the filters"
                      />
                    </div>
                  ) : (
                    <div style={{ position: 'relative', height: gridVirtualization.totalHeight, width: '100%' }}>
                      {gridVirtualization.virtualRows.map((virtualRow) => {
                        const rowItems = gridVirtualization.rows[virtualRow.index] || [];
                        return (
                          <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            ref={gridVirtualization.measureRow}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              transform: `translateY(${gridVirtualization.getRowOffset(virtualRow)}px)`,
                              display: 'grid',
                              gridTemplateColumns: `repeat(${gridVirtualization.columnCount}, 1fr)`,
                              gap: `${gridVirtualization.gap}px`,
                              paddingBottom: `${gridVirtualization.gap}px`,
                            }}
                          >
                            {rowItems.map((item) => (
                              <EquipmentCard
                                key={item.id}
                                item={item}
                                activeTab={equipment.activeTab}
                                isSelectMode={actions.isSelectMode}
                                isSelected={actions.selectedEquipment.includes(item.regNo)}
                                onSelect={actions.toggleEquipmentSelection}
                                onImageClick={equipment.openFullscreenImage}
                                onEdit={actions.handleEdit}
                                onDelete={actions.handleDeleteClick}
                                onServiceHistory={actions.handleRowClick}
                                onViewDetails={actions.handleViewDetails}
                                onMobilize={actions.handleMobilizeClick}
                                onDemobilize={actions.handleDemobilizeClick}
                                onAddShift={actions.handleAddShiftClick}
                                onReplaceEquipment={isSiteSpecificView ? actions.handleReplaceEquipmentClick : undefined}
                                onMarkAsSold={actions.handleMarkAsSoldClick}
                                onSetIdleLocation={actions.handleSetIdleLocationClick}
                                onOpenRemarks={actions.handleOpenRemarksModal}
                                draggable
                                onDragStart={(e) => handleEquipmentDragStart(e, item)}
                              />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {equipment.isLoadingMoreEquipment && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${gridVirtualization.columnCount}, 1fr)`,
                        gap: `${gridVirtualization.gap}px`,
                        marginTop: `${gridVirtualization.gap}px`,
                      }}
                    >
                      <LoadMoreSkeleton
                        count={gridVirtualization.columnCount}
                        renderItem={() => <EquipmentCardSkeleton />}
                      />
                    </div>
                  )}
                </div>
              )}

              {isSiteAllView && (
                <div className="fleet equipment site-grid">
                  {equipment.displayedSiteGroups.length > 0
                    ? equipment.displayedSiteGroups.map(([site, siteEquipments]) => (
                      <SiteCard
                        key={site}
                        site={site}
                        equipments={siteEquipments}
                        activeImageIndex={equipment.activeCardImageIndexByRegNo}
                        visibleCards={equipment.visibleEquipmentCardKeys}
                        onImageClick={equipment.openFullscreenImage}
                        onSetImageIndex={equipment.setCardImageIndex}
                        onEdit={actions.handleEdit}
                        onDelete={actions.handleDeleteClick}
                        onServiceHistory={actions.handleRowClick}
                        onViewDetails={actions.handleViewDetails}
                        onReplaceEquipment={actions.handleReplaceEquipmentClick}
                      />
                    ))
                    : <div className="fleet equipment no-results">
                      <NothingToSeeHere
                        title="No equipments found"
                        subtitle="Try seaching something else or adjust the filters"
                      />
                    </div>
                  }
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <EquipmentSidebar
        show={actions.showSidebar}
        title={actions.sidebarTitle}
        content={actions.sidebarContent}
        isLoading={actions.isLoadingFuels}
        isSelectMode={actions.isSelectMode}
        onClose={actions.closeSidebar}
        onViewDetails={actions.handleViewDetails}
        onReplaceOperator={actions.handleReplaceOperatorClick}
        onSetContent={actions.setSidebarContent}
        onSetTitle={actions.setSidebarTitle}
        onViewFuels={actions.handleViewAllFuels}
      />

      <FullscreenViewer
        image={equipment.fullscreenImage}
        imageIndex={equipment.fullscreenImageIndex}
        equipment={equipment.fullscreenEquipment}
        clickPosition={equipment.fullscreenClickOrigin}
        filteredData={equipment.equipmentList}
        onClose={equipment.closeFullscreenImage}
        onSetImage={equipment.setFullscreenImage}
        onSetImageIndex={equipment.setFullscreenImageIndex}
        onSetEquipment={equipment.setFullscreenEquipment}
      />

      <EquipmentModals
        operator={equipment.operatorOptions}
        sites={equipment.siteOptions}
        searchTerm={searchTerm}
        onSiteFocus={equipment.fetchSiteOptionsForDropdown}

        showAddModal={actions.showAddModal}
        addEquipmentForm={actions.addEquipmentForm}
        onAddFormChange={actions.onAddFormChange}
        onAddSubmit={actions.handleAddEquipmentSubmit}
        onAddClose={actions.closeAddModal}

        showEditModal={actions.showEditModal}
        editFormData={actions.editFormData}
        onEditFormChange={actions.onEditFormChange}
        onEditSubmit={actions.handleUpdateEquipment}
        onEditClose={actions.closeEditModal}

        showDeleteModal={actions.showDeleteModal}
        equipmentToDelete={actions.equipmentToDelete}
        onDeleteConfirm={actions.confirmDelete}
        onDeleteClose={actions.closeDeleteModal}

        showStatusModal={actions.showStatusModal}
        deleteStatus={actions.deleteStatus}
        onStatusClose={actions.closeStatusModal}

        showExportModal={actions.showExportModal}
        exportColumns={actions.exportColumns}
        onExportColumnChange={actions.setExportColumns}
        onExportConfirm={actions.confirmExport}
        onExportReset={actions.resetExportColumns}
        onExportClose={actions.closeExportModal}

        showFuelProgressModal={actions.showFuelProgressModal}
        fuelProgress={actions.fuelProgress}

        showNoResultsModal={actions.showNoResultsModal}
        outsideEquipmentForm={actions.outsideEquipmentForm}
        onNoResultsClose={actions.onNoResultsClose}
        onAddAsOutside={actions.onAddAsOutside}

        showAddShiftModal={actions.showAddShiftModal}
        addShiftForm={actions.addShiftForm}
        onAddShiftFormChange={actions.onAddShiftFormChange}
        onAddShiftOperatorAdd={actions.onAddShiftOperatorAdd}
        onAddShiftOperatorRemove={actions.onAddShiftOperatorRemove}
        onAddShiftSubmit={actions.handleAddShiftSubmit}
        onAddShiftClose={actions.closeAddShiftModal}

        showMobilizeModal={actions.showMobilizeModal}
        mobilizeForm={actions.mobilizeForm}
        selectedEquipmentForAction={actions.selectedEquipmentForAction}
        onMobilizeFormChange={actions.onMobilizeFormChange}
        onMobilizeOperatorAdd={actions.onMobilizeOperatorAdd}
        onMobilizeOperatorChange={actions.onMobilizeOperatorChange}
        onMobilizeOperatorRemove={actions.onMobilizeOperatorRemove}
        onMobilizeSubmit={actions.handleMobilizeSubmit}
        onMobilizeClose={actions.closeMobilizeModal}

        showDemobilizeModal={actions.showDemobilizeModal}
        demobilizeDatePrompt={actions.demobilizeDatePrompt}
        demobilizeForm={actions.demobilizeForm}
        onDemobilizeFormChange={actions.onDemobilizeFormChange}
        onDemobilizeAskDate={actions.handleDemobilizeAskDate}
        onDemobilizeSubmit={actions.handleDemobilizeSubmit}
        onDemobilizeClose={actions.closeDemobilizeModal}

        showReplaceOperatorModal={actions.showReplaceOperatorModal}
        replaceOperatorForm={actions.replaceOperatorForm}
        onReplaceOperatorFormChange={actions.onReplaceOperatorFormChange}
        onReplaceOperatorClick={actions.handleReplaceOperatorClick}
        onReplaceOperatorSubmit={actions.handleReplaceOperatorSubmit}
        onReplaceOperatorClose={actions.closeReplaceOperatorModal}

        showReplaceEquipmentModal={actions.showReplaceEquipmentModal}
        replaceEquipmentForm={actions.replaceEquipmentForm}
        replaceEquipmentResults={actions.replaceEquipmentResults}
        onReplaceEquipmentFormChange={actions.onReplaceEquipmentFormChange}
        onReplaceEquipmentSubmit={actions.handleReplaceEquipmentSubmit}
        onReplaceEquipmentClose={actions.closeReplaceEquipmentModal}

        showMarkSoldModal={actions.showMarkSoldModal}
        equipmentToMarkSold={actions.equipmentToMarkSold}
        onMarkSoldConfirm={actions.confirmMarkAsSold}
        onMarkSoldClose={actions.closeMarkSoldModal}

        showIdleLocationModal={actions.showIdleLocationModal}
        idleLocationForm={actions.idleLocationForm}
        onIdleLocationFormChange={actions.onIdleLocationFormChange}
        onIdleLocationSubmit={actions.handleIdleLocationSubmit}
        onIdleLocationClose={actions.closeIdleLocationModal}

        showRemarksModal={actions.showRemarksModal}
        remarksForm={actions.remarksForm}
        onRemarksFormChange={actions.onRemarksFormChange}
        onRemarksSubmit={actions.handleRemarksSubmit}
        onRemarksClose={actions.closeRemarksModal}
      />
    </div>
  );
}

export default Equipments;