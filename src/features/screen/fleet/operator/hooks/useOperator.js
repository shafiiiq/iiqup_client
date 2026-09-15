import { useState, useEffect, useMemo, useCallback } from 'react';

import { useSearch as useSearchContext } from '@/shared/context/SearchContext';
import { useSearch } from '@/shared/search/useSearch';
import { SEARCH_SOURCES } from '@/shared/search/search.constant';
import {
  fetchOperators,
  getOperatorProfilePicUrl,
  deleteOperator,
} from '../api/operator.api';
import {
  mobilizeOperator as mobilizeOperatorApi,
  demobilizeOperator as demobilizeOperatorApi,
  fetchSiteOptions,
} from '../api/operator.mobilization.api';
import { apiRequest } from '@/features/core/network/api/api.request';

import {
  NATIONALITY_OPTIONS,
  SPONSORSHIP_OPTIONS,
  WORKING_IN_OPTIONS,
  LICENCE_TYPE_OPTIONS,
  WORKMEN_COMPENSATION_OPTIONS,
  DEPLOY_TYPE_OPTIONS,
  SHIFT_OPTIONS,
  RENT_BASIS_OPTIONS,
  DESIGNATION_OPTIONS,
  EMPTY_FORM,
  OPERATOR_TABS,
  MOBILIZE_FORM_DEFAULTS,
  DEMOBILIZE_FORM_DEFAULTS,
  OPERATOR_LIST_PAGE_SIZE,
  OPERATOR_SCROLL_DEBOUNCE_MS,
  OPERATOR_SCROLL_BOTTOM_OFFSET_PX,
} from '../constants/operator.constant';
import { getInitials, formatDate, isExpired, getOperatorStatus, toInputDate, matchesOperatorTab } from '../helper/operator.helper';

export const useOperator = () => {
  const { searchTerm } = useSearchContext();
  const isSearchActive = searchTerm.trim().length > 0;

  const operatorSearch = useSearch({ source: SEARCH_SOURCES.OPERATORS, limit: OPERATOR_LIST_PAGE_SIZE });

  const [operators, setOperators] = useState([]);
  const [profilePicUrls, setProfilePicUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [siteOptions, setSiteOptions] = useState([]);

  const [currentOperatorPage, setCurrentOperatorPage] = useState(1);
  const [hasMoreOperators, setHasMoreOperators] = useState(true);
  const [isLoadingMoreOperators, setIsLoadingMoreOperators] = useState(false);

  const [selectedOperator, setSelectedOperator] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [activeTab, setActiveTab] = useState(OPERATOR_TABS.OWN);

  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [sidebarMaximized, setSidebarMaximized] = useState(false);

  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const [formMode, setFormMode] = useState('add');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [operatorToDelete, setOperatorToDelete] = useState(null);

  const [showMobilizeModal, setShowMobilizeModal] = useState(false);
  const [mobilizeForm, setMobilizeForm] = useState(MOBILIZE_FORM_DEFAULTS);
  const [selectedOperatorForAction, setSelectedOperatorForAction] = useState(null);
  const [isMobilizing, setIsMobilizing] = useState(false);

  const [showDemobilizeModal, setShowDemobilizeModal] = useState(false);
  const [demobilizeForm, setDemobilizeForm] = useState(DEMOBILIZE_FORM_DEFAULTS);
  const [isDemobilizing, setIsDemobilizing] = useState(false);

  const loadOperators = useCallback(async (page = 1, append = false) => {
    if (page === 1) setLoading(true);
    else setIsLoadingMoreOperators(true);

    try {
      const result = await fetchOperators({ page, limit: OPERATOR_LIST_PAGE_SIZE });
      setOperators(prev => (append ? [...prev, ...result.data] : result.data));
      setCurrentOperatorPage(result.currentPage);
      setHasMoreOperators(result.hasMore);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching operators:', err);
    } finally {
      setLoading(false);
      setIsLoadingMoreOperators(false);
    }
  }, []);

  useEffect(() => {
    loadOperators(1, false);
  }, [loadOperators]);

  // Drive the shared search hook off the global search term.
  useEffect(() => {
    operatorSearch.search(searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const sourceOperators = isSearchActive ? operatorSearch.results : operators;
  const isLoadingList = isSearchActive
    ? (operatorSearch.loading && operatorSearch.results.length === 0)
    : loading;
  const listError = isSearchActive ? operatorSearch.error : error;
  const hasMoreList = isSearchActive ? operatorSearch.hasMore : hasMoreOperators;
  const isLoadingMoreList = isSearchActive
    ? (operatorSearch.loading && operatorSearch.results.length > 0)
    : isLoadingMoreOperators;

  useEffect(() => {
    if (!hasMoreList || isLoadingMoreList || isLoadingList) return undefined;

    let debounceTimer = null;

    const handleScroll = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const scrollBottom = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        if (scrollBottom > documentHeight - OPERATOR_SCROLL_BOTTOM_OFFSET_PX) {
          if (isSearchActive) {
            operatorSearch.loadMore();
          } else {
            loadOperators(currentOperatorPage + 1, true);
          }
        }
      }, OPERATOR_SCROLL_DEBOUNCE_MS);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [hasMoreList, isLoadingMoreList, isLoadingList, isSearchActive, currentOperatorPage, loadOperators, operatorSearch]);

  useEffect(() => {
    fetchSiteOptions().then(setSiteOptions).catch(() => setSiteOptions([]));
  }, []);

  const getProfilePicUrl = useCallback(async (filePath) => {
    if (!filePath) return null;
    try {
      return await getOperatorProfilePicUrl(filePath);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!sourceOperators.length) return;

    const loadProfilePics = async () => {
      const urls = {};
      for (const op of sourceOperators) {
        if (op.profilePic?.filePath) {
          const url = await getProfilePicUrl(op.profilePic.filePath);
          if (url) urls[op.qatarId] = url;
        }
      }
      setProfilePicUrls(prev => ({ ...prev, ...urls }));
    };

    loadProfilePics();
  }, [sourceOperators, getProfilePicUrl]);

  const filteredAndSorted = useMemo(() => {
    // When searching, the backend has already matched on the query text —
    // only the tab (own/hired/mobilized/demobilized) filter is applied locally.
    const filtered = sourceOperators.filter((op) => matchesOperatorTab(op, activeTab));

    return [...filtered].sort((a, b) => {
      const av = (a[sortField] ?? '').toString().toLowerCase();
      const bv = (b[sortField] ?? '').toString().toLowerCase();
      return sortDirection === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [sourceOperators, activeTab, sortField, sortDirection]);

  const operatorsView = useMemo(() => filteredAndSorted.map((operator, index) => ({
    operator,
    index,
    status: getOperatorStatus(operator),
    picUrl: profilePicUrls[operator.qatarId],
    initials: getInitials(operator.name),
  })), [filteredAndSorted, profilePicUrls]);

  const selectedOperatorView = useMemo(() => {
    if (!selectedOperator) return null;
    const picUrl = profilePicUrls[selectedOperator.qatarId];
    const status = getOperatorStatus(selectedOperator);
    const toolkitsReversed = selectedOperator.toolkits?.length > 0
      ? selectedOperator.toolkits.slice().sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate))
      : [];
    return { operator: selectedOperator, picUrl, status, toolkitsReversed };
  }, [selectedOperator, profilePicUrls]);

  const handleSort = (field) => {
    setSortDirection(prev => sortField === field && prev === 'asc' ? 'desc' : 'asc');
    setSortField(field);
  };

  const handleTabSelect = (path) => setActiveTab(path[0]);

  const refreshOperator = (updated) => {
    setOperators(prev => prev.map(op => op._id === updated._id ? updated : op));
    if (selectedOperator?._id === updated._id) setSelectedOperator(updated);
  };

  const openAddForm = () => {
    setFormMode('add');
    setFormData(EMPTY_FORM);
    setProfilePicFile(null);
    setFormOpen(true);
  };

  const openEditForm = (operator) => {
    setFormMode('update');
    setFormData({
      _id: operator._id,
      id: operator.id,
      slNo: operator.slNo,
      uniqueCode: operator.uniqueCode,
      name: operator.name,
      userType: operator.userType,
      nationality: operator.nationality,
      sponsorship: operator.sponsorship,
      workingIn: operator.workingIn,
      doj: toInputDate(operator.doj),
      passportNo: operator.passportNo,
      passportExpiry: toInputDate(operator.passportExpiry),
      qatarId: operator.qatarId,
      qidExpiry: toInputDate(operator.qidExpiry),
      healthCardExpiry: toInputDate(operator.healthCardExpiry),
      licenceType: operator.licenceType,
      licenceExpiry: toInputDate(operator.licenceExpiry),
      labourContractExpiry: toInputDate(operator.labourContractExpiry),
      workmenCompensationAdded: operator.workmenCompensationAdded,
      contactNo: operator.contactNo,
      dob: toInputDate(operator.dob),
      email: operator.email,
      password: operator.password,
      equipmentNumber: operator.equipmentNumber,
      isVerified: operator.isVerified,
      toolkits: operator.toolkits || [],
      hired: operator.hired || false,
      hiredFrom: operator.hiredFrom || '',
    });
    setProfilePicFile(null);
    setFormOpen(true);
  };

  const uploadProfilePicture = async (qatarId) => {
    if (!profilePicFile) return null;
    setUploading(true);
    try {
      const res = await apiRequest(`/operators/profile`, 'POST', { qatarId }, {}, profilePicFile);
      if (!res.ok) throw new Error('Failed to upload profile picture');
      const result = await res.json();
      return result.data.profilePic;
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = async () => {
    try {
      const profilePicUrl = await uploadProfilePicture(formData.qatarId);
      const payload = { ...formData, ...(profilePicUrl && { profilePic: profilePicUrl }) };

      const isAdd = formMode === 'add';
      const url = isAdd
        ? `/users/operators`
        : `/operators/${selectedOperator._id}`;

      const res = await apiRequest(url, isAdd ? 'POST' : 'PUT', payload);
      if (!res.ok) throw new Error(`Failed to ${formMode} operator`);
      const result = await res.json();

      if (isAdd) {
        setOperators(prev => [...prev, result.data]);
      } else {
        setOperators(prev => prev.map(op => op.qatarId === result.data.qatarId ? result.data : op));
        if (selectedOperator?._id === formData._id) setSelectedOperator(result.data);
      }

      setFormOpen(false);
      setProfilePicFile(null);
    } catch (err) {
      console.error('Error submitting form:', err);
      alert(`Failed to ${formMode} operator: ${err.message}`);
    }
  };

  const handleCloseForm = () => setFormOpen(false);

  const handleFormFieldChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'sponsorship') {
        next.hired = value === 'HIRED';
        if (value !== 'HIRED') next.hiredFrom = '';
      }
      return next;
    });
  };

  const handleProfilePicFileChange = (field, file) => {
    if (field === 'profilePic') setProfilePicFile(file);
  };

  const handleDeleteClick = (operator) => {
    setOperatorToDelete(operator);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => setShowDeleteModal(false);

  const confirmDelete = async () => {
    if (!operatorToDelete) return;
    try {
      const response = await deleteOperator(operatorToDelete.qatarId);
      if (!response.ok) throw new Error('Failed to delete operator');

      setOperators(prev => prev.filter(op => op.qatarId !== operatorToDelete.qatarId));
      if (selectedOperator?.qatarId === operatorToDelete.qatarId) setSelectedOperator(null);
    } catch (err) {
      console.error('Error deleting operator:', err);
      alert(`Failed to delete operator: ${err.message}`);
    } finally {
      setShowDeleteModal(false);
      setOperatorToDelete(null);
    }
  };

  const handleSelectOperator = (operator) => setSelectedOperator(operator);

  const handleCloseOperatorDetails = () => {
    setSelectedOperator(null);
    setSidebarMinimized(false);
    setSidebarMaximized(false);
  };

  const handleSidebarMinimize = () => setSidebarMinimized(p => !p);

  const handleSidebarMaximize = () => {
    setSidebarMaximized(p => !p);
    setSidebarMinimized(false);
  };

  const handleShowFullScreen = (url) => { if (url) setFullScreenImage(url); };
  const handleCloseFullScreen = () => setFullScreenImage(null);

  const handleProfilePicError = (e) => {
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  const handleMobilizeClick = (operator) => {
    setSelectedOperatorForAction(operator);
    setMobilizeForm(MOBILIZE_FORM_DEFAULTS);
    setShowMobilizeModal(true);
  };

  const closeMobilizeModal = () => {
    setShowMobilizeModal(false);
    setSelectedOperatorForAction(null);
    setMobilizeForm(MOBILIZE_FORM_DEFAULTS);
  };

  const onMobilizeFormChange = (field, value) => {
    setMobilizeForm(prev => {
      if (field === 'deployType') {
        return { ...prev, deployType: value, site: value === 'company' ? '' : prev.site, clientCompany: value === 'site' ? '' : prev.clientCompany };
      }
      if (field.startsWith('rentRate.')) {
        const key = field.split('.')[1];
        return { ...prev, [field]: value, rentRate: { ...prev.rentRate, [key]: value } };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleMobilizeSubmit = async () => {
    if (!selectedOperatorForAction) return;
    setIsMobilizing(true);
    try {
      const { 'rentRate.basis': _basis, 'rentRate.rate': _rate, ...rest } = mobilizeForm;
      const payload = {
        operatorId: selectedOperatorForAction._id,
        ...rest,
        rentRate: {
          basis: mobilizeForm['rentRate.basis'] || 'daily',
          rate: Number(mobilizeForm['rentRate.rate']) || 0,
        },
      };
      const result = await mobilizeOperatorApi(payload);
      if (!result.ok) throw new Error(result.message || 'Failed to mobilize operator');
      refreshOperator(result.data.operator);
      closeMobilizeModal();
    } catch (err) {
      console.error('Error mobilizing operator:', err);
      alert(`Failed to mobilize operator: ${err.message}`);
    } finally {
      setIsMobilizing(false);
    }
  };

  const handleDemobilizeClick = (operator) => {
    setSelectedOperatorForAction(operator);
    setDemobilizeForm(DEMOBILIZE_FORM_DEFAULTS);
    setShowDemobilizeModal(true);
  };

  const closeDemobilizeModal = () => {
    setShowDemobilizeModal(false);
    setSelectedOperatorForAction(null);
    setDemobilizeForm(DEMOBILIZE_FORM_DEFAULTS);
  };

  const onDemobilizeFormChange = (field, value) => {
    setDemobilizeForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDemobilizeSubmit = async () => {
    if (!selectedOperatorForAction) return;
    setIsDemobilizing(true);
    try {
      const result = await demobilizeOperatorApi({
        operatorId: selectedOperatorForAction._id,
        ...demobilizeForm,
      });
      if (!result.ok) throw new Error(result.message || 'Failed to demobilize operator');
      refreshOperator(result.data.operator);
      closeDemobilizeModal();
    } catch (err) {
      console.error('Error demobilizing operator:', err);
      alert(`Failed to demobilize operator: ${err.message}`);
    } finally {
      setIsDemobilizing(false);
    }
  };

  const operatorFormFields = [
    { name: 'profilePic', label: 'Profile Picture', type: 'file', accept: 'image/*', currentPreview: profilePicUrls[formData.qatarId] || null },
    { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'qatarId', label: 'Qatar ID', type: 'text', placeholder: 'Qatar ID', required: true },
    { name: 'contactNo', label: 'Contact Number', type: 'text', placeholder: 'Contact number' },
    { name: 'email', label: 'Email', type: 'text', placeholder: 'Email' },
    { name: 'nationality', label: 'Nationality', type: 'allow-add-select', options: NATIONALITY_OPTIONS },
    { name: 'sponsorship', label: 'Sponsorship', type: 'allow-add-select', options: SPONSORSHIP_OPTIONS },
    ...(formData.sponsorship === 'HIRED' ? [{ name: 'hiredFrom', label: 'Hired From', type: 'text', placeholder: 'Company / organization name', required: true }] : []),
    { name: 'workingIn', label: 'Working In', type: 'allow-add-select', options: WORKING_IN_OPTIONS },
    { name: 'equipmentNumber', label: 'Equipment Number', type: 'text', placeholder: 'Equipment number' },
    { name: 'workmenCompensationAdded', label: 'Workmen Compensation', type: 'select', options: WORKMEN_COMPENSATION_OPTIONS },
    { name: 'passportNo', label: 'Passport Number', type: 'text', placeholder: 'Passport number' },
    { name: 'licenceType', label: 'Licence Type', type: 'allow-add-select', options: LICENCE_TYPE_OPTIONS },
    { name: 'dob', label: 'Date of Birth', type: 'date' },
    { name: 'doj', label: 'Date of Joining', type: 'date' },
    { name: 'passportExpiry', label: 'Passport Expiry', type: 'date' },
    { name: 'qidExpiry', label: 'QID Expiry', type: 'date' },
    { name: 'healthCardExpiry', label: 'Health Card Expiry', type: 'date' },
    { name: 'licenceExpiry', label: 'Licence Expiry', type: 'date' },
    { name: 'labourContractExpiry', label: 'Labour Contract Expiry', type: 'date' },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Password' },
    { name: 'isVerified', label: 'Verified Operator', type: 'checkbox' },
  ];

  const mobilizeFormFields = [
    { name: 'deployType', label: 'Deploy To', type: 'select', required: true, options: DEPLOY_TYPE_OPTIONS },
    { name: 'site', label: 'Site', type: 'search-select', placeholder: 'Search or add site...', disabled: mobilizeForm.deployType === 'company', options: siteOptions.map((s) => ({ label: s, value: s })) },
    { name: 'clientCompany', label: 'Client Company', type: 'text', placeholder: 'Enter client company name', disabled: mobilizeForm.deployType === 'site' },
    { name: 'regNo', label: 'Equipment Reg No (Optional)', type: 'text', placeholder: 'Link to equipment if applicable' },
    { name: 'designation', label: 'Designation', type: 'allow-add-select', options: DESIGNATION_OPTIONS },
    { name: 'shiftName', label: 'Shift (Optional)', type: 'select', options: SHIFT_OPTIONS },
    { name: 'rentRate.basis', label: 'Rent Basis (Optional)', type: 'select', options: RENT_BASIS_OPTIONS },
    { name: 'rentRate.rate', label: 'Rent Rate QAR (Optional)', type: 'number', placeholder: 'Enter rate amount' },
    { name: 'remarks', label: 'Remarks (Optional)', type: 'textarea', placeholder: 'Add any notes' },
  ];

  const demobilizeFormFields = [
    { name: 'remarks', label: 'Remarks (Optional)', type: 'textarea', placeholder: 'Add any notes' },
  ];

  const deleteModalMessage = `Are you sure you want to delete ${operatorToDelete?.name}? This action cannot be undone.`;

  return {
    loading: isLoadingList,
    error: listError,

    operatorsView,
    selectedOperatorView,
    fullScreenImage,
    activeTab,
    sortField,
    sortDirection,

    sidebarMinimized,
    sidebarMaximized,

    hasMoreOperators: hasMoreList,
    isLoadingMoreOperators: isLoadingMoreList,

    formMode,
    formData,
    formOpen,
    uploading,
    operatorFormFields,

    showDeleteModal,
    deleteModalMessage,

    showMobilizeModal,
    mobilizeForm,
    mobilizeFormFields,
    isMobilizing,
    selectedOperatorForAction,

    showDemobilizeModal,
    demobilizeForm,
    demobilizeFormFields,
    isDemobilizing,

    handleTabSelect,
    handleSort,

    openAddForm,
    openEditForm,
    handleFormSubmit,
    handleCloseForm,
    handleFormFieldChange,
    handleProfilePicFileChange,

    handleDeleteClick,
    handleCloseDeleteModal,
    confirmDelete,

    handleSelectOperator,
    handleCloseOperatorDetails,
    handleSidebarMinimize,
    handleSidebarMaximize,

    handleShowFullScreen,
    handleCloseFullScreen,
    handleProfilePicError,

    handleMobilizeClick,
    closeMobilizeModal,
    onMobilizeFormChange,
    handleMobilizeSubmit,

    handleDemobilizeClick,
    closeDemobilizeModal,
    onDemobilizeFormChange,
    handleDemobilizeSubmit,

    formatDate,
    isExpired,
  };
};

export default useOperator;