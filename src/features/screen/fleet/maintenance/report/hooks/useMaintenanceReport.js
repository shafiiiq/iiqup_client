import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useDocumentPdfStatus from '@/features/core/sync/pdf/hooks/useDocumentPdfStatus';
import { fetchMaintenanceById, deleteMaintenance } from '../api/maintenance.api';
import {
  fetchMaintenanceDocuments,
  downloadStoredMaintenancePdf,
  downloadMaintenanceBatchPdf,
} from '../api/maintenance.report.api';
import { MAINTENANCE_PDF_SOURCE_KEY } from '../constants/maintenance.report.constant';

export const useMaintenanceReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { maintenanceId } = useParams();

  const isBatchView = !maintenanceId;
  const { isPdfReady } = useDocumentPdfStatus({ sourceKey: MAINTENANCE_PDF_SOURCE_KEY, documentId: maintenanceId });

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        if (isBatchView) {
          const result = await fetchMaintenanceDocuments(location.search);
          setReports(result.data || []);
        } else {
          setReports([await fetchMaintenanceById(maintenanceId)]);
        }
      } catch (error) {
        console.error('[useMaintenanceReport] loadReports:', error);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [isBatchView, maintenanceId, location.search]);

  const handlePrint = () => window.print();

  const handleEditReport = (reportId) => navigate(`/maintenance/form/edit/${reportId}`);

  const handleDeleteReport = (reportId) => {
    setPendingDeleteId(reportId);
    setShowDeleteModal(true);
  };

  const handleGoBack = () => navigate(-1);

  const confirmDeleteReport = async () => {
    try {
      const result = await deleteMaintenance(pendingDeleteId);
      if (!result.ok) {
        alert('Failed to delete the record. Please try again.');
        return;
      }
      setShowDeleteModal(false);
      setReports((previous) => previous.filter((report) => report._id !== pendingDeleteId));
      if (!isBatchView) navigate(-1);
    } catch (error) {
      console.error('[useMaintenanceReport] confirmDeleteReport:', error);
      alert('An error occurred while deleting the record.');
    }
  };

  const handleDownloadPdf = async () => {
    setShowLoadingModal(true);
    setLoadingMessage('Generating PDF...');

    try {
      const equipmentLabel = reports[0]?.regNo || 'equipment';
      const fileName = `Maintenance-Report-${equipmentLabel}-${maintenanceId || 'batch'}.pdf`;

      const params = new URLSearchParams(location.search);
      params.set('pdf', '1');

      const blob = isBatchView
        ? await downloadMaintenanceBatchPdf(`${location.pathname}?${params.toString()}`, fileName)
        : await downloadStoredMaintenancePdf(maintenanceId);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('[useMaintenanceReport] handleDownloadPdf:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setShowLoadingModal(false);
    }
  };

  const modalProps = {
    showDeleteModal,
    onDeleteClose: () => setShowDeleteModal(false),
    onDeleteConfirm: confirmDeleteReport,
    showLoadingModal,
    loadingMessage,
  };

  return {
    reports,
    loading,
    isPdfReady,
    handlePrint,
    handleEditReport,
    handleDeleteReport,
    handleGoBack,
    handleDownloadPdf,
    modalProps,
  };
};