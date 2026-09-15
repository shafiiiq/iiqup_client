import React from 'react';
import Text from '@/shared/components/widgets/text/Text';
import Sidebar, { SidebarSection, SidebarRow, SidebarTable, SidebarActions } from '@/shared/components/widgets/sidebar/Sidebar';

const VERIFICATION_STATUS_TEXT = {
  active: 'Active',
  expired: 'Expired',
  pending: 'Operator is not verified',
};

const ROW_PROPS = {
  labelFontSize: '22px',
  valueFontSize: '24px',
  colorScheme: 'primary-700',
  variant: 'gradient',
  squircle: true,
  radius: '130px',
};

const withExpiry = (value, expired) => `${value}${expired ? ' (Expired)' : ''}`;

function OperatorSidebar({
  show,
  selectedOperatorView,
  isMinimized,
  isMaximized,
  onClose,
  onMinimize,
  onMaximize,
  onShowFullScreen,
  onProfilePicError,
  onEditOperator,
  onMobilizeOperator,
  onDemobilizeOperator,
  onDeleteOperator,
  formatDate,
  isExpired,
}) {
  const op = selectedOperatorView?.operator;
  const picUrl = selectedOperatorView?.picUrl;
  const status = selectedOperatorView?.status;
  const toolkitsReversed = selectedOperatorView?.toolkitsReversed || [];

  return (
    <Sidebar
      show={show}
      title={op ? op.name : ''}
      onClose={onClose}
      onMinimize={onMinimize}
      onMaximize={onMaximize}
      isMinimized={isMinimized}
      isMaximized={isMaximized}
      trafficLightSize="30px"
      backButtonSize="40px"
      colorScheme="primary-800"
      shadowColor="primary-400"
      shadowSize='20'
      variant="gradient"
      width="800px"
      squircle="6xl"
      titleSize="15xl"
      titleFontWeight="500"
    >
      {() => op && (
        <>
          <SidebarSection title="Profile" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <div
              className="profile-pic-large"
              onClick={() => onShowFullScreen(picUrl)}
              style={{ cursor: picUrl ? 'pointer' : 'default' }}
            >
              {picUrl && <img src={picUrl} alt={op.name} onError={onProfilePicError} />}
              <div className="profile-initials-large" style={{ display: picUrl ? 'none' : 'flex' }} />
            </div>
            <SidebarRow label="Qatar ID" value={op.qatarId} {...ROW_PROPS} />
            <SidebarRow label="Unique Code" value={op.uniqueCode} {...ROW_PROPS} />
            <SidebarRow label="Status" value={VERIFICATION_STATUS_TEXT[status] || 'Operator is not verified'} {...ROW_PROPS} />
            <SidebarRow label="Mobilization" value={op.status === 'mobilized' ? 'Mobilized' : 'Demobilized'} {...ROW_PROPS} />
          </SidebarSection>

          <SidebarSection title="Personal Information" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <SidebarRow label="Employee ID" value={String(op.id ?? 'N/A')} {...ROW_PROPS} />
            <SidebarRow label="Serial No" value={String(op.slNo ?? 'N/A')} {...ROW_PROPS} />
            <SidebarRow label="Nationality" value={op.nationality} {...ROW_PROPS} />
            <SidebarRow label="Date of Birth" value={formatDate(op.dob)} {...ROW_PROPS} />
            <SidebarRow label="Contact No" value={op.contactNo || 'N/A'} {...ROW_PROPS} />
            <SidebarRow label="Email" value={op.email || 'N/A'} {...ROW_PROPS} />
          </SidebarSection>

          <SidebarSection title="Employment Details" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <SidebarRow label="User Type" value={op.userType} {...ROW_PROPS} />
            <SidebarRow label="Sponsorship" value={op.sponsorship} {...ROW_PROPS} />
            <SidebarRow label="Working In" value={op.workingIn} {...ROW_PROPS} />
            <SidebarRow label="Date of Joining" value={formatDate(op.doj)} {...ROW_PROPS} />
            <SidebarRow label="Equipment Number" value={op.equipmentNumber || 'N/A'} {...ROW_PROPS} />
            <SidebarRow label="Site" value={op.site?.length ? op.site.join(', ') : 'N/A'} {...ROW_PROPS} />
            <SidebarRow label="Workmen Compensation" value={op.workmenCompensationAdded === 'yes' ? 'Yes' : 'No'} {...ROW_PROPS} />
          </SidebarSection>

          <SidebarSection title="Document Details" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <SidebarRow label="Passport No" value={op.passportNo || 'N/A'} {...ROW_PROPS} />
            <SidebarRow label="Passport Expiry" value={withExpiry(formatDate(op.passportExpiry), isExpired(op.passportExpiry))} {...ROW_PROPS} />
            <SidebarRow label="QID Expiry" value={withExpiry(formatDate(op.qidExpiry), isExpired(op.qidExpiry))} {...ROW_PROPS} />
            <SidebarRow label="Health Card Expiry" value={withExpiry(formatDate(op.healthCardExpiry), isExpired(op.healthCardExpiry))} {...ROW_PROPS} />
            <SidebarRow label="License Type" value={op.licenceType || 'N/A'} {...ROW_PROPS} />
            <SidebarRow label="License Expiry" value={withExpiry(formatDate(op.licenceExpiry), isExpired(op.licenceExpiry))} {...ROW_PROPS} />
            <SidebarRow label="Labour Contract Expiry" value={withExpiry(formatDate(op.labourContractExpiry), isExpired(op.labourContractExpiry))} {...ROW_PROPS} />
          </SidebarSection>

          <SidebarSection title="System Information" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <SidebarRow label="Verified" value={op.isVerified ? 'Yes' : 'No'} {...ROW_PROPS} />
            <SidebarRow label="Verified At" value={formatDate(op.verifiedAt)} {...ROW_PROPS} />
            <SidebarRow label="Last Mobilized" value={formatDate(op.mobDate)} {...ROW_PROPS} />
            <SidebarRow label="Last Demobilized" value={formatDate(op.demobDate)} {...ROW_PROPS} />
            <SidebarRow label="Created At" value={formatDate(op.createdAt)} {...ROW_PROPS} />
            <SidebarRow label="Last Updated" value={formatDate(op.updatedAt)} {...ROW_PROPS} />
            <SidebarRow label="Assigned Toolkits" value={String(op.toolkits?.length || 'None')} {...ROW_PROPS} />
          </SidebarSection>

          <SidebarSection title="Assigned Safety Items" gap="8px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            {toolkitsReversed.length > 0 ? (
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
                  { key: 'slNo', label: 'SL No', flex: 1, align: 'center' },
                  { key: 'date', label: 'Handovered Date', flex: 2 },
                  { key: 'name', label: 'Name', flex: 2 },
                  { key: 'color', label: 'Color', flex: 1 },
                  { key: 'quantity', label: 'Quantity', flex: 1, align: 'center' },
                ]}
                rows={toolkitsReversed.map((toolkit, i) => ({
                  slNo: String(toolkitsReversed.length - i),
                  date: formatDate(toolkit.assignedDate),
                  name: toolkit.toolkitName,
                  color: toolkit.color,
                  quantity: String(toolkit.quantity),
                }))}
              />
            ) : (
              <Text variant="body">No toolkits assigned.</Text>
            )}
          </SidebarSection>

          <SidebarSection title="Actions" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <SidebarActions
              position="left"
              gap="8px"
              buttons={[
                { label: 'Edit Operator', onClick: () => onEditOperator(op), colorScheme: 'primary-600', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '45px', width: '31%' },
                op.status === 'mobilized'
                  ? { label: 'Demobilize', onClick: () => onDemobilizeOperator(op), colorScheme: 'primary-800', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '45px', width: '31%' }
                  : { label: 'Mobilize', onClick: () => onMobilizeOperator(op), colorScheme: 'primary-700', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '45px', width: '31%' },
                { label: 'Delete Operator', onClick: () => onDeleteOperator(op), colorScheme: 'primary-800', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '45px', width: '31%' },
              ]}
            />
          </SidebarSection>
        </>
      )}
    </Sidebar>
  );
}

export default OperatorSidebar;