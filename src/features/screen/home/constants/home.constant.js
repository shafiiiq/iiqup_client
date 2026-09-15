import Chairman from '@assets/images/chairman.png';
import ViseChairman from '@assets/images/vice-chairman.jpg';
import MD from '@assets/images/md.jpg';
import CEO from '@assets/images/ceo.jpg';
import Manager from '@assets/images/manager.jpg';
import PurchaseManager from '@assets/images/purchase-manager.jpg';
import SalesManager from '@assets/images/sales-manager.JPG';
import WorkshopManager from '@assets/images/workshop-manager.png';
import ItHead from '@assets/images/it-head.png';

export const DESKTOP_BREAKPOINT = 992;

export const LEADERSHIP_TEAM = [
  { id: 1, name: 'Mr. Suresh Kanth', position: 'Operation Manager', image: Manager, size: 'sm' },
  { id: 2, name: 'Mr. Ahammed Kamal', position: 'Chief Executive Officer', image: CEO, size: 'md' },
  { id: 3, name: 'Mr. Mohammed Shaheen', position: 'Managing Director', image: MD, size: 'lg' },
  { id: 4, name: 'Mr. Abu Kombathayil', position: 'Vise Chairman & Founder', image: ViseChairman, size: 'xl' },
  { id: 5, name: 'Mr. Abdulrahman Abdulla Al Ansari', position: 'Chairman', image: Chairman, size: 'center' },
  { id: 6, name: 'Mr. Abdul Malik', position: 'Purchase Manager', image: PurchaseManager, size: 'xl' },
  { id: 7, name: 'Mr. Sruthin Kezhuvappaly', position: 'Sales Manager', image: SalesManager, size: 'lg' },
  { id: 8, name: 'Mr. Firoz Khan', position: 'Workshop Manager', image: WorkshopManager, size: 'md' },
  { id: 9, name: 'Ms. Shyma Ameena', position: 'Admin Manager', image: null, size: 'sm' },
];

export const OFFICE_STAFF_DEPARTMENTS = [
  {
    id: 'operations',
    department: 'Operations Department',
    staff: [
      { id: 1, name: 'Mr. Salih Basheer', position: 'Operation Supervisor', image: null },
      { id: 2, name: 'Mr. Subash', position: 'Operation Supervisor', image: null },
      { id: 3, name: 'Mr. Joseph Augestine', position: 'Operation Supervisor', image: null },
      { id: 4, name: 'Mr. Shaheen Sha', position: 'Operation Supervisor', image: null },
      { id: 5, name: 'Mr. Bal Bahadur', position: 'Camp Boss', image: null },
    ],
  },
  {
    id: 'sales',
    department: 'Sales Department',
    staff: [
      { id: 6, name: 'Mr. Adhil', position: 'Sales Executive', image: null },
    ],
  },
  {
    id: 'accounts',
    department: 'Accounts Department',
    staff: [
      { id: 7, name: 'Mr. Roshan Sha', position: 'Accountant', image: null },
      { id: 8, name: 'Ms. Charishma', position: 'Chief Accountant', image: null },
      { id: 9, name: 'Mr. Asarudheen', position: 'Chief Accountant', image: null },
    ],
  },
  {
    id: 'admin',
    department: 'Admin Department',
    staff: [
      { id: 10, name: 'Mr. Jaleel', position: 'Public Relation Officer', image: null },
      { id: 11, name: 'Mr. Shaheen', position: 'Admin', image: null },
      { id: 12, name: 'Ms. Najiya', position: 'HR Manager', image: null },
      { id: 13, name: 'Mrs. Sana', position: 'Admin', image: null },
    ],
  },
  {
    id: 'workshop',
    department: 'Workshop Department',
    staff: [
      { id: 14, name: 'Mr. Hamza', position: 'Mechanic Supervisor', image: null },
    ],
  },
  {
    id: 'it',
    department: 'IT Department',
    staff: [
      { id: 15, name: 'Mr. Muhammed Shafeek', position: 'IT Head', image: ItHead },
    ],
  },
  {
    id: 'other',
    department: 'Other',
    staff: [
      { id: 16, name: 'Mr. Jaleel Ibrahim', position: '-----', image: null },
    ],
  },
];

export const NAV_GROUPS = [
  {
    key: 'main-menu',
    label: 'Main Menu',
    items: [
      { label: 'Home', path: '/', componentIcon: 'IconlyHome' },
    ],
  },
  {
    key: 'fleet',
    label: 'Fleet',
    items: [
      { label: 'Equipments', path: '/equipments', componentIcon: 'CraneIcon' },
      { label: 'Operators', path: '/operators', componentIcon: 'Iconly3user' },
      { label: 'Mechanics', path: '/mechanics', componentIcon: 'IconlyFace' },
    ],
  },
  {
    key: 'stocks',
    label: 'Stocks',
    items: [
      { label: 'Spare Parts', path: '/stock/parts', componentIcon: 'IconlyBuy' },
      { label: 'Safety Items', path: '/stock/toolkits', componentIcon: 'JacketIcon' },
    ],
  },
  {
    key: 'documentation',
    label: 'Documentation',
    items: [
      { label: 'Purchase Orders', path: '/order/purchase/list', componentIcon: 'IconlyBag2' },
      { label: 'Hire Orders', path: '/order/hire/list', componentIcon: 'BrandIcon' },
      { label: 'Backcharges', path: '/backcharge/list', componentIcon: 'ReturnIcon' },
      { label: 'Documents', path: '/documents', componentIcon: 'FolderIcon' },
      { label: 'Quotations', path: '/quotation/list', componentIcon: 'IconlyPaper' },
    ],
  },
  {
    key: 'settings-news',
    label: 'Settings & News',
    items: [
      { label: 'Notifications', path: '/notification', componentIcon: 'IconlyNotification' },
      { label: 'Settings', path: '/settings', componentIcon: 'IconlySetting' },
    ],
  },
  {
    key: 'administration',
    label: 'Administration',
    items: [
      { label: 'Dashboard', path: '/dashboard', componentIcon: 'IconlyCategory' },
    ],
  },
];