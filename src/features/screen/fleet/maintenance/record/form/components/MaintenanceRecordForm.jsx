import Tabs from '@/shared/components/widgets/tabs/Tabs';
import Button from '@/shared/components/widgets/button/Button';
import Toast from '@/shared/components/widgets/toast/Toast';

import { isOilOrNormalService } from '../../../helper/maintenance.helper';
import { FORM_SECTIONS } from '../../../form/constants/maintenance.form.constant';
import ServiceTypeSection from '../../../form/components/fragments/ServiceTypeSection';
import HistorySection from '../../../form/components/fragments/HistorySection';
import ReportSection from '../../../form/components/fragments/ReportSection';
import AttachmentsSection from '../../../form/components/fragments/AttachmentsSection';
import SelectEquipmentSection from './fragments/SelectEquipmentSection';
import RecordEquipmentDetailsSection from './fragments/RecordEquipmentDetailsSection';
import RecordHeader from './fragments/RecordHeader';
import { useMaintenanceRecordForm } from '../hooks/useMaintenanceRecordForm';
import { buildRecordFormTabItems } from '../helper/maintenance.record.form.nav.helper';
import { RECORD_FORM_SECTIONS, RECORD_TAB_CONTROL_BUTTON_PROPS } from '../constants/maintenance.record.form.constant';

import '../../../form/components/MaintenanceForm.css';
import './MaintenanceRecordForm.css';

function getActionButtonText({ isSubmitting, isLastSection, recordCount }) {
  if (isSubmitting) return `Submitting ${recordCount} records…`;
  if (!isLastSection) return 'Next';
  return `Submit ${recordCount} Record${recordCount !== 1 ? 's' : ''}`;
}

function MaintenanceRecordForm() {
  const form = useMaintenanceRecordForm();
  const { activeCard, activeSection, attachmentActions } = form;
  const { formData, history } = activeCard;
  const cardId = activeCard.id;
  const recordCount = form.cards.length;

  const handleFieldChange = (event) => form.handleFieldChange(cardId, event);

  return (
    <div className="fleet maintenance form container">
      <div className="fleet maintenance form layout">
        <Tabs
          title="Records"
          items={buildRecordFormTabItems(form.cards)}
          activePath={[form.activeCardId, activeSection]}
          onSelect={form.handleTabSelect}
          showSearch={false}
          maxHeight="1090px"
          controlsColumns={1}
          controls={[
            { ...RECORD_TAB_CONTROL_BUTTON_PROPS, text: 'Add Record', onClick: form.handleAddRecord, colorScheme: 'success-800', componentIconLeft: 'IconlyPlus', componentIconSize: '25', iconColor: 'white-200' },
            { ...RECORD_TAB_CONTROL_BUTTON_PROPS, text: 'Reset All', onClick: form.handleResetAll, colorScheme: 'warning-800', componentIconLeft: 'RefreshIcon', componentIconSize: '25', iconColor: 'white-200' },
          ]}
        />

        <div key={cardId} className="fleet maintenance form content">
          <RecordHeader
            card={activeCard}
            recordNumber={form.activeCardIndex + 1}
            canRemove={recordCount > 1}
            onRemove={() => form.handleRemoveRecord(cardId)}
          />

          {activeSection === RECORD_FORM_SECTIONS.EQUIPMENT && (
            <SelectEquipmentSection
              regNo={formData.regNo}
              isEquipmentLocked={form.hasUrlRegNo}
              equipmentSearch={form.equipmentSearch}
              onEquipmentSelect={(equipment) => form.handleEquipmentSelect(cardId, equipment)}
              onRegNoInput={(value) => form.handleRegNoInput(cardId, value)}
            />
          )}
          {activeSection === FORM_SECTIONS.TYPE && (
            <ServiceTypeSection
              formData={formData}
              isTypeLocked={false}
              onSelectType={(serviceType) => form.handleTypeSelect(cardId, serviceType)}
              onChange={handleFieldChange}
            />
          )}
          {activeSection === FORM_SECTIONS.DETAILS && (
            <RecordEquipmentDetailsSection formData={formData} onChange={handleFieldChange} />
          )}
          {activeSection === FORM_SECTIONS.HISTORY && (
            <HistorySection
              history={history}
              showFullService={isOilOrNormalService(formData.serviceType)}
              onHistoryChange={(field, value) => form.handleHistoryChange(cardId, field, value)}
            />
          )}
          {activeSection === FORM_SECTIONS.REPORT && (
            <ReportSection
              formData={formData}
              onChange={handleFieldChange}
              onStatusChange={(itemId, status) => form.handleStatusChange(cardId, itemId, status)}
              onRangeStatusChange={(rangeStart, rangeEnd, status) =>
                form.handleRangeStatusChange(cardId, rangeStart, rangeEnd, status)
              }
            />
          )}
          {activeSection === FORM_SECTIONS.ATTACHMENTS && (
            <AttachmentsSection
              attachments={activeCard.attachments}
              onFilesSelected={(files) => attachmentActions.addFiles(cardId, files)}
              onRemoveAttachment={(localId) => attachmentActions.removeAttachment(cardId, localId)}
            />
          )}

          <div className="fleet maintenance form actions">
            <Button
              text={getActionButtonText({ isSubmitting: form.isSubmitting, isLastSection: form.isLastSection, recordCount })}
              onClick={form.isLastSection ? form.handleSubmit : form.handleNextSection}
              colorScheme={form.isSubmitting ? 'success-1000' : 'success-800'}
              variant="gradient"
              font="md"
              squircle="4xl"
              width="260px"
              height="48px"
              type="button"
              textColor="white-200"
              shadowPosition="to-bottom"
              shadowColor="white-600"
              disabled={form.isSubmitting}
            />
          </div>
        </div>
      </div>

      <Toast
        isOpen={form.toastConfig.isOpen}
        onClose={form.closeToast}
        type={form.toastConfig.type}
        message={form.toastConfig.message}
        textColor={form.toastConfig.textColor}
        duration={4000}
        position="top-center"
      />
    </div>
  );
}

export default MaintenanceRecordForm;