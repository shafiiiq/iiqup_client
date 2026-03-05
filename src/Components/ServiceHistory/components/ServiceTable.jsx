// ─────────────────────────────────────────────────────────────────────────────
// ServiceTable.jsx — Renders the service history <table>.
// Handles: conditional columns per tab, badge rendering,
//          expandable remarks, row-click navigation, delete button.
// No API calls, no state — pure props.
// ─────────────────────────────────────────────────────────────────────────────

import React                   from 'react';
import { useNavigate }         from 'react-router-dom';
import Button                  from '../../../Common/Button/Button';
import { formatDate, getServiceTypeBadge, getRemarksText } from '../utils/serviceHelpers';

// Shared button defaults for action buttons inside table cells.
const TABLE_BTN = {
  variant:        'gradient',
  font:           'md',
  animation:      '',
  squircle:       '4xl',
  width:          '160px',
  height:         '38px',
  type:           'submit',
  shadowPosition: 'to-bottom',
  shadowColor:    'white-600',
};

/**
 * @param {{
 *   groupedData:           object,
 *   activeTab:             string,
 *   isMultipleEquipment:   boolean,
 *   multipleEquipmentData: Array,
 *   regNoArray:            string[],
 *   expandedRemarks:       object,
 *   onToggleRemark:        (key: string) => void,
 *   onDeleteReport:        (item: object) => void,
 *   tableRef:              React.RefObject,
 * }} props
 */
function ServiceTable({
  groupedData,
  activeTab,
  isMultipleEquipment,
  multipleEquipmentData,
  regNoArray,
  expandedRemarks,
  onToggleRemark,
  onDeleteReport,
  tableRef,
}) {
  const navigate = useNavigate();

  const handleRowClick = (date, serviceType, historyId) => {
    navigate(`/service-document/${historyId}`, {
      state: {
        regNo:     regNoArray[0],
        date,
        serviceType,
        historyId,
        docType:   serviceType === 'maintenance' ? 'maintenance-doc'
                 : serviceType === 'tyre'        ? 'tyre-doc'
                 : serviceType === 'battery'     ? 'battery-doc'
                 : 'service-doc',
      },
    });
  };

  // ── Remarks cell — shared across all service types ─────────────────────────

  const RemarksCell = ({ item, remarkKey }) => {
    const text = getRemarksText(item);
    if (!text) return null;

    const isLong     = text.length > 100;
    const isExpanded = expandedRemarks[remarkKey];

    return (
      <div className="remarks-content">
        <div className={`remarks-text${isExpanded ? ' expanded' : ''}`}>
          {text}
        </div>
        {isLong && (
          <button
            className="view-more-btn no-print"
            onClick={(e) => { e.stopPropagation(); onToggleRemark(remarkKey); }}
          >
            {isExpanded ? 'View Less' : 'View More'}
          </button>
        )}
      </div>
    );
  };

  // ── Column visibility flags — derived from activeTab ───────────────────────

  const showServiceType    = activeTab === 'all';
  const showHours          = ['oil', 'normal', 'maintenance', 'all'].includes(activeTab);
  const showNextFullService = activeTab === 'oil' || activeTab === 'all';
  const showTyreCols       = activeTab === 'tyre' || activeTab === 'all';
  const showBatteryCols    = activeTab === 'battery' || activeTab === 'all';
  const isOilOrNormal      = (type) => type === 'oil' || type === 'normal';
  const hasHoursData       = (type) => ['oil', 'normal', 'maintenance'].includes(type);

  return (
    <div className="service-table-container">
      <table className="service-table" ref={tableRef}>

        {/* ── Table Head ── */}
        <thead>
          <tr>
            <th className="date-th">Date</th>
            {showServiceType   && <th>Service Type</th>}
            <th>Work Description</th>
            {showHours && (
              <>
                <th>Serviced Hrs/Km</th>
                <th>Next Service</th>
                {showNextFullService && <th>Next Full Service</th>}
              </>
            )}
            {showTyreCols    && <><th>Location</th><th>Tyre Model</th></>}
            {showBatteryCols && <th>Battery Model</th>}
            <th>Remarks</th>
            <th className="document-column">Document</th>
            <th className="document-column">Delete</th>
          </tr>
        </thead>

        {/* ── Table Body ── */}
        <tbody>
          {Object.keys(groupedData).length > 0 ? (
            Object.entries(groupedData).map(([regNo, items]) => {
              const equipment = multipleEquipmentData.find(
                eq => eq.regNo?.toString().trim() === regNo?.toString().trim()
              );

              return (
                <React.Fragment key={regNo}>
                  {/* Equipment group header row — only shown in multi-equipment mode */}
                  {isMultipleEquipment && (
                    <tr className="equipment-header-row">
                      <td colSpan="16">
                        {equipment?.machine ?? 'Equipment'} - Reg No: {regNo}
                      </td>
                    </tr>
                  )}

                  {items.map((item, index) => {
                    const badge      = getServiceTypeBadge(item.serviceType);
                    const remarkKey  = `${regNo}-${index}`;
                    const rowClasses = [
                      `${item.serviceType}-service`,
                      item.fullService  ? 'full-service-row'  : '',
                      item.replaced     ? 'replacement-row'   : '',
                    ].filter(Boolean).join(' ');

                    return (
                      <tr key={remarkKey} className={rowClasses}>

                        {/* Date */}
                        <td>{formatDate(item.date)}</td>

                        {/* Service Type Badge */}
                        {showServiceType && (
                          <td>
                            <span className={`service-badge ${badge.className}`}>
                              {item.fullService ? 'Full Service' : badge.text}
                            </span>
                          </td>
                        )}

                        {/* Work Description */}
                        <td style={{ textAlign: 'left' }}>
                          {isOilOrNormal(item.serviceType) && (
                            <div>
                              <div>
                                <strong>Fuel Filter: </strong>{item.fuelFilter},&nbsp;
                                <strong>Water Sep: </strong>{item.waterSeparator}
                              </div>
                              <div>
                                <strong>Air Filter:</strong> {item.airFilter}
                                {item.acFilter && <>, <strong>A/C Filter:</strong> {item.acFilter}</>}
                              </div>
                            </div>
                          )}
                          {!isOilOrNormal(item.serviceType) && (item.workRemarks?.toUpperCase() || '-')}
                        </td>

                        {/* Hours columns */}
                        {showHours && (
                          <>
                            <td>
                              {hasHoursData(item.serviceType)
                                ? item.serviceHrs
                                : item.serviceType === 'tyre' ? item.runningHours : '-'}
                            </td>
                            <td>
                              {hasHoursData(item.serviceType)
                                ? (item.nextServiceHrs === 0 || item.nextServiceHrs === '0' ? '' : item.nextServiceHrs)
                                : '-'}
                            </td>
                            {showNextFullService && (
                              <td>
                                {item.serviceType === 'oil' && item.fullService
                                  ? Number(item.serviceHrs) + 3000
                                  : '-'}
                              </td>
                            )}
                          </>
                        )}

                        {/* Tyre columns */}
                        {showTyreCols && (
                          <>
                            <td>{item.location || '-'}</td>
                            <td>{item.serviceType === 'tyre' ? item.tyreModel : '-'}</td>
                          </>
                        )}

                        {/* Battery columns */}
                        {showBatteryCols && (
                          <td>{item.serviceType === 'battery' ? item.batteryModel : '-'}</td>
                        )}

                        {/* Remarks */}
                        <td style={{ textAlign: 'left' }} className="remarks-cell">
                          <RemarksCell item={item} remarkKey={remarkKey} />
                        </td>

                        {/* View Document */}
                        <td className="document-column">
                          <Button
                            {...TABLE_BTN}
                            text="View Document"
                            onClick={() => handleRowClick(formatDate(item.date), item.serviceType, item._id)}
                            colorScheme="sky-800"
                            textColor="white-200"
                          />
                        </td>

                        {/* Delete */}
                        <td className="document-column">
                          <Button
                            {...TABLE_BTN}
                            text="Delete"
                            onClick={() => onDeleteReport(item)}
                            colorScheme="red-700"
                            textColor="white-200"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })
          ) : (
            <tr>
              <td colSpan="11" className="no-results">
                No service records found for the selected period
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ServiceTable;