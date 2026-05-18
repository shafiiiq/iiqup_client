// ─────────────────────────────────────────────────────────────────────────────
// EquipmentSidebar.jsx — Slide-in panel with three content modes:
//   'details'   — equipment info + operator/site actions
//   'operators' — full certificationBody history table
//   'fuels'     — fuel consumption summary + breakdowns
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import Sidebar, { SidebarSection, SidebarRow, SidebarTable, SidebarActions } from '../../../Common/Sidebar/Sidebar';
import { getOperatorName, formatDate, formatDateWithExpiry } from '../utils/equipmentHelpers';

function EquipmentSidebar({
  show, title, content, isLoading, isSelectMode,
  onClose, onViewDetails, onReplaceOperator,
  onSetContent, onSetTitle, onViewFuels,
}) {
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [isMaximized, setIsMaximized] = React.useState(false);

  const renderContent = ({ pushScreen }) => {
    if (!content) return null;

    const item = content.data;

    if (content.type === 'details') {
      const istimaraInfo = formatDateWithExpiry(item.istimaraExpiry);
      return (
        <>
          <SidebarSection title="Basic Information" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <SidebarRow label="Machine"         value={String(item.machine || '')}  labelFontSize="22px" valueFontSize="24px" colorScheme="gray-700" variant="gradient" squircle={true} radius="130px" />
            <SidebarRow label="Registration No" value={String(item.regNo || '')}    labelFontSize="22px" valueFontSize="24px" colorScheme="gray-700" variant="gradient" squircle={true} radius="130px" />
            <SidebarRow label="Brand"           value={String(item.brand || '')}    labelFontSize="22px" valueFontSize="24px" colorScheme="gray-700" variant="gradient" squircle={true} radius="130px" />
            <SidebarRow label="Year"            value={String(item.year || '')}     labelFontSize="22px" valueFontSize="24px" colorScheme="gray-700" variant="gradient" squircle={true} radius="130px" />
            <SidebarRow label="Company"         value={String(item.company || '')}  labelFontSize="22px" valueFontSize="24px" colorScheme="gray-700" variant="gradient" squircle={true} radius="130px" />
            <SidebarRow label="Status"          value={String(item.status || '')}   labelFontSize="22px" valueFontSize="24px" colorScheme="gray-700" variant="gradient" squircle={true} radius="130px" />
          </SidebarSection>

          <SidebarSection title="Location & Assignment" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <SidebarRow
              label="Site"
              value={String(item.site?.at(-1) || 'N/A')}
              labelFontSize="22px" valueFontSize="24px"
              colorScheme="gray-700" variant="gradient" squircle={true} radius="130px"
              action={!isSelectMode ? { label: 'Replace Site', onClick: () => onViewDetails(item), colorScheme: 'rose-700', textColor: 'white-200', squircle: '4xl', font: 'lg', height: '40px' } : null}
            />
            <SidebarRow
              label="Current Operator"
              value={String(getOperatorName(item.certificationBody) || 'N/A')}
              labelFontSize="22px" valueFontSize="24px"
              colorScheme="gray-700" variant="gradient" squircle={true} radius="130px"
              action={!isSelectMode ? { label: 'Replace Operator', onClick: (e) => onReplaceOperator(e, item), colorScheme: 'violet-500', textColor: 'black-200', squircle: '4xl', font: 'lg', height: '40px' } : null}
            />
            {item.lastCertificationBody?.length > 0 && (
              <SidebarRow
                label="All Operators"
                value={`${item.lastCertificationBody.length + 1} total`}
                labelFontSize="22px" valueFontSize="24px"
                colorScheme="gray-700" variant="gradient" squircle={true} radius="130px"
                action={!isSelectMode ? {
                  label: `View All (${item.lastCertificationBody.length + 1})`,
                  onClick: (e) => {
                    e.stopPropagation();
                    pushScreen({
                      title: 'All Operators',
                      content: (
                        <SidebarSection title="All Operators" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
                          <SidebarTable
                            rowGap="5px" headFontSize="20px" headFontWeight="500" gap="10px"
                            headRadius="130px" rowRadius="130px" rowFontSize="18px" squircle={true}
                            headColor="var(--white-200)" rowColor="var(--black-200)"
                            headGrad="red-600" headGradVariant="gradient"
                            rowGrad="gray-600" rowGradVariant="gradient"
                            rowAltGrad="gray-500" rowAltGradVariant="gradient"
                            columns={[
                              { key: 'sl', label: 'SL No', flex: 1 },
                              { key: 'name', label: 'Operator Name', flex: 3 },
                            ]}
                            rows={[...item.certificationBody, ...item.lastCertificationBody].map((op, i) => ({
                              sl: String(i + 1),
                              name: typeof op === 'string' ? op.toUpperCase() : op?.operatorName?.toUpperCase() || 'N/A',
                            }))}
                          />
                        </SidebarSection>
                      )
                    });
                  },
                  colorScheme: 'gray-500', textColor: 'black-200', squircle: '4xl', font: 'lg', height: '40px'
                } : null}
              />
            )}
          </SidebarSection>

          <SidebarSection title="Mobilization History" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            {item.mobDate ? (
              <SidebarRow
                label="Last Mobilized"
                value={new Date(item.mobDate).toLocaleDateString('en-GB')}
                labelFontSize="22px" valueFontSize="24px"
                colorScheme="gray-700" variant="gradient" squircle={true} radius="130px"
                action={item.lastMobDate?.length > 0 && !isSelectMode ? {
                  label: `View All (${item.lastMobDate.length + 1})`,
                  onClick: () => pushScreen({
                    title: 'Mobilization History',
                    content: (
                      <SidebarSection title="Mobilization History" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
                        <SidebarTable
                          rowGap="5px" headFontSize="20px" headFontWeight="500" gap="10px"
                          headRadius="130px" rowRadius="130px" rowFontSize="18px" squircle={true}
                          headColor="var(--white-200)" rowColor="var(--black-200)"
                          headGrad="red-600" headGradVariant="gradient"
                          rowGrad="gray-600" rowGradVariant="gradient"
                          rowAltGrad="gray-500" rowAltGradVariant="gradient"
                          columns={[{ key: 'sl', label: 'SL No', flex: 1 }, { key: 'date', label: 'Date', flex: 3 }]}
                          rows={[item.mobDate, ...item.lastMobDate].sort((a, b) => new Date(b) - new Date(a)).map((d, i) => ({
                            sl: String(i + 1),
                            date: new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
                          }))}
                        />
                      </SidebarSection>
                    )
                  }),
                  colorScheme: 'lime-500', textColor: 'black-200', squircle: '4xl', font: 'lg', height: '40px'
                } : null}
              />
            ) : (
              <SidebarRow label="Mobilized" value="No mobilization history" labelFontSize="22px" valueFontSize="24px" colorScheme="gray-700" variant="gradient" squircle={true} radius="130px" />
            )}
            {item.demobDate ? (
              <SidebarRow
                label="Last Demobilized"
                value={new Date(item.demobDate).toLocaleDateString('en-GB')}
                labelFontSize="22px" valueFontSize="24px"
                colorScheme="gray-700" variant="gradient" squircle={true} radius="130px"
                action={item.lastDemobDate?.length > 0 && !isSelectMode ? {
                  label: `View All (${item.lastDemobDate.length + 1})`,
                  onClick: () => pushScreen({
                    title: 'Demobilization History',
                    content: (
                      <SidebarSection title="Demobilization History" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
                        <SidebarTable
                          rowGap="5px" headFontSize="20px" headFontWeight="500" gap="10px"
                          headRadius="130px" rowRadius="130px" rowFontSize="18px" squircle={true}
                          headColor="var(--white-200)" rowColor="var(--black-200)"
                          headGrad="red-600" headGradVariant="gradient"
                          rowGrad="gray-600" rowGradVariant="gradient"
                          rowAltGrad="gray-500" rowAltGradVariant="gradient"
                          columns={[{ key: 'sl', label: 'SL No', flex: 1 }, { key: 'date', label: 'Date', flex: 3 }]}
                          rows={[item.demobDate, ...item.lastDemobDate].sort((a, b) => new Date(b) - new Date(a)).map((d, i) => ({
                            sl: String(i + 1),
                            date: new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
                          }))}
                        />
                      </SidebarSection>
                    )
                  }),
                  colorScheme: 'fuchsia-500', textColor: 'black-200', squircle: '4xl', font: 'lg', height: '40px'
                } : null}
              />
            ) : (
              <SidebarRow label="Demobilized" value="No demobilization history" labelFontSize="22px" valueFontSize="24px" colorScheme="gray-700" variant="gradient" squircle={true} radius="130px" />
            )}
          </SidebarSection>

          <SidebarSection title="Expiry Information" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <SidebarRow label="Istimara Expiry"  value={istimaraInfo.formattedDate || 'N/A'} labelFontSize="22px" valueFontSize="24px" colorScheme="gray-700" variant="gradient" squircle={true} radius="130px" />
            <SidebarRow label="Insurance Expiry" value={String(item.insuranceExpiry || 'N/A')} labelFontSize="22px" valueFontSize="24px" colorScheme="gray-700" variant="gradient" squircle={true} radius="130px" />
            <SidebarRow label="TPC Expiry"       value={String(item.tpcExpiry || 'N/A')}       labelFontSize="22px" valueFontSize="24px" colorScheme="gray-700" variant="gradient" squircle={true} radius="130px" />
          </SidebarSection>

          <SidebarSection title="Actions" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <SidebarActions
              position="left"
              gap="8px"
              buttons={[
                { label: 'View Fuel Consumption', onClick: (e) => onViewFuels(e, item.regNo), colorScheme: 'blue-600', textColor: 'white-200', squircle: '6xl', font: 'xl', height: '45px' },
              ]}
            />
          </SidebarSection>
        </>
      );
    }

    if (content.type === 'operators') {
      return (
        <SidebarSection title="All Operators" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
          <SidebarTable
            rowGap="5px" headFontSize="20px" headFontWeight="500" gap="10px"
            headRadius="130px" rowRadius="130px" rowFontSize="18px" squircle={true}
            headColor="var(--white-200)" rowColor="var(--black-200)"
            headGrad="red-600" headGradVariant="gradient"
            rowGrad="gray-600" rowGradVariant="gradient"
            rowAltGrad="gray-500" rowAltGradVariant="gradient"
            columns={[
              { key: 'sl', label: 'SL No', flex: 1 },
              { key: 'name', label: 'Operator Name', flex: 3 },
            ]}
            rows={content.data.map((op, i) => ({
              sl: String(i + 1),
              name: typeof op === 'string' ? op.toUpperCase() : op?.operatorName?.toUpperCase() || 'N/A',
            }))}
          />
        </SidebarSection>
      );
    }

    if (content.type === 'fuels') {
      if (!content.data.length) return (
        <SidebarSection title="Fuel Consumption" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
          <SidebarRow label="Data" value="No fuel consumption data available." labelFontSize="22px" valueFontSize="24px" colorScheme="gray-700" variant="gradient" squircle={true} radius="130px" />
        </SidebarSection>
      );
      const fuelData = content.data[0];
      return (
        <>
          <SidebarSection title="Fuel Consumption Summary" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <SidebarRow label="Total Liters"       value={`${fuelData.totalLiters || 0} L`}        labelFontSize="22px" valueFontSize="24px" colorScheme="gray-700" variant="gradient" squircle={true} radius="130px" />
            <SidebarRow label="Total Amount"       value={`SAR ${fuelData.totalAmount || 0}`}       labelFontSize="22px" valueFontSize="24px" colorScheme="gray-700" variant="gradient" squircle={true} radius="130px" />
            <SidebarRow label="Total Transactions" value={String(fuelData.totalTransactions || 0)}  labelFontSize="22px" valueFontSize="24px" colorScheme="gray-700" variant="gradient" squircle={true} radius="130px" />
          </SidebarSection>

          {fuelData.productBreakdown && Object.keys(fuelData.productBreakdown).length > 0 && (
            <SidebarSection title="Product Breakdown" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
              <SidebarTable
                rowGap="5px" headFontSize="20px" headFontWeight="500" gap="10px"
                headRadius="130px" rowRadius="130px" rowFontSize="16px" squircle={true}
                headColor="var(--white-200)" rowColor="var(--black-200)"
                headGrad="red-600" headGradVariant="gradient"
                rowGrad="gray-600" rowGradVariant="gradient"
                rowAltGrad="gray-500" rowAltGradVariant="gradient"
                columns={[
                  { key: 'product', label: 'Product', flex: 2 },
                  { key: 'liters',  label: 'Liters',  flex: 1, align: 'center' },
                  { key: 'amount',  label: 'Amount',  flex: 1, align: 'center' },
                  { key: 'count',   label: 'Count',   flex: 1, align: 'center' },
                ]}
                rows={Object.entries(fuelData.productBreakdown).map(([product, d]) => ({
                  product,
                  liters:  `${d.liters || 0} L`,
                  amount:  `SAR ${d.amount || 0}`,
                  count:   String(d.count || 0),
                }))}
              />
            </SidebarSection>
          )}

          {fuelData.transactions?.length > 0 && (
            <SidebarSection title="Station Breakdown" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
              <SidebarTable
                rowGap="5px" headFontSize="20px" headFontWeight="500" gap="10px"
                headRadius="130px" rowRadius="130px" rowFontSize="14px" squircle={true}
                headColor="var(--white-200)" rowColor="var(--black-200)"
                headGrad="red-600" headGradVariant="gradient"
                rowGrad="gray-600" rowGradVariant="gradient"
                rowAltGrad="gray-500" rowAltGradVariant="gradient"
                columns={[
                  { key: 'date',      label: 'Date',       flex: 2 },
                  { key: 'station',   label: 'Station',    flex: 2 },
                  { key: 'liters',    label: 'Liters',     flex: 1, align: 'center' },
                  { key: 'amount',    label: 'Amount',     flex: 1, align: 'center' },
                  { key: 'unitPrice', label: 'Unit Price', flex: 1, align: 'center' },
                ]}
                rows={fuelData.transactions.slice().reverse().map(d => ({
                  date:      formatDate(d.transactionDate),
                  station:   d.stationName,
                  liters:    `${d.liter || 0} L`,
                  amount:    `SAR ${d.totalAmount || 0}`,
                  unitPrice: String(d.unitPrice || 0),
                }))}
              />
            </SidebarSection>
          )}
        </>
      );
    }

    if (content.type === 'mob-history' || content.type === 'demob-history') {
      const sorted = [...content.data].sort((a, b) => new Date(b) - new Date(a));
      return (
        <SidebarSection title={content.type === 'mob-history' ? 'Mobilization History' : 'Demobilization History'} gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
          <SidebarTable
            rowGap="5px" headFontSize="20px" headFontWeight="500" gap="10px"
            headRadius="130px" rowRadius="130px" rowFontSize="18px" squircle={true}
            headColor="var(--white-200)" rowColor="var(--black-200)"
            headGrad="red-600" headGradVariant="gradient"
            rowGrad="gray-600" rowGradVariant="gradient"
            rowAltGrad="gray-500" rowAltGradVariant="gradient"
            columns={[{ key: 'sl', label: 'SL No', flex: 1 }, { key: 'date', label: 'Date', flex: 3 }]}
            rows={sorted.map((d, i) => ({
              sl: String(i + 1),
              date: new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
            }))}
          />
        </SidebarSection>
      );
    }

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
      trafficLightSize="30px"
      backButtonSize="40px"
      colorScheme="gray-700"
      variant="gradient"
      width="800px"
      squircle="6xl"
      titleSize="15xl"
      titleFontWeight="500"
    >
      {({ pushScreen }) => renderContent({ pushScreen })}
    </Sidebar>
  );
}

export default EquipmentSidebar;