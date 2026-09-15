import React from 'react';
import Button from '@/shared/components/widgets/button/Button';
import Text from '@/shared/components/widgets/text/Text';
import Sidebar, { SidebarSection, SidebarRow, SidebarTable, SidebarActions, SidebarInput, SidebarBarcode } from '@/shared/components/widgets/sidebar/Sidebar';
import { calculateStatus, getUniqueValues } from '../../helper/stock.toolkit.helper';

const STATUS_LABEL = {
  available: 'In Stock',
  low: 'Low Stock',
  out: 'Out of Stock',
};

function ToolkitSidebar({
  show,
  selectedToolkit,
  isMinimized,
  isMaximized,
  onClose,
  onMinimize,
  onMaximize,

  variantSearchTerm,
  variantFilterSize,
  variantFilterColor,
  variantFilterStatus,
  onVariantSearchChange,
  onVariantFilterSizeChange,
  onVariantFilterColorChange,
  onVariantFilterStatusChange,
  onClearVariantFilters,

  getFilteredAndGroupedVariants,
  onVariantRowClick,
  onEditVariant,
  onDeleteVariant,

  onEditToolkit,
  onAddVariant,
  onPrintBarcode,
  onDeleteToolkit,
}) {
  return (
    <Sidebar
      show={show}
      title={selectedToolkit ? `${selectedToolkit.name}` : ''}
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
      {({ pushScreen }) => selectedToolkit && (
        <>
          <SidebarSection title="Toolkit Info" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <SidebarRow label="Tool Name"   value={selectedToolkit.name}               labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius="130px" />
            <SidebarRow label="Type"        value={selectedToolkit.type}               labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius="130px" />
            <SidebarRow label="Total Stock" value={String(selectedToolkit.totalStock)} labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius="130px" />
            <SidebarRow
              label="Status"
              value={STATUS_LABEL[selectedToolkit.overallStatus] || 'Out of Stock'}
              labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius="130px"
            />
          </SidebarSection>

          <SidebarSection title="Barcode" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <SidebarBarcode value={selectedToolkit._id} width={2.53} height={60} displayValue={true} fontSize={14} squircle={true} radius="130px" colorScheme="black-200" lineColor="#ffffff" />
          </SidebarSection>

          <SidebarSection title="Variants" gap="8px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <SidebarInput
              type="search"
              value={variantSearchTerm}
              onChange={onVariantSearchChange}
              placeholder="Search size or color"
              iconRight="search"
              colorScheme="primary-400"
              variant="gradient"
              textColor="white-100"
              squircle="6xl"
              height="48px"
              width="100%"
              paddingInline="24px"
              placeholderColor="black-200"
            />
            <div className="stock toolkit variant-filter-row">
              <SidebarInput
                type="select"
                value={variantFilterSize}
                onChange={onVariantFilterSizeChange}
                options={getUniqueValues(selectedToolkit.variants, 'size')}
                colorScheme="primary-400"
                variant="gradient"
                textColor="black-100"
                paddingInline="24px"
                squircle="6xl"
                height="48px"
                width="208px"
              />
              <SidebarInput
                type="select"
                value={variantFilterColor}
                onChange={onVariantFilterColorChange}
                options={getUniqueValues(selectedToolkit.variants, 'color')}
                colorScheme="primary-400"
                variant="gradient"
                textColor="black-100"
                squircle="6xl"
                height="48px"
                width="208px"
              />
              <SidebarInput
                type="select"
                value={variantFilterStatus}
                onChange={onVariantFilterStatusChange}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'available', label: 'In Stock' },
                  { value: 'low', label: 'Low Stock' },
                  { value: 'out', label: 'Out of Stock' },
                ]}
                colorScheme="primary-400"
                variant="gradient"
                textColor="black-100"
                squircle="6xl"
                height="48px"
                width="208px"
              />
              {(variantSearchTerm || variantFilterSize !== 'all' || variantFilterColor !== 'all' || variantFilterStatus !== 'all') && (
                <Button
                  text="Clear"
                  onClick={onClearVariantFilters}
                  colorScheme="primary-300"
                  variant="gradient"
                  textColor="black-200"
                  squircle="6xl"
                  font="lg"
                  height="48px"
                  width="auto"
                  padding="0 24px"
                  animation=""
                />
              )}
            </div>

            {Object.entries(getFilteredAndGroupedVariants(selectedToolkit.variants)).length > 0
              ? Object.entries(getFilteredAndGroupedVariants(selectedToolkit.variants)).map(([color, variants]) => (
                <SidebarSection key={color} title={color} gap="5px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
                  <SidebarTable
                    rowGap="5px"
                    headFontSize="20px"
                    headFontWeight="500"
                    gap="10px"
                    headRadius="130px"
                    rowRadius="130px"
                    rowFontSize="18px"
                    squircle={true}
                    headColor="var(--white-200)"
                    rowColor="white-200"
                    headColorGrad="white-200"
                    rowColorGrad="white-200"
                    headGrad="primary-500"
                    headGradVariant="gradient"
                    rowGrad="primary-700"
                    rowGradVariant="gradient"
                    rowAltGrad="primary-700"
                    rowAltGradVariant="gradient"
                    columns={[
                      { key: 'size', label: 'Size', flex: 1 },
                      { key: 'stock', label: 'Stock', flex: 1, align: 'center' },
                      { key: 'min', label: 'Min', flex: 1, align: 'center' },
                      { key: 'status', label: 'Status', flex: 1 },
                    ]}
                    actionPosition="right"
                    onRowClick={(row) => onVariantRowClick(row._variant, selectedToolkit, pushScreen)}
                    rows={variants.map((variant) => ({
                      _variant: variant,
                      size: variant.size,
                      stock: String(variant.stockCount),
                      min: String(variant.minStockLevel),
                      status: STATUS_LABEL[calculateStatus(variant.stockCount, variant.minStockLevel)] || 'Out of Stock',
                      _actions: [
                        { label: 'Edit', onClick: () => onEditVariant(variant, selectedToolkit), colorScheme: 'primary-300', textColor: 'black-200', squircle: '6xl', font: 'lg', height: '35px' },
                        { label: 'Delete', onClick: () => onDeleteVariant(selectedToolkit._id, variant._id), colorScheme: 'primary-800', textColor: 'white-100', squircle: '6xl', font: 'lg', height: '35px' },
                      ],
                    }))}
                  />
                </SidebarSection>
              ))
              : <Text variant="body" className="stock toolkit no-variants">No variants found.</Text>
            }
          </SidebarSection>

          <SidebarSection title="Actions" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <SidebarActions
              position="left"
              gap="8px"
              buttons={[
                { label: 'Edit Toolkit', onClick: () => onEditToolkit(selectedToolkit), colorScheme: 'primary-600', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '45px', width: '24%' },
                { label: 'Add Variant', onClick: () => onAddVariant(selectedToolkit), colorScheme: 'primary-700', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '45px', width: '24%' },
                { label: 'Print Barcode', onClick: onPrintBarcode, colorScheme: 'primary-500', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '45px', width: '24%' },
                { label: 'Delete Toolkit', onClick: () => onDeleteToolkit(selectedToolkit._id), colorScheme: 'primary-800', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '45px', width: '24%' },
              ]}
            />
          </SidebarSection>
        </>
      )}
    </Sidebar>
  );
}

export default ToolkitSidebar;