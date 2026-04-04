// ─────────────────────────────────────────────────────────────────────────────
// EquipmentSidebar.jsx — Slide-in panel with three content modes:
//   'details'   — equipment info + operator/site actions
//   'operators' — full certificationBody history table
//   'fuels'     — fuel consumption summary + breakdowns
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import Button              from '../../../Common/Button/Button';
import Sidebar from '../../../Common/Sidebar/Sidebar';
import { getOperatorName, formatDate, formatDateWithExpiry } from '../utils/equipmentHelpers';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-renderers — one function per content type for clarity
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Equipment details panel — basic info, location, expiry dates, actions.
 */
function DetailsContent({
  item,
  isSelectMode,
  onViewDetails,
  onReplaceOperator,
  onViewAllOperators,
  onViewFuels,
  onSetContent,
  onSetTitle,
}) {
  const istimaraInfo = formatDateWithExpiry(item.istimaraExpiry);

  return (
    <div className="details-section">
      <h3>Basic Information</h3>
      <div className="details-list">
        {[
          ['Machine',         item.machine],
          ['Registration No', item.regNo],
          ['Brand',           item.brand],
          ['Year',            item.year],
          ['Company',         item.company],
        ].map(([label, value]) => (
          <div className="detail-row" key={label}>
            <span className="detail-row-label">{label}</span>
            <span className="detail-row-value">{value}</span>
          </div>
        ))}
        <div className="detail-row">
          <span className="detail-row-label">Status</span>
          <span className="detail-row-value">
            <span className={`status-badge ${item.status?.toLowerCase()}`}>{item.status}</span>
          </span>
        </div>
      </div>

      <h3>Location & Assignment</h3>
      <div className="details-list">
        <div className="detail-row-actions">
          <div className="detail-row">
            <span className="detail-row-label">Site</span>
            <span className="detail-row-value">{item.site?.at(-1) || 'N/A'}</span>
          </div>
          {!isSelectMode && (
            <Button
              text="Replace Site"
              onClick={() => onViewDetails(item)}
              colorScheme="rose-700" variant="gradient" font="xl" animation=""
              squircle="4xl" width="170px" height="58px" type="submit"
              textColor="white-200" shadowPosition="to-bottom" shadowColor="white-600"
            />
          )}
        </div>

        <div className="detail-row-actions">
          <div className="detail-row">
            <span className="detail-row-label">Current Operator</span>
            <span className="detail-row-value">{getOperatorName(item.certificationBody)}</span>
          </div>
          {!isSelectMode && (
            <Button
              text="Replace Operator"
              onClick={(e) => onReplaceOperator(e, item)}
              colorScheme="violet-500" variant="gradient" font="xl"
              squircle="4xl" width="200px" height="58px"
              textColor="black-200" shadowPosition="to-bottom" shadowColor="white-600"
            />
          )}
        </div>

        {item.lastCertificationBody?.length > 0 && (
          <div className="detail-row-actions">
            <div className="detail-row">
              <span className="detail-row-label">All Operators</span>
            </div>
            {!isSelectMode && (
              <Button
                text={`View All (${item.lastCertificationBody.length + 1})`}
                onClick={(e) => onViewAllOperators(e, [...item.certificationBody, ...item.lastCertificationBody])}
                colorScheme="amber-500" variant="gradient" font="xl"
                squircle="4xl" width="160px" height="58px"
                textColor="black-200" shadowPosition="to-bottom" shadowColor="white-600"
              />
            )}
          </div>
        )}
      </div>

      <h3>Mobilization History</h3>
      <div className="details-list">
        {item.mobDate ? (
          <div className="detail-row-actions">
            <div className="detail-row">
              <span className="detail-row-label">Last Mobilized</span>
              <span className="detail-row-value">{new Date(item.mobDate).toLocaleDateString('en-GB')}</span>
            </div>
            {item.lastMobDate?.length > 0 && !isSelectMode && (
              <Button
                text={`View All (${item.lastMobDate.length + 1})`}
                onClick={() => {
                  onSetContent({ type: 'mob-history', data: [item.mobDate, ...item.lastMobDate] });
                  onSetTitle('Mobilization History');
                }}
                colorScheme="lime-500" variant="gradient" font="xl"
                squircle="4xl" width="160px" height="58px"
                textColor="black-200" shadowPosition="to-bottom" shadowColor="white-600"
              />
            )}
          </div>
        ) : (
          <div className="detail-row">
            <span className="detail-row-value">No mobilization history</span>
          </div>
        )}
        {item.demobDate ? (
          <div className="detail-row-actions">
            <div className="detail-row">
              <span className="detail-row-label">Last Demobilized</span>
              <span className="detail-row-value">{new Date(item.demobDate).toLocaleDateString('en-GB')}</span>
            </div>
            {item.lastDemobDate?.length > 0 && !isSelectMode && (
              <Button
                text={`View All (${item.lastDemobDate.length + 1})`}
                onClick={() => {
                  onSetContent({ type: 'demob-history', data: [item.demobDate, ...item.lastDemobDate] });
                  onSetTitle('Demobilization History');
                }}
                colorScheme="fuchsia-500" variant="gradient" font="xl"
                squircle="4xl" width="160px" height="58px"
                textColor="black-200" shadowPosition="to-bottom" shadowColor="white-600"
              />
            )}
          </div>
        ) : (
          <div className="detail-row">
            <span className="detail-row-value">No demobilization history</span>
          </div>
        )}
      </div>

      <h3>Expiry Information</h3>
      <div className="details-list">
        <div className="detail-row">
          <span className="detail-row-label">Istimara Expiry</span>
          <span className="detail-row-value">
            {istimaraInfo.formattedDate || 'N/A'}
            {istimaraInfo.isExpired && <span className="expired-label">expired</span>}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-row-label">Insurance Expiry</span>
          <span className="detail-row-value">{item.insuranceExpiry || 'N/A'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-row-label">TPC Expiry</span>
          <span className="detail-row-value">{item.tpcExpiry || 'N/A'}</span>
        </div>
      </div>

      <h3>Actions</h3>
      <div className="details-list">
        <Button
          text="View Fuel Consumption"
          onClick={(e) => onViewFuels(e, item.regNo)}
          colorScheme="blue-600" variant="gradient" font="md" animation=""
          squircle="4xl" width="fit-content" height="58px" type="submit"
          textColor="white-200" shadowPosition="to-bottom" shadowColor="white-600"
        />
      </div>
    </div>
  );
}

/**
 * Operator history table — lists every entry in certificationBody.
 */
function OperatorsContent({ operators }) {
  return (
    <div className="operators-list">
      <table className="operators-table">
        <thead>
          <tr>
            <th>SL No</th>
            <th>Operator Name</th>
          </tr>
        </thead>
        <tbody>
          {operators.map((op, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                {typeof op === 'string'
                  ? op.toUpperCase()
                  : op?.operatorName?.toUpperCase() || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Fuel consumption summary with product breakdown and transaction history.
 */
function FuelsContent({ data }) {
  if (!data.length) return <p>No fuel consumption data available.</p>;

  const fuelData = data[0];

  return (
    <div className="fuels-list">
      <div className="fuel-summary">
        <h3>Fuel Consumption Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Total Liters:</span>
            <span className="summary-value">{fuelData.totalLiters || 0} L</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Amount:</span>
            <span className="summary-value">SAR {fuelData.totalAmount || 0}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Transactions:</span>
            <span className="summary-value">{fuelData.totalTransactions || 0}</span>
          </div>
        </div>
      </div>

      {fuelData.productBreakdown && Object.keys(fuelData.productBreakdown).length > 0 && (
        <div className="breakdown-section">
          <h4>Product Breakdown</h4>
          <table className="breakdown-table">
            <thead>
              <tr><th>Product</th><th>Liters</th><th>Amount</th><th>Count</th></tr>
            </thead>
            <tbody>
              {Object.entries(fuelData.productBreakdown).map(([product, d], i) => (
                <tr key={i}>
                  <td>{product}</td>
                  <td>{d.liters || 0} L</td>
                  <td>SAR {d.amount || 0}</td>
                  <td>{d.count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {fuelData.transactions?.length > 0 && (
        <div className="breakdown-section">
          <h4>Station Breakdown</h4>
          <table className="breakdown-table">
            <thead>
              <tr><th>Date</th><th>Station</th><th>Liters</th><th>Amount</th><th>Unit Price</th></tr>
            </thead>
            <tbody>
              {fuelData.transactions.slice().reverse().map((d, i) => (
                <tr key={i}>
                  <td>{formatDate(d.transactionDate)}</td>
                  <td>{d.stationName}</td>
                  <td>{d.liter || 0} L</td>
                  <td>SAR {d.totalAmount || 0}</td>
                  <td>{d.unitPrice || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Mobilizaton history.
 */
function MobHistoryContent({ dates }) {
  const sorted = [...dates].sort((a, b) => new Date(b) - new Date(a));
  return (
    <div className="operators-list">
      <table className="operators-table">
        <thead>
          <tr>
            <th>SL No</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   show:               boolean,
 *   title:              string,
 *   content:            { type: 'details'|'operators'|'fuels', data: any } | null,
 *   isLoading:          boolean,
 *   isSelectMode:       boolean,
 *   onClose:            () => void,
 *   onViewDetails:      (equipment) => void,
 *   onReplaceOperator:  (e, equipment) => void,
 *   onSetContent:       (content) => void,
 *   onSetTitle:         (title) => void,
 *   onViewFuels:        (e, regNo) => void,
 * }} props
 */
function EquipmentSidebar({
  show, title, content, isLoading, isSelectMode,
  onClose, onViewDetails, onReplaceOperator,
  onSetContent, onSetTitle, onViewFuels,
}) {
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [isMaximized, setIsMaximized] = React.useState(false);

  const renderContent = () => {
    if (!content) return null;
    if (content.type === 'details') {
      return (
        <DetailsContent
          item={content.data}
          isSelectMode={isSelectMode}
          onViewDetails={onViewDetails}
          onReplaceOperator={onReplaceOperator}
          onViewAllOperators={(e, certificationBody) => {
            e.stopPropagation();
            onSetContent({ type: 'operators', data: certificationBody });
            onSetTitle('All Operators');
          }}
          onViewFuels={onViewFuels}
          onSetContent={onSetContent}
          onSetTitle={onSetTitle}
        />
      );
    }
    if (content.type === 'operators')     return <OperatorsContent operators={content.data} />;
    if (content.type === 'fuels')         return <FuelsContent data={content.data} />;
    if (content.type === 'mob-history')   return <MobHistoryContent dates={content.data} />;
    if (content.type === 'demob-history') return <MobHistoryContent dates={content.data} />;
    return null;
  };

  return (
      <Sidebar
        show={show}
        title={title}
        onClose={onClose}
        isLoading={isLoading}
        isMinimized={isMinimized}
        isMaximized={isMaximized}
        onMinimize={() => setIsMinimized(p => !p)}
        onMaximize={() => { setIsMaximized(p => !p); setIsMinimized(false); }}
        colorScheme="amber-800"
        variant="gradient"
        width="800px"
        squircle="6xl"
        titleSize="2xl"
        titleFontWeight="600"
      >
      {renderContent()}
    </Sidebar>
  );
}

export default EquipmentSidebar;