// ─────────────────────────────────────────────────────────────────────────────
// EquipmentControls.jsx — Top action bar + tab navigation + results count.
// Pure presentational: all handlers passed in as props from the shell.
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate }  from 'react-router-dom';
import Button           from '../../../Common/Button/Button';
import Tutorial from '../../../Common/Tutorial/Tutorial';

// ─────────────────────────────────────────────────────────────────────────────
// Shared Button defaults — every button in this bar uses these same props.
// Spread first, then override what differs per button.
// ─────────────────────────────────────────────────────────────────────────────
const BTN = {
  variant:         'gradient',
  font:            'md',
  animation:       '',
  squircle:        '4xl',
  height:          '38px',
  shadowPosition:  'to-bottom',
  shadowColor:     'white-600',
};

/**
 * @param {{
 *   // Selection mode
 *   isSelectMode:          boolean,
 *   selectedEquipment:     Array,
 *   onToggleSelectMode:    () => void,
 *   // Actions
 *   onAdd:                 () => void,
 *   onPrint:               () => void,
 *   onExport:              () => void,
 *   onClearCache:          () => void,
 *   onQuickServices:       () => void,
 *   // Tab
 *   activeTab:             string,
 *   onTabChange:           (tab: string) => void,
 *   // Results label
 *   searchTerm:            string,
 *   filteredData:          Array,
 *   displayedEquipment:    Array,
 *   displayedSites:        Array,
 *   siteGroupedEquipment:  object,
 * }} props
 */
function EquipmentControls({
  isSelectMode,
  selectedEquipment,
  onToggleSelectMode,
  onAdd,
  onPrint,
  onExport,
  onClearCache,
  onQuickServices,
  activeTab,
  onTabChange,
  searchTerm,
  filteredData,
  displayedEquipment,
  displayedSites,
  siteGroupedEquipment,
  activeStatusFilter,
  onStatusFilterChange,
  statusCounts,
}) {
  const navigate = useNavigate();

  // ── Derived: results label ─────────────────────────────────────────────────
  const resultsLabel = (() => {
    if (activeTab === 'site-based') {
      const siteCount = Object.keys(siteGroupedEquipment).length;
      const plural    = siteCount === 1 ? 'site' : 'sites';
      return searchTerm
        ? `Found ${siteCount} matching ${plural} with ${filteredData?.length || 0} equipment`
        : `Showing ${displayedSites.length} of ${siteCount} ${plural} with ${filteredData?.length || 0} equipment`;
    }
    const total = filteredData?.length || 0;
    return searchTerm
      ? `Found ${total} matching ${total === 1 ? 'entry' : 'entries'}`
      : `Showing ${displayedEquipment?.length || 0} of ${total} entries`;
  })();

  // ── Tab config — drives the 3 tab buttons ─────────────────────────────────
  const TABS = [
    { key: 'equipment-based', label: 'Own Equipments' },
    { key: 'hired',           label: 'Hired'          },
    { key: 'leased',          label: 'Leased to Client' },
    { key: 'site-based',      label: 'View By Sites'  },
  ];

  return (
    <>
      {/* ── Action Buttons ── */}
      <div className="controls-container">
        <div className="buttons-container">
          <Button
            {...BTN}
            text={isSelectMode ? 'Cancel Selection' : 'Select Multiple'}
            onClick={onToggleSelectMode}
            colorScheme={isSelectMode ? 'red-600' : 'purple-600'}
            width="160px"
            textColor="white-200"
          />

          {/* Only shown when at least one card is checked */}
          {isSelectMode && selectedEquipment.length > 0 && (
            <Button
              {...BTN}
              text={`View History (${selectedEquipment.length})`}
              onClick={() => navigate(`/service-history/${selectedEquipment.join(',')}`)}
              colorScheme="emerald-600"
              width="180px"
              textColor="white-200"
            />
          )}

          <Button {...BTN} text="Add Equipment"      onClick={onAdd}     colorScheme="amber-600"   width="160px" textColor="white-200" type="submit" />
          <Button {...BTN} text="Print"              onClick={onPrint}   colorScheme="pink-800"    width="160px" textColor="white-200" type="submit" />
          <Button {...BTN} text="Export as Excel"    onClick={onExport}  colorScheme="lime-800"    width="160px" textColor="white-200" type="submit" />
        </div>

        <div className="buttons-container">
          <Button {...BTN} text="Recent Activities"       onClick={() => navigate('/operations-recent-activities')} colorScheme="blue-400" width="fit-content" textColor="black-200" type="submit" />
          <Button {...BTN} text="Quick Service Histories" onClick={onQuickServices}                                 colorScheme="lime-400" width="fit-content" textColor="black-200" type="submit" />
          <Button {...BTN} text="Clear Cache"             onClick={onClearCache}                                    colorScheme="emerald-800" width="160px"   textColor="white-200" type="submit" />
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="doc-details-tabs">
        {TABS.map(({ key, label }) => (
          <Button
            key={key}
            {...BTN}
            text={label}
            onClick={() => onTabChange(key)}
            colorScheme={activeTab === key ? 'amber-300' : 'amber-900'}
            width="50%"
            height="48px"
            type="submit"
            textColor={activeTab === key ? 'black-300' : 'white-900'}
          />
        ))}
      </div>

      {/* ── Status Sub-tabs (own equipment only) ── */}
      <Tutorial
         title="Category Tabs Added"
         description="Easily filter equipment by status using the Active, Idle, and Under Maintenance tabs"
         order={1}
      >
      {activeTab === 'equipment-based' && (
        <div className="doc-details-tabs" style={{ marginTop: '8px' }}>
          {[
            { key: 'all',         label: `All (${statusCounts?.total || 0})`                        },
            { key: 'active',      label: `Active (${statusCounts?.active || 0})`                    },
            { key: 'idle',        label: `Idle (${statusCounts?.idle || 0})`                        },
            { key: 'maintenance', label: `Under Maintenance (${statusCounts?.maintenance || 0})`    },
          ].map(({ key, label }) => (
            <Button
              key={key}
              {...BTN}
              text={label}
              onClick={() => onStatusFilterChange(key)}
              colorScheme={activeStatusFilter === key ? 'indigo-200' : 'indigo-900'}
              width="25%"
              height="45px"
              textColor={activeStatusFilter === key ? 'black-300' : 'white-900'}
            />
          ))}
        </div>
      )}
      </Tutorial>

      {/* ── Results Count ── */}
      <div className="table-info">{resultsLabel}</div>
    </>
  );
}

export default EquipmentControls;