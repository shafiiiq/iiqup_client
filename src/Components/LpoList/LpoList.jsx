import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { END_POINT } from '../../constants';
import './LpoList.css';
import { apiRequest } from '../../utils/api';
import { useHeaderTitle } from '../../Context/HeaderTitleContext';
import DevModal from '../../Common/DevModal/DevModal';
import Button from '../../Common/Button/Button';
import Loader from '../../Common/Loader/Loader';
import Toast from '../../Common/Toast/Toast';
import Tutorial from '../../Common/Tutorial/Tutorial';

function LpoList({ isAll, isEquip, isStock, isForAllEquip }) {
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const { regNo } = useParams()

  const [searchTerm, setSearchTerm] = useState('');
  const [lpos, setLpos] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLpo, setSelectedLpo] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ message: '', isError: false });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [pendingSignatures, setPendingSignatures] = useState([]);
  const [showPendingToast, setShowPendingToast] = useState(false);
  const [signedByUser, setSignedByUser] = useState([]);
  const [showLegendModal, setShowLegendModal] = useState(false);
  const [sigToast, setSigToast] = useState({ show: false, message: '', key: 0 });
  const [filters, setFilters] = useState({
    dateFilter: 'all',
    vendors: [],
    equipmentTypes: [],
    amountRange: { min: '', max: '' },
    lastMonthsCount: 6,
    customStartDate: '',
    customEndDate: ''
  });

  useEffect(() => {
    if (isAll) {
      setHeaderTitle('LPO List');
      setHeaderSubtitle('Of All');
    } else if (isEquip) {
      setHeaderTitle('LPO List');
      setHeaderSubtitle('Of Equipment');
    } else if (isStock) {
      setHeaderTitle('LPO List');
      setHeaderSubtitle('Of Stock');
    } else if (isForAllEquip) {
      setHeaderTitle('LPO List');
      setHeaderSubtitle('Of All Equipments');
    } else {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    }
    return () => {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    };
  }, [isAll, isEquip, isStock, isForAllEquip, setHeaderSubtitle, setHeaderTitle]);

  useEffect(() => {
    fetchLpos();
    fetchPendingSignatures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAll, isEquip, isStock, isForAllEquip, regNo]);

  const fetchLpos = async () => {
    let url = `${END_POINT}/lpo/get-all-lpo`;

    if (isEquip && regNo) {
      url = `${END_POINT}/lpo/get-lpo-by-regno/${regNo}`;
    } else if (isStock) {
      url = `${END_POINT}/lpo/get-lpo-of-stock`;
    } else if (isForAllEquip) {
      url = `${END_POINT}/lpo/get-lpo-of-all-equipments`;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest(url, 'GET');
      const data = await response.json()

      setLpos(data.data);
      setFilteredData(data.data);

    } catch (error) {
      console.error(`Error fetching LPO records:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const isPendingForUser = (lpoRef) => pendingSignatures.some(p => p.lpoRef === lpoRef);
  const isSignedByUser = (lpoRef) => signedByUser.some(s => s.lpoRef === lpoRef);

  const fetchPendingSignatures = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user?.uniqueCode) return;

      const [pendingRes, signedRes] = await Promise.all([
        apiRequest(`${END_POINT}/lpo/pending-signatures`, 'POST', { uniqueCode: encodeURIComponent(user.uniqueCode) }),
        apiRequest(`${END_POINT}/lpo/signed-by-user`, 'POST', { uniqueCode: encodeURIComponent(user.uniqueCode) }),
      ]);

      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingSignatures(data.data || []);
        if (data.count > 0) setShowPendingToast(true);
      }

      if (signedRes.ok) {
        const data = await signedRes.json();
        setSignedByUser(data.data || []);
      }
    } catch (error) {
      console.error('[LpoList] fetchPendingSignatures:', error);
    }
  };

  const getSignatureCount = (lpo) =>
    [lpo.pmSigned, lpo.managerSigned, lpo.ceoSigned, lpo.accountsSigned]
      .filter(Boolean).length;

  const getRowClass = (lpo) => {
    const { pmSigned, managerSigned, accountsSigned, ceoSigned } = lpo;
    const uploaded = ['lpo_uploaded', 'lpo_amended'].includes(lpo.workflowStatus);
    if (!uploaded) return '';

    // All signed
    if (managerSigned && pmSigned && accountsSigned && ceoSigned)
      return 'lpo-sig-all';

    // Your turn — highest priority after all-signed
    if (isPendingForUser(lpo.lpoRef))
      return 'lpo-sig-pending';

    // Specific signed combinations — listed from most complete to least
    // 3 signed
    if (managerSigned && pmSigned && accountsSigned && !ceoSigned) return 'lpo-sig-mgr-pm-acc';
    if (managerSigned && pmSigned && !accountsSigned && ceoSigned) return 'lpo-sig-mgr-pm-ceo';
    if (managerSigned && !pmSigned && accountsSigned && ceoSigned) return 'lpo-sig-mgr-acc-ceo';
    if (!managerSigned && pmSigned && accountsSigned && ceoSigned) return 'lpo-sig-pm-acc-ceo';

    // 2 signed
    if (managerSigned && pmSigned && !accountsSigned && !ceoSigned) return 'lpo-sig-mgr-pm';
    if (managerSigned && !pmSigned && accountsSigned && !ceoSigned) return 'lpo-sig-mgr-acc';
    if (managerSigned && !pmSigned && !accountsSigned && ceoSigned) return 'lpo-sig-mgr-ceo';
    if (!managerSigned && pmSigned && accountsSigned && !ceoSigned) return 'lpo-sig-pm-acc';
    if (!managerSigned && pmSigned && !accountsSigned && ceoSigned) return 'lpo-sig-pm-ceo';
    if (!managerSigned && !pmSigned && accountsSigned && ceoSigned) return 'lpo-sig-acc-ceo';

    // 1 signed
    if (managerSigned && !pmSigned && !accountsSigned && !ceoSigned) return 'lpo-sig-mgr-only';
    if (!managerSigned && pmSigned && !accountsSigned && !ceoSigned) return 'lpo-sig-pm-only';
    if (!managerSigned && !pmSigned && accountsSigned && !ceoSigned) return 'lpo-sig-acc-only';
    if (!managerSigned && !pmSigned && !accountsSigned && ceoSigned) return 'lpo-sig-ceo-only';

    // Nobody signed yet but uploaded
    return 'lpo-sig-none';
  };

  useEffect(() => {
    applyAllFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lpos, searchTerm, filters]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleRowClick = (lpoRef) => {
    navigate(`/lpo-details/${lpoRef}`);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const style = `
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1, p { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: center; }
        th { background-color: #f2f2f2; }
        .no-results { text-align: center; font-style: italic; }
      </style>
    `;

    const content = `
      <html>
        <head>
          <title>LPO List</title>
          ${style}
        </head>
        <body>
          <h1>LPO List</h1>
          ${searchTerm ? `<p>Search results for: "<strong>${searchTerm}</strong>"</p>` : ''}
          ${tableRef.current?.outerHTML || ''}
          <div style="margin-top: 10px; text-align: center;">
            Showing ${filteredData?.length || 0} ${searchTerm ? 'matching entries' : 'entries'}
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();

    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const handleDeleteClick = (e, lpo) => {
    e.stopPropagation();
    setSelectedLpo(lpo);
    setShowDeleteModal(true);
  };

  const handleAmendment = (e, lpo) => {
    e.stopPropagation();
    navigate(`/lpo-form/amendment/${encodeURIComponent(lpo.lpoRef)}`);
  };

  const confirmDelete = async () => {
    if (!selectedLpo) return;

    try {
      const response = await apiRequest(
        `${END_POINT}/lpo/delete-lpo/${selectedLpo.lpoRef}`,
        'DELETE'
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete LPO');
      }

      setShowDeleteModal(false);
      setDeleteStatus({
        message: `LPO ${selectedLpo.lpoRef} successfully deleted.`,
        isError: false
      });
      fetchLpos();
    } catch (error) {
      setShowDeleteModal(false);
      setDeleteStatus({
        message: 'Error deleting LPO: ' + error.message,
        isError: true
      });
      console.error('Error deleting LPO:', error);
    } finally {
      setShowStatusModal(true);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedLpo(null);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setDeleteStatus({ message: '', isError: false });
  };

  const handleViewLpo = (e, lpo) => {
    e.stopPropagation();
    navigate(`/lpo-doc/${encodeURIComponent(lpo.lpoRef)}`);
  };

  const handleAddLpo = () => {
    navigate(`/lpo-form/${regNo}`);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setShowFiltersModal(false);
    applyAllFilters();
  };

  const handleResetFilters = () => {
    setFilters({
      dateFilter: 'all',
      vendors: [],
      equipmentTypes: [],
      amountRange: { min: '', max: '' },
      lastMonthsCount: 6,
      customStartDate: '',
      customEndDate: ''
    });
    setFilteredData(lpos);
  };

  const applyAllFilters = () => {
    let filtered = [...lpos];

    if (filters.dateFilter === 'custom' && filters.customStartDate && filters.customEndDate) {
      filtered = filtered.filter(lpo => {
        const lpoDate = new Date(lpo.date);
        const startDate = new Date(filters.customStartDate);
        const endDate = new Date(filters.customEndDate);
        return lpoDate >= startDate && lpoDate <= endDate;
      });
    } else if (filters.dateFilter === 'lastXmonths') {
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - filters.lastMonthsCount);
      filtered = filtered.filter(lpo => new Date(lpo.date) >= monthsAgo);
    } else if (filters.dateFilter === 'thismonth') {
      const now = new Date();
      filtered = filtered.filter(lpo => {
        const lpoDate = new Date(lpo.date);
        return lpoDate.getMonth() === now.getMonth() &&
          lpoDate.getFullYear() === now.getFullYear();
      });
    }

    if (filters.vendors.length > 0) {
      filtered = filtered.filter(lpo =>
        filters.vendors.includes(lpo.company?.vendor)
      );
    }

    if (filters.equipmentTypes.length > 0) {
      filtered = filtered.filter(lpo =>
        filters.equipmentTypes.includes(lpo.equipment)
      );
    }

    if (filters.amountRange.min || filters.amountRange.max) {
      filtered = filtered.filter(lpo => {
        const amount = lpo.totalAmount;
        const min = filters.amountRange.min ? parseFloat(filters.amountRange.min) : 0;
        const max = filters.amountRange.max ? parseFloat(filters.amountRange.max) : Infinity;
        return amount >= min && amount <= max;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(lpo => {
        return Object.values(lpo).some(value => {
          if (typeof value === 'object' && value !== null) {
            return Object.values(value).some(v =>
              String(v).toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }

    setFilteredData(filtered);
  };

  return (
    <div className="lpo-container">
      <div className="controls-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search LPOs..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={handleClearSearch} className="clear-button">
              ×
            </button>
          )}
        </div>
        <div className="buttons-container">
            <Button
              text="Color Hint"
              onClick={() => setShowLegendModal(true)}
              colorScheme="cyan-700"
              variant="gradient"
              font="md"
              animation=""
              squircle="4xl"
              width="160px"
              height="38px"
              type="submit"
              textColor="white-200"
              shadowPosition="to-bottom"
              shadowColor="white-600"
            />
          <Button
            text="Filters"
            onClick={() => setShowFiltersModal(true)}
            colorScheme="violet-800"
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="160px"
            height="38px"
            type="submit"
            textColor="white-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
          {
            isAll || isStock || isForAllEquip
              ? ''
              : <Button
                text="Add LPO"
                onClick={handleAddLpo}
                colorScheme="lime-800"
                variant="gradient"
                font="md"
                animation=""
                squircle="4xl"
                width="160px"
                height="38px"
                type="submit"
                textColor="white-200"
                shadowPosition="to-bottom"
                shadowColor="white-600"
              />
          }
          <Button
            text="Print"
            onClick={handlePrint}
            colorScheme="amber-800"
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="160px"
            height="38px"
            type="submit"
            textColor="white-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
        </div>
      </div>

      <div className="table-info">
        {searchTerm ? (
          `Found ${filteredData?.length || 0} matching ${filteredData?.length === 1 ? 'entry' : 'entries'}`
        ) : (
          `Showing ${filteredData?.length || 0} entries`
        )}
      </div>

      <div className="lpo-table-container">
        <table className="lpo-table" ref={tableRef}>
          <thead>
            <tr>
              <th>LPO Ref</th>
              <th>Date</th>
              <th>Vendor</th>
              <th>Equipment</th>
              <th>Working HRS/ Running KM</th>
              <th>Items</th>
              <th>Complaint No</th>
              <th>Workflow Status</th>
                <th>Sign Status</th>
              <th>Amenmended</th>
              <th>Total Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <Loader />
            ) : filteredData && filteredData.length > 0 ? (
              filteredData.map((lpo) => (
                <tr
                  key={lpo._id}
                  data-lporef={lpo.lpoRef}
                  onClick={() => handleRowClick(lpo.lpoRef)}
                  className={`lpo-row ${getRowClass(lpo)}`}
                >
                  <td>{lpo.lpoRef}</td>
                  <td>{lpo.date}</td>
                  <td>{lpo.company.vendor}</td>
                  <td>{lpo.equipments[0]}</td>
                  <td>{lpo.workingHrs || lpo.runningKm || 'N/A'}</td>
                  <td>{lpo.items[0].description}</td>
                  <td>{lpo.complaintId ? lpo.complaintId : 'Normal LPO'}</td>
                  <td>
                    {lpo.workflowStatus === "lpo_created"
                      ? 'In Creation'
                      : (lpo.pmSigned && lpo.managerSigned && lpo.ceoSigned && lpo.accountsSigned)
                        ? 'Approved'
                        : 'In Approval'}
                  </td>
                  <td
                    className={`sig-cell ${getRowClass(lpo)}`}
                    onMouseEnter={() => {
                      const signed = [
                        lpo.managerSigned && 'Manager',
                        lpo.pmSigned && 'PM',
                        lpo.accountsSigned && 'Accounts',
                        lpo.ceoSigned && 'CEO',
                      ].filter(Boolean);
                      setSigToast({
                        show: true,
                        message: signed.length > 0 ? 'Signed by: ' + signed.join(' | ') : 'Nobody signed yet'
                      });
                    }}
                    onMouseLeave={() => setSigToast({ show: false, message: '' })}
                  ></td>
                  <td>{lpo.isAmendmented ? 'YES' : 'NO'}</td>
                  <td>{lpo.totalAmount.toFixed(2)}</td>
                  <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                    <Button
                      text="View"
                      onClick={(e) => handleViewLpo(e, lpo)}
                      colorScheme="amber-800"
                      variant="gradient"
                      font="md"
                      animation=""
                      squircle="4xl"
                      width="160px"
                      height="38px"
                      type="submit"
                      textColor="white-200"
                      shadowPosition="to-bottom"
                      shadowColor="white-600"
                    />
                    <Button
                      text="Delete"
                      onClick={(e) => handleDeleteClick(e, lpo)}
                      colorScheme="error-700"
                      variant="gradient"
                      font="md"
                      animation=""
                      squircle="4xl"
                      width="160px"
                      height="38px"
                      type="submit"
                      textColor="white-200"
                      shadowPosition="to-bottom"
                      shadowColor="white-600"
                    />
                    <Button
                      text="Amendment"
                      onClick={(e) => handleAmendment(e, lpo)}
                      colorScheme="yellow-500"
                      variant="gradient"
                      font="md"
                      animation=""
                      squircle="4xl"
                      width="160px"
                      height="38px"
                      type="submit"
                      textColor="black-200"
                      shadowPosition="to-bottom"
                      shadowColor="white-600"
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-results">
                  No LPO data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="close-btn" onClick={cancelDelete}>
                <span class="material-symbols-rounded">
                  close
                </span>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete LPO <strong>{selectedLpo?.lpoRef}</strong>?</p>
              <p>This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="action-btn cancel" onClick={cancelDelete}>Cancel</button>
              <button className="action-btn confirm-delete" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className={`modal-content ${deleteStatus.isError ? 'error' : 'success'}`}>
            <div className="modal-header">
              <h2>{deleteStatus.isError ? 'Error' : 'Success'}</h2>
              <button className="close-btn" onClick={closeStatusModal}>
                <span class="material-symbols-rounded">
                  close
                </span>
              </button>
            </div>
            <div className="modal-body">
              <p>{deleteStatus.message}</p>
            </div>
            <div className="modal-footer">
              <button className="action-btn ok" onClick={closeStatusModal}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Modal */}
      <DevModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        type="filters"
        title="LPO Filters"
        message="Customize your view with advanced filtering options"
        filterGroups={[
          {
            name: 'dateFilter',
            label: 'Date Range',
            type: 'select',
            options: [
              { value: 'all', label: 'All Time' },
              { value: 'thismonth', label: 'This Month' },
              { value: 'lastXmonths', label: 'Last X Months' },
              { value: 'custom', label: 'Custom Range' }
            ]
          },
          ...(filters.dateFilter === 'lastXmonths' ? [{
            name: 'lastMonthsCount',
            label: 'Number of Months',
            type: 'select',
            options: [
              { value: 1, label: '1 Month' },
              { value: 2, label: '2 Months' },
              { value: 3, label: '3 Months' },
              { value: 4, label: '4 Months' },
              { value: 5, label: '5 Months' },
              { value: 6, label: '6 Months' },
              { value: 7, label: '7 Months' },
              { value: 8, label: '8 Months' },
              { value: 9, label: '9 Months' },
              { value: 10, label: '10 Months' },
              { value: 11, label: '11 Months' },
              { value: 12, label: '12 Months' }
            ]
          }] : []),
          ...(filters.dateFilter === 'custom' ? [
            {
              name: 'customStartDate',
              label: 'Start Date',
              type: 'date'
            },
            {
              name: 'customEndDate',
              label: 'End Date',
              type: 'date'
            }
          ] : []),
          {
            name: 'vendors',
            label: 'Vendors',
            type: 'checkbox',
            options: [...new Set(lpos.map(lpo => lpo.company?.vendor).filter(Boolean))].map(v =>
              ({ value: v, label: v })
            )
          },
          {
            name: 'equipmentTypes',
            label: 'Equipment Types',
            type: 'checkbox',
            options: [...new Set(lpos.map(lpo => lpo.equipment).filter(Boolean))].map(e =>
              ({ value: e, label: e })
            )
          },
          {
            name: 'amountRange',
            label: 'Amount Range (SAR)',
            type: 'range'
          }
        ]}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        buttonText="Apply Filters"
      />

      {/* ── Signature colour legend — shown once on mount, user must close ── */}
      <DevModal
        isOpen={showLegendModal}
        onClose={() => setShowLegendModal(false)}
        type="hint"
        title="Signature Status Color Hint"
        modalWidth="680px"
        buttonText="Got it"
        onButtonClick={() => setShowLegendModal(false)}
        filterGroups={[
          {
            label: 'General',
            items: [
              { color: '#f52a2a', label: 'Nobody signed yet' },
              { color: '#3cbe15', label: 'All 4 signed — complete' },
              { color: '#d5e21f', label: 'Your signature is needed' },
            ]
          },
          {
            label: '1 Signed',
            items: [
              { color: '#ff600a', label: 'Manager only' },
              { color: '#12a5ca', label: 'PM only' },
              { color: '#db2777', label: 'Accounts only' },
              { color: '#eca50b', label: 'CEO only' },
            ]
          },
          {
            label: '2 Signed',
            items: [
              { color: '#0a9185', label: 'Manager + PM' },
              { color: '#7c3aed', label: 'Manager + Accounts' },
              { color: '#57534e', label: 'Manager + CEO' },
              { color: '#1d4ed8', label: 'PM + Accounts' },
              { color: '#65a30d', label: 'PM + CEO' },
              { color: '#be123c', label: 'Accounts + CEO' },
            ]
          },
          {
            label: '3 Signed',
            items: [
              { color: '#92400e', label: 'Manager + PM + Accounts' },
              { color: '#e40faf', label: 'Manager + PM + CEO' },
              { color: '#5a6b0d', label: 'Manager + Accounts + CEO' },
              { color: '#8924db', label: 'PM + Accounts + CEO' },
            ]
          },
          {
            label: 'No colour',
            items: [
              { color: 'rgba(255,255,255,0.08)', label: 'LPO not yet uploaded' },
            ]
          },
        ]}
      />

      {/* Signature status */}
      <Toast
        isOpen={sigToast.show}
        onClose={() => setSigToast({ show: false, message: '' })}
        type="info"
        message={sigToast.message}
        duration={0}
        position="top-center"
        showCloseButton={false}
      />

      {/* Signature alert */}
      <Toast
        isOpen={showPendingToast}
        onClose={() => setShowPendingToast(false)}
        type="warning"
        message={`You have ${pendingSignatures.length} LPO${pendingSignatures.length > 1 ? 's' : ''} pending your signature`}
        duration={6000}
        position="top-center"
        showActionButton
        actionButtonText="View"
        onActionClick={() => {
          setShowPendingToast(false);
          const firstPending = pendingSignatures[0];
          if (firstPending && tableRef.current) {
            const row = tableRef.current.querySelector(`[data-lporef="${firstPending.lpoRef}"]`);
            row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
      />
    </div>
  );
}

export default LpoList;