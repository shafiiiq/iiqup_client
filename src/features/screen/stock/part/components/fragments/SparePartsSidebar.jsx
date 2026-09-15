import React from 'react';
import Sidebar, { SidebarSection, SidebarRow, SidebarTable, SidebarActions, SidebarBarcode } from '@/shared/components/widgets/sidebar/Sidebar';

function SparePartsSidebar({
  show,
  selectedStock,
  isMinimized,
  isMaximized,
  onClose,
  onMinimize,
  onMaximize,

  calculateStatus,
  formatDate,

  onEditStock,
  onAddStock,
  onReduceStock,
  onDeleteStock,
}) {
  return (
    <Sidebar
      show={show}
      title={selectedStock ? selectedStock.product : ''}
      onClose={onClose}
      onMinimize={onMinimize}
      onMaximize={onMaximize}
      isMinimized={isMinimized}
      isMaximized={isMaximized}
      trafficLightSize="30px"
      backButtonSize="40px"
      colorScheme="primary-900"
      variant="gradient"
      width="800px"
      squircle="6xl"
      titleSize="15xl"
      titleFontWeight="500"
    >
      {({ pushScreen }) => selectedStock && (
        <>
          <SidebarSection title="Stock Info" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <SidebarRow label="Type"         value={String(selectedStock.type)}        labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius="130px" />
            <SidebarRow label="Product"      value={String(selectedStock.product)}     labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius="130px" />
            <SidebarRow label="Part Number"  value={String(selectedStock.serialNumber)} labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius="130px" />
            <SidebarRow label="Date"         value={formatDate(selectedStock.date)}    labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius="130px" />
            <SidebarRow label="Rate"         value={String(selectedStock.rate)}        labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius="130px" />
            <SidebarRow label="Stock Count"  value={String(selectedStock.stockCount)}  labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius="130px" />
            <SidebarRow
              label="Status"
              value={
                calculateStatus(selectedStock.stockCount) === 'available' ? 'In Stock' :
                calculateStatus(selectedStock.stockCount) === 'low' ? 'Low Stock' : 'Out of Stock'
              }
              labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius="130px"
            />
            {selectedStock.hasSubUnits && (
              <>
                <SidebarRow label="Sub-Unit"       value={String(selectedStock.subUnitName)}                                labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius="130px" />
                <SidebarRow label="Capacity"       value={`${selectedStock.subUnitCapacity} ${selectedStock.subUnitName}`}  labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius="130px" />
                <SidebarRow label="Open Remaining" value={`${selectedStock.subUnitRemaining} ${selectedStock.subUnitName}`} labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius="130px" />
              </>
            )}
          </SidebarSection>

          {selectedStock.equipments && selectedStock.equipments.length > 0 && (
            <SidebarSection title="Associated Equipment(s)" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
              <SidebarTable
                rowGap="5px" headFontSize="20px" headFontWeight="500" gap="10px"
                headRadius="130px" rowRadius="130px" rowFontSize="18px" squircle={true}
                headColor="var(--white-200)" rowColor="white-200"
                headColorGrad="white-200" rowColorGrad="white-200"
                headGrad="primary-500" headGradVariant="gradient"
                rowGrad="primary-700" rowGradVariant="gradient"
                rowAltGrad="primary-700" rowAltGradVariant="gradient"
                columns={[
                  { key: 'sl', label: '#', flex: 1 },
                  { key: 'name', label: 'Equipment', flex: 4 },
                ]}
                rows={selectedStock.equipments.map((eq, i) => ({
                  sl: String(i + 1),
                  name: eq,
                }))}
              />
            </SidebarSection>
          )}

          <SidebarSection title="Barcode" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <SidebarBarcode value={selectedStock._id} width={2} height={60} displayValue={true} fontSize={14} squircle={true} radius="130px" colorScheme="black-200" lineColor="#ffffff" />
          </SidebarSection>

          <SidebarSection title="Stock Movement History" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <SidebarTable
              rowGap="5px" headFontSize="20px" headFontWeight="500" gap="10px"
              headRadius="130px" rowRadius="130px" rowFontSize="14px" squircle={true}
              headColor="var(--white-200)" rowColor="white-200"
              headColorGrad="white-200" rowColorGrad="white-200"
              headGrad="primary-400" headGradVariant="gradient"
              rowGrad="primary-600" rowGradVariant="gradient"
              rowAltGrad="primary-600" rowAltGradVariant="gradient"
              columns={[
                { key: 'date',    label: 'Date',    flex: 2 },
                { key: 'action',  label: 'Action',  flex: 1 },
                { key: 'prev',    label: 'Prev',    flex: 1, align: 'center' },
                { key: 'change',  label: 'Change',  flex: 1, align: 'center' },
                { key: 'newQty',  label: 'New',     flex: 1, align: 'center' },
                { key: 'who',     label: 'Who/Reason', flex: 2 },
                { key: 'regNo',   label: 'Reg No',  flex: 1 },
              ]}
              rows={selectedStock.movements && selectedStock.movements.length > 0
                ? [...selectedStock.movements].reverse().map((m) => ({
                    date:   formatDate(m.date),
                    action: m.type.charAt(0).toUpperCase() + m.type.slice(1),
                    prev:   String(m.previousQuantity),
                    change: (m.type === 'add' ? '+' : '-') + m.quantity,
                    newQty: String(m.newQuantity),
                    who:    m.mechanicName || m.reason || 'N/A',
                    regNo:  m.equipmentNumber || 'N/A',
                  }))
                : []
              }
            />
          </SidebarSection>

          <SidebarSection title="Actions" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <SidebarActions
              position="left"
              gap="8px"
              buttons={[
                { label: 'Edit Stock',   onClick: onEditStock,   colorScheme: 'primary-600', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '45px', width: '24%' },
                { label: 'Add Stock',    onClick: onAddStock,    colorScheme: 'primary-700', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '45px', width: '24%' },
                { label: 'Reduce Stock', onClick: onReduceStock, colorScheme: 'primary-500', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '45px', width: '24%' },
                { label: 'Delete Stock', onClick: onDeleteStock, colorScheme: 'primary-800', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '45px', width: '24%' },
              ]}
            />
          </SidebarSection>
        </>
      )}
    </Sidebar>
  );
}

export default SparePartsSidebar;