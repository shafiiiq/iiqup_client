import Tabs from '@/shared/components/widgets/tabs/Tabs';
import Button from '@/shared/components/widgets/button/Button';
import Toast from '@/shared/components/widgets/toast/Toast';
import Loader from '@/shared/components/widgets/loader/spinner/Spinner';

import { isOilOrNormalService } from '../../helper/maintenance.helper';
import { useMaintenanceForm } from '../hooks/useMaintenanceForm';
import { FORM_SECTIONS, FORM_SECTION_ORDER, FORM_SECTION_LABELS } from '../constants/maintenance.form.constant';
import ServiceTypeSection from './fragments/ServiceTypeSection';
import EquipmentDetailsSection from './fragments/EquipmentDetailsSection';
import HistorySection from './fragments/HistorySection';
import ReportSection from './fragments/ReportSection';
import AttachmentsSection from './fragments/AttachmentsSection';

import './MaintenanceForm.css';

function getActionButtonText({ isSubmitting, isLastSection, mode }) {
  if (isSubmitting) return 'Saving...';
  if (!isLastSection) return 'Next';
  if (mode === 'edit') return 'Update';
  return 'Submit';
}

function MaintenanceForm() {
  const form = useMaintenanceForm();
  const { formData, history, activeSection, attachmentState } = form;

  const navItems = FORM_SECTION_ORDER.map((sectionKey) => ({
    key: sectionKey,
    label: FORM_SECTION_LABELS[sectionKey],
    warn: form.sectionHasWarning(sectionKey),
  }));

  if (form.isPrefetching) {
    return (
      <div className="fleet maintenance form loading">
        <Loader />
      </div>
    );
  }

  return (
    <div className="fleet maintenance form container">
      <div className="fleet maintenance form layout">
        <Tabs
          title="Sections"
          items={navItems}
          activePath={[activeSection]}
          onSelect={([sectionKey]) => form.setActiveSection(sectionKey)}
          maxHeight="1090px"
        />

        <div className="fleet maintenance form content">
          {activeSection === FORM_SECTIONS.TYPE && (
            <ServiceTypeSection
              formData={formData}
              onSelectType={form.handleTypeSelect}
              onChange={form.handleChange}
            />
          )}
          {activeSection === FORM_SECTIONS.DETAILS && (
            <EquipmentDetailsSection
              formData={formData}
              isEquipmentLocked={form.isEquipmentLocked}
              equipmentSearch={form.equipmentSearch}
              onChange={form.handleChange}
              onEquipmentSelect={form.handleEquipmentSelect}
              onRegNoInput={form.handleRegNoInput}
            />
          )}
          {activeSection === FORM_SECTIONS.HISTORY && (
            <HistorySection
              history={history}
              showFullService={isOilOrNormalService(formData.serviceType)}
              onHistoryChange={form.handleHistoryChange}
            />
          )}
          {activeSection === FORM_SECTIONS.REPORT && (
            <ReportSection
              formData={formData}
              onChange={form.handleChange}
              onStatusChange={form.handleStatusChange}
              onRangeStatusChange={form.handleRangeStatusChange}
            />
          )}
          {activeSection === FORM_SECTIONS.ATTACHMENTS && (
            <AttachmentsSection
              attachments={attachmentState.attachments}
              onFilesSelected={attachmentState.addFiles}
              onRemoveAttachment={attachmentState.removeAttachment}
            />
          )}

          <div className="fleet maintenance form actions">
            <Button
              text={getActionButtonText({
                isSubmitting: form.isSubmitting,
                isLastSection: form.isLastSection,
                mode: form.mode,
              })}
              onClick={form.isLastSection ? form.handleSubmit : form.handleNextSection}
              colorScheme={form.isSubmitting ? 'success-1000' : 'success-800'}
              variant="gradient"
              font="md"
              squircle="4xl"
              width="240px"
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

export default MaintenanceForm;