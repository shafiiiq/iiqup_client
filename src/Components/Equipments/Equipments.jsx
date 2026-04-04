// ─────────────────────────────────────────────────────────────────────────────
// Equipments.jsx — Shell component. Composes hooks and sub-components.
// Contains NO business logic, NO fetch calls, NO inline handlers.
// All state lives in hooks; all UI lives in components/.
// ─────────────────────────────────────────────────────────────────────────────

import './Equipments.css';
import { useState }            from 'react';
import { useSearch }           from '../../Context/SearchContext';

// Hooks
import { useImageCache }       from './hooks/useImageCache';
import { useEquipmentData }    from './hooks/useEquipmentData';
import { useEquipmentSearch }  from './hooks/useEquipmentSearch';
import { useEquipmentActions } from './hooks/useEquipmentActions';

// Components
import CompletedWorkAlert  from './components/CompletedWorkAlert';
import EquipmentControls   from './components/EquipmentControls';
import EquipmentCard       from './components/EquipmentCard';
import SiteCard            from './components/SiteCard';
import EquipmentSidebar    from './components/EquipmentSidebar';
import FullscreenViewer    from './components/FullscreenViewer';
import EquipmentModals     from './components/EquipmentModals';

// Utils
import { buildAndDownloadExcel, printEquipmentTable } from './utils/exportHelpers';

function Equipments() {
  const { searchTerm, setSearchTerm } = useSearch();
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');

  // ── Fullscreen viewer state (owned here, passed to viewer + cards) ─────────
  const [fullscreenImage,     setFullscreenImage]     = useState(null);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
  const [fullscreenEquipment,  setFullscreenEquipment]  = useState(null);
  const [imageClickPosition,   setImageClickPosition]   = useState({ x: 0, y: 0 });

  // ── Hooks ──────────────────────────────────────────────────────────────────

  const imageCache = useImageCache();

  const data = useEquipmentData({ getMediaUrlWithCache: imageCache.getMediaUrlWithCache, searchTerm, activeStatusFilter });

  const actions = useEquipmentActions({
    fetchEquipments:       data.fetchEquipments,
    fetchSitesForDropdown: data.fetchSitesForDropdown,
    operator:              data.operator,
  });

  useEquipmentSearch({
    activeTab:             data.activeTab,
    fetchEquipments:       data.fetchEquipments,
    setFilteredData:       data.setFilteredData,
    setShowNoResultsModal: actions.setShowNoResultsModal,
    hydrateWithImages:     data.hydrateWithImages,
    setIsSearchActive:     data.setIsSearchActive,
  });

  // ── Fullscreen Handlers ────────────────────────────────────────────────────

  const handleImageClick = (e, equipment, imageIndex) => {
    e.stopPropagation();
    const rect = e.target.getBoundingClientRect();
    setImageClickPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setFullscreenEquipment(equipment);
    setFullscreenImage(equipment.equipmentImage[imageIndex]);
    setFullscreenImageIndex(imageIndex);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
    setFullscreenEquipment(null);
    setFullscreenImageIndex(0);
  };

  // ── Export / Print handlers (bridge to exportHelpers) ─────────────────────

  const handleExport = () => {
    if (!data.filteredData.length) {
      actions.showStatus('No data available to export.', true);
      return;
    }
    actions.setShowExportModal(true);
  };

  const handleExportConfirm = () => {
    const result = buildAndDownloadExcel(data.filteredData, actions.exportColumns);
    actions.setShowExportModal(false);
    actions.showStatus(result.message, !result.success);
  };

  const handlePrint = () => printEquipmentTable(data.filteredData, searchTerm);

  const handleClearCache = () => {
    imageCache.clearAllCache();
    actions.showStatus('Image cache cleared. Reload to fetch fresh images.');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="equipment-container">

      {/* ── Completed Work Alert ── */}
      {data.showCompletedWorkAlert && (
        <CompletedWorkAlert
          completedWorks={data.completedWorks}
          onClose={() => data.setShowCompletedWorkAlert(false)}
        />
      )}

      {/* ── Controls: buttons + tabs + results count ── */}
      <EquipmentControls
        isSelectMode={actions.isSelectMode}
        selectedEquipment={actions.selectedEquipment}
        onToggleSelectMode={() => { actions.setIsSelectMode(p => !p); actions.setSelectedEquipment([]); }}
        onAdd={actions.handleAdd}
        onPrint={handlePrint}
        onExport={handleExport}
        onClearCache={handleClearCache}
        onQuickServices={actions.handleQuickServices}
        activeTab={data.activeTab}
        onTabChange={(tab) => { data.setActiveTab(tab); setActiveStatusFilter('all'); }}
        activeStatusFilter={activeStatusFilter}
        onStatusFilterChange={setActiveStatusFilter}
        statusCounts={data.statusCounts}
        searchTerm={searchTerm}
        filteredData={data.filteredData}
        displayedEquipment={data.displayedEquipment}
        displayedSites={data.displayedSites}
        siteGroupedEquipment={data.siteGroupedEquipment}
      />

      {/* ── Equipment Grid (equipment-based / hired tabs) ── */}
      {(data.activeTab === 'equipment-based' || data.activeTab === 'hired' || data.activeTab === 'leased') && (
        <div className="equipment-grid">
          {data.displayedEquipment.map((item) => (
            <EquipmentCard
              key={item.id}
              item={item}
              activeTab={data.activeTab}
              isSelectMode={actions.isSelectMode}
              isSelected={actions.selectedEquipment.includes(item.regNo)}
              currentImageIndex={data.activeImageIndex[item.regNo] || 0}
              isVisible={data.visibleCards.has(item.regNo)}
              onSelect={actions.toggleEquipmentSelection}
              onImageClick={handleImageClick}
              onSetImageIndex={(regNo, index) =>
                data.setActiveImageIndex(prev => ({ ...prev, [regNo]: index }))
              }
              onEdit={actions.handleEdit}
              onDelete={actions.handleDeleteClick}
              onServiceHistory={actions.handleRowClick}
              onViewDetails={actions.handleViewDetails}
              onMobilize={actions.handleMobilizeClick}
              onDemobilize={actions.handleDemobilizeClick}
            />
          ))}
        </div>
      )}

      {/* ── Site Grid (site-based tab) ── */}
      {data.activeTab === 'site-based' && (
        <div className="site-grid">
          {data.displayedSites.length > 0
            ? data.displayedSites.map(([site, equipments]) => (
                <SiteCard
                  key={site}
                  site={site}
                  equipments={equipments}
                  activeImageIndex={data.activeImageIndex}
                  visibleCards={data.visibleCards}
                  onImageClick={handleImageClick}
                  onSetImageIndex={(regNo, index) =>
                    data.setActiveImageIndex(prev => ({ ...prev, [regNo]: index }))
                  }
                  onEdit={actions.handleEdit}
                  onDelete={actions.handleDeleteClick}
                  onServiceHistory={actions.handleRowClick}
                  onViewDetails={actions.handleViewDetails}
                  onReplaceEquipment={actions.handleReplaceEquipmentClick}
                />
              ))
            : <div className="no-results">No equipment found</div>
          }
        </div>
      )}

      {/* ── Sidebar ── */}
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

      {/* ── Fullscreen Image Viewer ── */}
      <FullscreenViewer
        image={fullscreenImage}
        imageIndex={fullscreenImageIndex}
        equipment={fullscreenEquipment}
        clickPosition={imageClickPosition}
        filteredData={data.filteredData}
        onClose={closeFullscreen}
        onSetImage={setFullscreenImage}
        onSetImageIndex={setFullscreenImageIndex}
        onSetEquipment={setFullscreenEquipment}
      />

      {/* ── All Modals ── */}
      <EquipmentModals
        // Shared
        operator={data.operator}
        sites={data.sites}
        searchTerm={searchTerm}
        onSiteFocus={data.fetchSitesForDropdown}
        // Add
        showAddModal={actions.showAddModal}
        addEquipmentForm={actions.addEquipmentForm}
        onAddFormChange={(field, value) => {
          if (field === 'operator') {
            const op = data.operator.find(o => o.name === value);
            actions.setAddEquipmentForm(prev => ({ ...prev, operator: value, operatorId: op?._id || op?.id || '' }));
          } else if (field === 'site') {
            actions.setAddEquipmentForm(prev => ({ ...prev, site: typeof value === 'string' ? value : value?.value || value }));
          } else if (field.startsWith('rentRate.')) {
            const key = field.split('.')[1];
            actions.setAddEquipmentForm(prev => ({ ...prev, rentRate: { ...prev.rentRate, [key]: value } }));
          } else {
            actions.setAddEquipmentForm(prev => ({ ...prev, [field]: value }));
          }
        }}
        onAddSubmit={actions.handleAddEquipmentSubmit}
        onAddClose={actions.closeAddModal}
        // Edit
        showEditModal={actions.showEditModal}
        editFormData={actions.editFormData}
        onEditFormChange={(field, value) => {
          if (field === 'operator') {
            const op = data.operator.find(o => o.name === value);
            actions.setEditFormData(prev => ({ ...prev, operator: value, operatorId: op?._id || op?.id || '' }));
          } else if (field === 'site') {
            actions.setEditFormData(prev => ({ ...prev, site: typeof value === 'string' ? value : value?.value || value }));
          } else if (field.startsWith('rentRate.')) {
            const key = field.split('.')[1];
            actions.setEditFormData(prev => ({ ...prev, rentRate: { ...prev.rentRate, [key]: value } }));
          } else {
            actions.setEditFormData(prev => ({ ...prev, [field]: value }));
          }
        }}
        onEditSubmit={actions.handleUpdateEquipment}
        onEditClose={actions.closeEditModal}
        // Delete
        showDeleteModal={actions.showDeleteModal}
        equipmentToDelete={actions.equipmentToDelete}
        onDeleteConfirm={actions.confirmDelete}
        onDeleteClose={() => actions.setShowDeleteModal(false)}
        // Status
        showStatusModal={actions.showStatusModal}
        deleteStatus={actions.deleteStatus}
        onStatusClose={() => actions.setShowStatusModal(false)}
        // Export
        showExportModal={actions.showExportModal}
        exportColumns={actions.exportColumns}
        onExportColumnChange={actions.setExportColumns}
        onExportConfirm={handleExportConfirm}
        onExportReset={() => actions.setExportColumns({
          machine: true, regNo: true, brand: true, year: true,
          company: true, operator: true, site: true, status: true,
          istimaraExpiry: false, insuranceExpiry: false, tpcExpiry: false,
        })}
        onExportClose={() => actions.setShowExportModal(false)}
        // Progress modals
        showFuelProgressModal={actions.showFuelProgressModal}
        fuelProgress={actions.fuelProgress}
        isLoadingEquipments={data.isLoadingEquipments}
        equipmentProgress={data.equipmentProgress}
        // No results
        showNoResultsModal={actions.showNoResultsModal}
        outsideEquipmentForm={actions.outsideEquipmentForm}
        onNoResultsClose={() => { actions.setShowNoResultsModal(false); setSearchTerm(''); }}
        onAddAsOutside={() => {
          actions.setOutsideEquipmentForm(prev => ({ ...prev, regNo: searchTerm }));
          actions.setShowNoResultsModal(false);
          actions.setShowOutsideEquipmentModal(true);
        }}
        // Mobilize
        showMobilizeModal={actions.showMobilizeModal}
        mobilizeForm={actions.mobilizeForm}
        selectedEquipmentForAction={actions.selectedEquipmentForAction}
        onMobilizeFormChange={(field, value) => {
          const operatorMatch = field.match(/^operators\[(\d+)\]\.(.+)$/);
          if (operatorMatch) {
            const index = parseInt(operatorMatch[1]);
            const subField = operatorMatch[2];
            actions.setMobilizeForm(prev => {
              const updated = [...prev.operators];
              if (subField === 'operatorName') {
                const op = data.operator.find(o => o.name === value);
                updated[index] = { ...updated[index], operatorName: value, operatorId: op?._id || op?.id || '' };
              } else {
                updated[index] = { ...updated[index], [subField]: value };
              }
              return { ...prev, operators: updated };
            });
          } else if (field === 'withShift') {
            // turning on withShift → seed Day + Night slots, reset moreShifts
            actions.setMobilizeForm(prev => ({
              ...prev,
              withShift: value,
              moreShifts: false,
              operators: value ? [
                { operatorName: '', operatorId: '', shiftName: 'Day Shift',   shiftStart: '', shiftEnd: '' },
                { operatorName: '', operatorId: '', shiftName: 'Night Shift', shiftStart: '', shiftEnd: '' },
              ] : [],
            }));
          } else if (field === 'moreShifts') {
            // switching to more-shifts mode keeps existing operators; unchecking reseeds Day/Night
            actions.setMobilizeForm(prev => ({
              ...prev,
              moreShifts: value,
              operators: !value ? [
                { operatorName: '', operatorId: '', shiftName: 'Day Shift',   shiftStart: '', shiftEnd: '' },
                { operatorName: '', operatorId: '', shiftName: 'Night Shift', shiftStart: '', shiftEnd: '' },
              ] : prev.operators,
            }));
          } else if (field === 'operator') {
            const op = data.operator.find(o => o.name === value);
            actions.setMobilizeForm(prev => ({ ...prev, operator: value, operatorId: op?._id || op?.id || '' }));
          } else if (field === 'deployType') {
            actions.setMobilizeForm(prev => ({
              ...prev,
              deployType: value,
              site: value === 'company' ? '' : prev.site,
              clientCompany: value === 'site' ? '' : prev.clientCompany,
            }));
          } else {
            actions.setMobilizeForm(prev => ({ ...prev, [field]: value }));
          }
        }}
        onMobilizeOperatorAdd={() => {
          actions.setMobilizeForm(prev => ({
            ...prev,
            operators: [...prev.operators, { operatorName: '', operatorId: '', shiftName: '', shiftStart: '', shiftEnd: '' }]
          }));
        }}
        onMobilizeOperatorChange={(index, field, value) => {
          actions.setMobilizeForm(prev => {
            const updated = [...prev.operators];
            if (field === 'operatorName') {
              const op = data.operator.find(o => o.name === value);
              updated[index] = { ...updated[index], operatorName: value, operatorId: op?._id || op?.id || '', shiftName: value };
            } else {
              updated[index] = { ...updated[index], [field]: value };
            }
            return { ...prev, operators: updated };
          });
        }}
        onMobilizeOperatorRemove={(index) => {
          actions.setMobilizeForm(prev => ({
            ...prev,
            operators: prev.operators.filter((_, i) => i !== index)
          }));
        }}
        onMobilizeSubmit={actions.handleMobilizeSubmit}
        onMobilizeClose={actions.closeMobilizeModal}
        // Demobilize
        showDemobilizeModal={actions.showDemobilizeModal}
        demobilizeDatePrompt={actions.demobilizeDatePrompt}
        demobilizeForm={actions.demobilizeForm}
        onDemobilizeFormChange={(field, value) => actions.setDemobilizeForm(prev => ({ ...prev, [field]: value }))}
        onDemobilizeAskDate={actions.handleDemobilizeAskDate}
        onDemobilizeSubmit={actions.handleDemobilizeSubmit}
        onDemobilizeClose={actions.closeDemobilizeModal}
        // Replace operator
        showReplaceOperatorModal={actions.showReplaceOperatorModal}
        replaceOperatorForm={actions.replaceOperatorForm}
        onReplaceOperatorFormChange={(field, value) => {
          if (field === 'selectedShift') {
            // find the shift by shiftName or operatorName and populate the fields
            const entry = actions.replaceOperatorForm.allShifts.find(
              s => (s.shiftName || s.operatorName) === value
            );
            actions.setReplaceOperatorForm(prev => ({
              ...prev,
              selectedShift:     value,
              currentOperator:   entry?.operatorName  || '',
              currentOperatorId: entry?.operatorId    || '',
              targetShiftName:   entry?.shiftName     || '',
              shiftName:         entry?.shiftName     || '',
              shiftStart:        entry?.shiftStart    || '',
              shiftEnd:          entry?.shiftEnd      || '',
            }));
          } else if (field === 'replacedOperator') {
            const op = data.operator.find(o => o.name === value);
            actions.setReplaceOperatorForm(prev => ({
              ...prev,
              replacedOperator:   value,
              replacedOperatorId: op?._id || op?.id || '',
            }));
          } else if (field === 'replaceAll') {
              actions.setReplaceOperatorForm(prev => ({
              ...prev,
              replaceAll:        value,
              // clear the shift-specific fields when switching to replaceAll
              selectedShift:     '',
              currentOperator:   '',
              currentOperatorId: '',
              targetShiftName:   '',
            }));
          } else {
            actions.setReplaceOperatorForm(prev => ({ ...prev, [field]: value }));
          }
        }}
        onReplaceOperatorClick={actions.handleReplaceOperatorClick}
        onReplaceOperatorSubmit={actions.handleReplaceOperatorSubmit}
        onReplaceOperatorClose={actions.closeReplaceOperatorModal}
        // Replace equipment
        showReplaceEquipmentModal={actions.showReplaceEquipmentModal}
        replaceEquipmentForm={actions.replaceEquipmentForm}
        replaceEquipmentResults={actions.replaceEquipmentResults}
        onReplaceEquipmentFormChange={(field, value) => {
          if (field === 'replacedEquipmentRegNo') {
            actions.handleReplaceEquipmentSearch(value);
            const selected = actions.replaceEquipmentResults.find(eq => eq.regNo === value);
            selected
              ? actions.handleReplaceEquipmentSelect(selected)
              : actions.setReplaceEquipmentForm(prev => ({ ...prev, replacedEquipmentRegNo: value, replacedEquipmentMachine: '', replacedEquipmentId: '' }));
          } else if (field === 'operator') {
            const op = data.operator.find(o => o.name === value);
            actions.setReplaceEquipmentForm(prev => ({ ...prev, operator: value, operatorId: op?._id || op?.id || '' }));
          } else {
            actions.setReplaceEquipmentForm(prev => ({ ...prev, [field]: value }));
          }
        }}
        onReplaceEquipmentSubmit={actions.handleReplaceEquipmentSubmit}
        onReplaceEquipmentClose={actions.closeReplaceEquipmentModal}
      />
    </div>
  );
}

export default Equipments;