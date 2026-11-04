import { useEffect } from 'react';
import mechanicSign from '@assets/images/mechanic-sign.png';
import A2Paper from '@/shared/components/widgets/paper/A2Paper';
import Controls from '@/shared/components/widgets/controls/Controls';
import SigningModals from '@/features/core/messaging/signature/components/SigningModals';
import SignatureSlotContent from '@/features/core/messaging/signature/components/SignatureSlotContent';
import useSigningFlow from '@/features/core/messaging/signature/hooks/useSigningFlow';
import MaintenanceAttachment from '../../../components/MaintenanceAttachment';
import { formatDate } from '../../../helper/maintenance.helper';
import { getChecklistLayout, getNextServiceDisplay, getReportHeadingTitle } from '../../helper/maintenance.report.helper';
import {
  SHARED_BUTTON_PROPS,
  MAINTENANCE_SIGNATURE_SOURCE_KEY,
  MAINTENANCE_SUPERVISOR_SLOT_ID,
} from '../../constants/maintenance.report.constant';

function ChecklistRows({ report }) {
  const { leftItems, rightItems, statusMap } = getChecklistLayout(report);

  return (
    <>
      {leftItems.map((leftItem, rowIndex) => {
        const rightItem = rightItems[rowIndex];
        return (
          <tr key={leftItem.id}>
            <td>{leftItem.id}</td>
            <td>{leftItem.description}</td>
            <td className="fleet maintenance report checked status cell">{statusMap[leftItem.id] || ''}</td>
            {rightItem ? (
              <>
                <td>{rightItem.id}</td>
                <td>{rightItem.description}</td>
                <td className="fleet maintenance report checked status cell">{statusMap[rightItem.id] || ''}</td>
              </>
            ) : (
              <><td /><td /><td /></>
            )}
          </tr>
        );
      })}

      <tr className="fleet maintenance report remarks row">
        <td colSpan="6">
          <div className="fleet maintenance report remarks container">
            <div className="fleet maintenance report remarks text">
              <strong className="fleet maintenance report remarks label">REMARKS : </strong>
              {report.remarks?.toUpperCase()}
            </div>
          </div>
          <span className="fleet maintenance report fit to work status">EQUIPMENT FIT TO WORK</span>
        </td>
      </tr>
    </>
  );
}

function FooterRows({ report, supervisorSlot, onSign, isSigning }) {
  return (
    <>
      <tr>
        <td colSpan="3"><strong>SERVICE HRS:</strong> {report.fullService ? `${report.serviceHrs} - ${report.serviceHrs}` : report.serviceHrs}</td>
        <td colSpan="3"><strong>EQUIPMENT NO:</strong> {report.regNo}</td>
      </tr>
      <tr>
        <td colSpan="3"><strong>NEXT SERVICE HRS:</strong> {getNextServiceDisplay(report)}</td>
        <td colSpan="3"><strong>MACHINE:</strong> {report.equipment?.toUpperCase()}</td>
      </tr>
      <tr>
        <td colSpan="3"><strong>MECHANICS:</strong> {report.mechanics?.toUpperCase()}</td>
        <td colSpan="3"><strong>LOCATION:</strong> {report.location?.toUpperCase()}</td>
      </tr>
      <tr>
        <td colSpan="3"><strong>DATE:</strong> {formatDate(report.date)}</td>
        <td colSpan="3"><strong>OPERATOR NAME:</strong> {report.operator?.toUpperCase()}</td>
      </tr>
      <tr className="fleet maintenance report signature row">
        <td colSpan="3">
          <strong>MECHANIC SIGN:</strong>
          <img className="fleet maintenance report mechanic signature image" src={mechanicSign} alt="Mechanic Signature" />
        </td>
        <td colSpan="3">
          <strong>SUPERVISOR SIGN:</strong>
          <SignatureSlotContent
            slot={supervisorSlot}
            alt="Supervisor Signature"
            onSign={onSign}
            isSigning={isSigning}
            imageClassName="fleet maintenance report supervisor signature image"
          />
        </td>
      </tr>
    </>
  );
}

function ReportDocument({ report, onEditReport, onDeleteReport, pageBreakStyle }) {
  const signing = useSigningFlow({ sourceKey: MAINTENANCE_SIGNATURE_SOURCE_KEY, documentId: report._id });
  const { loadSignatures } = signing;

  useEffect(() => {
    loadSignatures();
  }, [loadSignatures]);

  return (
    <div className="fleet maintenance report document wrapper" style={pageBreakStyle}>
      <Controls
        justify="space-between"
        margin="0 auto 20px auto"
        width="297mm"
        buttons={[
          { ...SHARED_BUTTON_PROPS, onClick: () => onEditReport(report._id), colorScheme: 'warning-800', type: 'submit', componentIconCenter: 'IconlyEdit', componentIconSize: '30', iconColor: 'warning-200' },
          { ...SHARED_BUTTON_PROPS, onClick: () => onDeleteReport(report._id), colorScheme: 'error-800', type: 'submit', componentIconCenter: 'IconlyDelete', componentIconSize: '30', iconColor: 'error-200' },
          ...(signing.isActivationAvailable
            ? [{ ...SHARED_BUTTON_PROPS, text: 'Activate E-Signs', onClick: signing.openActivationModal, colorScheme: 'error-800', type: 'submit' }]
            : []),
          ...(signing.canRequestFamilyAccess
            ? [{ ...SHARED_BUTTON_PROPS, text: 'Request Family Access', onClick: signing.requestFamilyAccess, colorScheme: 'info-800', type: 'submit', width: 'fit-content' }]
            : []),
          { ...SHARED_BUTTON_PROPS, text: signing.isSigning ? 'Signing...' : 'Sign Document', onClick: () => signing.handleSignButtonClick(), colorScheme: 'warning-800', type: 'submit', componentIconLeft: 'SignaturePenIcon', componentIconSize: '30', iconColor: 'white-200' },
        ]}
      />
      <A2Paper isReady={signing.isSignaturesLoaded}>
        <table className="fleet maintenance report checklist table">
          <thead>
            <tr>
              <th colSpan="6" className="fleet maintenance report document heading">{getReportHeadingTitle(report)}</th>
            </tr>
            <tr>
              <th>SL.NO</th><th>DESCRIPTION</th><th>CHECKED</th>
              <th>SL.NO</th><th>DESCRIPTION</th><th>CHECKED</th>
            </tr>
          </thead>
          <tbody>
            <ChecklistRows report={report} />
            <FooterRows
              report={report}
              supervisorSlot={signing.signatureSlots[MAINTENANCE_SUPERVISOR_SLOT_ID]}
              onSign={signing.handleSignButtonClick}
              isSigning={signing.isSigning}
            />
          </tbody>
        </table>
      </A2Paper>

      {report.attachments?.length > 0 && (
        <div className="fleet maintenance report attachments no-print">
          {report.attachments.map((attachment) => (
            <MaintenanceAttachment key={attachment.sessionId} attachment={attachment} />
          ))}
        </div>
      )}

      <SigningModals flow={signing} documentLabel="Maintenance Report" />
    </div>
  );
}

export default ReportDocument;