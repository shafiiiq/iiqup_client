import Controls from '@/shared/components/widgets/controls/Controls';
import { SHARED_BUTTON_PROPS } from '../../constants/maintenance.report.constant';

function ReportActionBar({ handlePrint, handleDownloadPdf, isPdfReady }) {
  return (
    <div className="fleet maintenance report toolbar no-print">
      <Controls
        justify="space-between"
        margin="0 auto 60px auto"
        width="297mm"
        columns={2}
        buttons={[
          { ...SHARED_BUTTON_PROPS, text: 'Print Report', onClick: handlePrint, colorScheme: 'info-100', textColor: 'black-200', type: 'submit', componentIconLeft: 'PrinterIcon', componentIconSize: '30', iconColor: 'black-200' },
          { ...SHARED_BUTTON_PROPS, text: isPdfReady ? 'Download as PDF' : 'Preparing PDF...', onClick: handleDownloadPdf, colorScheme: 'error-100', textColor: 'black-200', type: 'submit', componentIconLeft: 'PdfIcon', componentIconSize: '30', iconColor: 'black-200', width: '240px' },
        ]}
      />
    </div>
  );
}

export default ReportActionBar;