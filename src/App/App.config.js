import Onboard from '@/features/screen/onboard/components/Onboard';
import Home from '@/features/screen/home/components/Home';
import Mechanics from '@/features/screen/fleet/mechanic/components/Mechanic';
import Operators from '@/features/screen/fleet/operator/components/Operator';
import Toolkits from '@/features/screen/stock/toolkit/components/Toolkits';
import Complaints from '@/features/screen/fleet/complaint/components/Complaint';
import SpareParts from '@/features/screen/stock/part/components/SpareParts';
import Documents from '@/features/screen/document/components/Document';
import Dashboard from '@/features/screen/dashboard/components/Dashboard';
import Analytics from '@/features/screen/dashboard/components/Analytics';
import HistoricalData from '@/features/screen/dashboard/components/HistoricalData';
import Graphs from '@/features/screen/dashboard/components/Graphs';
import Downloads from '@/shared/components/app/downloads/Downloads';
import Equipments from '@/features/screen/fleet/equipment/components/Equipments';
import Operations from '@/features/screen/fleet/operation/components/Operations';
import MaintenanceList from '@/features/screen/fleet/maintenance/list/components/MaintenanceList';
import MaintenanceForm from '@/features/screen/fleet/maintenance/form/components/MaintenanceForm';
import MaintenanceReport from '@/features/screen/fleet/maintenance/report/components/MaintenanceReport';
import MaintenanceRecord from '@/features/screen/fleet/maintenance/record/components/MaintenanceRecord';
import MaintenanceRecordForm from '@/features/screen/fleet/maintenance/record/form/components/MaintenanceRecordForm';
import PurchaseOrderList from '@/features/screen/commercials/purchase/list/components/PurchaseOrderList';
import PurchaseOrderReport from '@/features/screen/commercials/purchase/report/components/PurchaseOrderReport';
import PurchaseOrderForm from '@/features/screen/commercials/purchase/form/components/PurchaseOrderForm';
import QuotationList from '@/features/screen/commercials/quotation/list/components/QuotationList';
import QuotationReport from '@/features/screen/commercials/quotation/report/components/QuotationReport';
import QuotationForm from '@/features/screen/commercials/quotation/form/components/QuotationForm';
import HireOrderList from '@/features/screen/commercials/hire/list/components/HireOrderList';
import HireOrderForm from '@/features/screen/commercials/hire/form/components/HireOrderForm';
import HireOrderReport from '@/features/screen/commercials/hire/report/components/HireOrderReport';
import BackchargeForm from '@/features/screen/commercials/backcharge/form/components/BackchargeForm';
import BackchargeList from '@/features/screen/commercials/backcharge/list/components/BackchargeList';
import BackchargeReport from '@/features/screen/commercials/backcharge/report/components/BackchargeReport';

export const PUBLIC_ROUTES = [
  { path: '/onboard', element: <Onboard /> },
  { path: '/batch-service-form/:regNo?', element: <MaintenanceRecordForm /> },
];

export const PROTECTED_ROUTES = [
  { path: '/', element: <Home /> },

  { path: '/mechanics', element: <Mechanics /> },

  { path: '/operators', element: <Operators /> },

  { path: '/stock/toolkits', element: <Toolkits /> },

  { path: '/complaints', element: <Complaints /> },
  { path: '/complaints/:complaintId/:regNo', element: <Complaints /> },

  { path: '/stock/parts', element: <SpareParts /> },

  { path: '/documents/:type/:id', element: <Documents /> },
  { path: '/documents', element: <Documents /> },

  { path: '/dashboard', element: <Dashboard /> },
  { path: '/analytics', element: <Analytics /> },
  { path: '/historical-data', element: <HistoricalData /> },
  { path: '/historical-data/:group/:category', element: <HistoricalData /> },
  { path: '/graphs', element: <Graphs /> },

  { path: '/download-center', element: <Downloads /> },

  { path: '/equipments', element: <Equipments /> },

  { path: '/fleet/operations', element: <Operations /> },

  { path: '/maintenance/list', element: <MaintenanceList /> },
  { path: '/maintenance/list/:regNos', element: <MaintenanceList /> },

  { path: '/maintenance/form/new', element: <MaintenanceForm /> },
  { path: '/maintenance/form/new/:regNo/:complaintId?', element: <MaintenanceForm /> },
  { path: '/maintenance/form/edit/:maintenanceId', element: <MaintenanceForm /> },

  { path: '/maintenance/report/batch', element: <MaintenanceReport /> },
  { path: '/maintenance/report/:maintenanceId', element: <MaintenanceReport /> },

  { path: '/maintenance/record', element: <MaintenanceRecord /> },

  { path: '/order/purchase/list', element: <PurchaseOrderList /> },
  { path: '/order/purchase/list/equipments', element: <PurchaseOrderList purchaseOrdersOfEquipments /> },
  { path: '/order/purchase/list/all', element: <PurchaseOrderList allPurchaseOrders /> },
  { path: '/order/purchase/list/:regNo', element: <PurchaseOrderList purchaseOrderOfSpecificEquipment /> },
  { path: '/order/purchase/list/stocks', element: <PurchaseOrderList purchaseOrdersOfStocks /> },

  { path: '/order/purchase/report/:purchaseorderRef', element: <PurchaseOrderReport /> },
  { path: '/order/purchase/report/:purchaseorderRef/:complaintId', element: <PurchaseOrderReport /> },
  { path: '/order/purchase/report/:purchaseorderRef/amendment/:amendment/:complaintId', element: <PurchaseOrderReport /> },

  { path: '/order/purchase/form/for-stock', element: <PurchaseOrderForm purchaseOrdersOfStocks /> },
  { path: '/order/purchase/form/for-all-equipments', element: <PurchaseOrderForm purchaseOrderForAllEquipments /> },
  { path: '/order/purchase/form/edit/:refNo', element: <PurchaseOrderForm isPurchaseOrderUpdate /> },
  { path: '/order/purchase/form/update/:amendment/:refNo', element: <PurchaseOrderForm amendmentUpdate amendment /> },
  { path: '/order/purchase/form/amendment/:refNo', element: <PurchaseOrderForm amendment /> },
  { path: '/order/purchase/form/:regNo/:complaintId', element: <PurchaseOrderForm /> },
  { path: '/order/purchase/form/:regNo', element: <PurchaseOrderForm /> },

  { path: '/order/hire/list', element: <HireOrderList /> },

  { path: '/order/hire/form', element: <HireOrderForm /> },
  { path: '/order/hire/form/edit/:refNo', element: <HireOrderForm edit /> },
  { path: '/order/hire/report/:refNo', element: <HireOrderReport /> },

  { path: '/quotation/form', element: <QuotationForm /> },
  { path: '/quotation/form/edit/:quotationRef', element: <QuotationForm  edit/> },
  { path: '/quotation/form/duplicate/:quotationRef', element: <QuotationForm duplicate /> },
  { path: '/quotation/form/amendment/:quotationRef', element: <QuotationForm  amendmentUpdate amendment /> },
  { path: '/quotation/form/amendment/edit/:quotationRef', element: <QuotationForm  amendmentUpdate amendment editAmendment /> },
  { path: '/quotation/list', element: <QuotationList /> },
  { path: '/quotation/report/:quotationRef', element: <QuotationReport /> },
  { path: '/quotation/report/:quotationRef/amendment/:amendment', element: <QuotationReport /> },
  { path: '/quotation/report/:quotationRef/parts/:parts', element: <QuotationReport /> },

  { path: '/backcharge/form', element: <BackchargeForm /> },

  { path: '/backcharge/list', element: <BackchargeList /> },

  { path: '/backcharge/report', element: <BackchargeReport /> },
  { path: '/backcharge/report/:refNo', element: <BackchargeReport /> },
];