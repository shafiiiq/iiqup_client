import A2PaperSkeleton from '@/shared/components/widgets/paper/A2PaperSkeleton';
import Button from '@/shared/components/widgets/button/Button';

import { useMaintenanceReport } from '../hooks/useMaintenanceReport';
import { SHARED_BUTTON_PROPS } from '../constants/maintenance.report.constant';
import ReportDocument from './fragments/ReportDocument';
import ReportActionBar from './fragments/ReportActionBar';
import ReportModals from './fragments/ReportModals';

import './MaintenanceReport.css';

function MaintenanceReport() {
  const report = useMaintenanceReport();

  if (report.loading) {
    return (
      <div className="fleet maintenance report loading state container">
        <A2PaperSkeleton />
      </div>
    );
  }

  if (report.reports.length === 0) {
    return (
      <div className="fleet maintenance report empty state container no-print">
        <h2>No maintenance records available</h2>
        <div className="fleet maintenance report empty state navigation">
          <Button {...SHARED_BUTTON_PROPS} text="Go Back" onClick={report.handleGoBack} colorScheme="primary-800" width="160px" type="submit" />
        </div>
      </div>
    );
  }

  return (
    <>
      <ReportActionBar
        handlePrint={report.handlePrint}
        handleDownloadPdf={report.handleDownloadPdf}
        isPdfReady={report.isPdfReady}
      />

      {report.reports.map((maintenanceRecord, index) => (
        <ReportDocument
          key={maintenanceRecord._id}
          report={maintenanceRecord}
          onEditReport={report.handleEditReport}
          onDeleteReport={report.handleDeleteReport}
          pageBreakStyle={{ pageBreakAfter: index < report.reports.length - 1 ? 'always' : 'auto' }}
        />
      ))}

      <ReportModals {...report.modalProps} />
    </>
  );
}

export default MaintenanceReport;