// ─────────────────────────────────────────────────────────────────────────────
// Operators.jsx — Operators list with add/edit/delete, details sidebar,
//                 profile picture upload, and fullscreen image viewer.
// Single file — all logic is tightly coupled to shared state. No splitting needed.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './Operators.css';

import { END_POINT }  from '../../constants';
import { apiRequest } from '../../utils/api';
import { useSearch }  from '../../context/SearchContext';

import Button   from '../../Common/Button/Button';
import Loader   from '../../Common/Loader/Loader';
import DevModal from '../../Common/DevModal/DevModal';

// ─────────────────────────────────────────────────────────────────────────────
// Static option lists — defined outside the component so they are never
// recreated. Safe to reference directly in the form fields config.
// ─────────────────────────────────────────────────────────────────────────────

const NATIONALITY_OPTIONS   = ['INDIAN', 'NEPALI', 'BANGLADESHI', 'PAKISTANI', 'SRI LANKAN', 'OTHER'];
const SPONSORSHIP_OPTIONS   = ['ATE', 'ASK', 'HIRED'];
const WORKING_IN_OPTIONS    = ['ATE', 'SITE', 'OFFICE', 'ASK'];
const LICENCE_TYPE_OPTIONS  = ['Loader', 'Car', 'Bus', 'Med. Truck', 'Heavy Truck', 'Crane', 'Forklift'];

// ─────────────────────────────────────────────────────────────────────────────
// Empty form — single source of truth for both "add" and "reset" paths
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name:                     '',
  userType:                 'operator',
  nationality:              'INDIAN',
  sponsorship:              'ATE',
  workingIn:                'ATE',
  doj:                      '',
  passportNo:               '',
  passportExpiry:           '',
  qatarId:                  '',
  qidExpiry:                '',
  healthCardExpiry:         '',
  licenceType:              '',
  licenceExpiry:            '',
  labourContractExpiry:     '',
  workmenCompensationAdded: 'no',
  contactNo:                '',
  dob:                      '',
  email:                    '',
  password:                 '',
  equipmentNumber:          '',
  isVerified:               false,
  toolkits:                 [],
  hired:                    false,
  hiredFrom:                '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers — no React, no side effects
// ─────────────────────────────────────────────────────────────────────────────

/** "AB" initials from a full name. Falls back to "OP". */
const getInitials = (name) => {
  if (!name) return 'OP';
  const parts = name.trim().split(' ');
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Locale date string or "N/A". */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

/** True when the date is in the past. */
const isExpired = (dateString) => {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
};

/**
 * Derives display status from document expiry and verification flag.
 * Returns 'expired' | 'pending' | 'active'.
 */
const getOperatorStatus = (operator) => {
  const docs = [
    operator.passportExpiry,
    operator.qidExpiry,
    operator.licenceExpiry,
    operator.healthCardExpiry,
    operator.labourContractExpiry,
  ];
  if (docs.some(isExpired)) return 'expired';
  if (!operator.isVerified)  return 'pending';
  return 'active';
};

/** Sort-icon character for a sortable column header. */
const getSortIcon = (field, sortField, sortDirection) => {
  if (sortField !== field) return '⇅';
  return sortDirection === 'asc' ? '↑' : '↓';
};

/** Converts a date value to "YYYY-MM-DD" for date inputs. */
const toInputDate = (value) =>
  value ? new Date(value).toISOString().split('T')[0] : '';

// ─────────────────────────────────────────────────────────────────────────────
// FullScreenImageViewer
// Defined OUTSIDE the parent component so React doesn't remount it on every
// parent render. Receives only what it needs.
// ─────────────────────────────────────────────────────────────────────────────

const FullScreenImageViewer = ({ src, onClose }) => {
  if (!src) return null;

  return (
    <div className="fullscreen-image-overlay" onClick={onClose}>
      <button className="fullscreen-close-btn" onClick={onClose}>×</button>
      <img
        src={src}
        alt="Full screen"
        className="fullscreen-image"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OperatorDetailItem — small presentational helper to avoid repeated JSX
// ─────────────────────────────────────────────────────────────────────────────

const DetailItem = ({ label, value, expired = false, className = '' }) => (
  <div className="operator-detail-item">
    <span className="label">{label}:</span>
    <span className={`value ${expired ? 'expired' : ''} ${className}`}>
      {value}
      {expired && ' (Expired)'}
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Operators Component
// ─────────────────────────────────────────────────────────────────────────────

const Operators = () => {
  const { searchTerm } = useSearch();

  // ── Data ───────────────────────────────────────────────────────────────────
  const [operators,      setOperators]      = useState([]);
  const [profilePicUrls, setProfilePicUrls] = useState({});
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);

  // ── UI State ───────────────────────────────────────────────────────────────
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [fullScreenImage,  setFullScreenImage]  = useState(null);
  const [activeTab,        setActiveTab]        = useState('internal');

  // ── Table Sorting ──────────────────────────────────────────────────────────
  const [sortField,     setSortField]     = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // ── Form / Modal ───────────────────────────────────────────────────────────
  const [formMode,      setFormMode]      = useState('add');
  const [formData,      setFormData]      = useState(EMPTY_FORM);
  const [formOpen,      setFormOpen]      = useState(false);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [uploading,     setUploading]     = useState(false);

  // ── Delete Confirmation ────────────────────────────────────────────────────
  const [showDeleteModal,   setShowDeleteModal]   = useState(false);
  const [operatorToDelete,  setOperatorToDelete]  = useState(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch Operators
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        setLoading(true);
        const response = await apiRequest(`${END_POINT}/operators/get-all-operators`);
        if (!response.ok) throw new Error('Failed to fetch operators');
        const result = await response.json();
        setOperators(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching operators:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOperators();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Profile Picture URL Loading (S3 pre-signed)
  // Runs after operators list changes. Builds a qatarId → url map.
  // ─────────────────────────────────────────────────────────────────────────

  const getProfilePicUrl = useCallback(async (filePath) => {
    if (!filePath) return null;
    try {
      const res = await apiRequest(`${END_POINT}/s3/get-pre-signed-url`, 'POST', { key: filePath, isLong: false });
      if (!res.ok) return null;
      const data = await res.json();
      return data.dataUrl;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!operators.length) return;

    const loadProfilePics = async () => {
      const urls = {};
      for (const op of operators) {
        if (op.profilePic?.filePath) {
          const url = await getProfilePicUrl(op.profilePic.filePath);
          if (url) urls[op.qatarId] = url;
        }
      }
      setProfilePicUrls(urls);
    };

    loadProfilePics();
  }, [operators, getProfilePicUrl]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived Data — memoised to avoid recomputation on every render
  // ─────────────────────────────────────────────────────────────────────────

  const filteredAndSorted = useMemo(() => {
    const q = searchTerm.toLowerCase();

    const filtered = operators.filter((op) => {
      const matchesTab = activeTab === 'internal'
        ? !op.hired || op.hired === false
        : op.hired === true;

      const matchesSearch = !q ||
        op.name.toLowerCase().includes(q)            ||
        op.qatarId.includes(searchTerm)              ||
        op.uniqueCode.toLowerCase().includes(q)      ||
        op.nationality.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      const av = (a[sortField] ?? '').toString().toLowerCase();
      const bv = (b[sortField] ?? '').toString().toLowerCase();
      return sortDirection === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [operators, activeTab, searchTerm, sortField, sortDirection]);

  // ─────────────────────────────────────────────────────────────────────────
  // Sorting
  // ─────────────────────────────────────────────────────────────────────────

  const handleSort = (field) => {
    setSortDirection(prev => sortField === field && prev === 'asc' ? 'desc' : 'asc');
    setSortField(field);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Form — Open / Close
  // ─────────────────────────────────────────────────────────────────────────

  const openAddForm = () => {
    setFormMode('add');
    setFormData(EMPTY_FORM);
    setProfilePicFile(null);
    setFormOpen(true);
  };

  const openEditForm = (operator) => {
    setFormMode('update');
    setFormData({
      _id:                      operator._id,
      id:                       operator.id,
      slNo:                     operator.slNo,
      uniqueCode:               operator.uniqueCode,
      name:                     operator.name,
      userType:                 operator.userType,
      nationality:              operator.nationality,
      sponsorship:              operator.sponsorship,
      workingIn:                operator.workingIn,
      doj:                      toInputDate(operator.doj),
      passportNo:               operator.passportNo,
      passportExpiry:           toInputDate(operator.passportExpiry),
      qatarId:                  operator.qatarId,
      qidExpiry:                toInputDate(operator.qidExpiry),
      healthCardExpiry:         toInputDate(operator.healthCardExpiry),
      licenceType:              operator.licenceType,
      licenceExpiry:            toInputDate(operator.licenceExpiry),
      labourContractExpiry:     toInputDate(operator.labourContractExpiry),
      workmenCompensationAdded: operator.workmenCompensationAdded,
      contactNo:                operator.contactNo,
      dob:                      toInputDate(operator.dob),
      email:                    operator.email,
      password:                 operator.password,
      equipmentNumber:          operator.equipmentNumber,
      isVerified:               operator.isVerified,
      toolkits:                 operator.toolkits || [],
      hired:                    operator.hired || false,
      hiredFrom:                operator.hiredFrom || '',
    });
    setProfilePicFile(null);
    setFormOpen(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Form Submit — Add / Update
  // ─────────────────────────────────────────────────────────────────────────

  const uploadProfilePicture = async (qatarId) => {
    if (!profilePicFile) return null;
    setUploading(true);
    try {
      const res = await apiRequest(`${END_POINT}/operators/upload-profile-pic`, 'POST', { qatarId }, {}, profilePicFile);
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
      const payload       = { ...formData, ...(profilePicUrl && { profilePic: profilePicUrl }) };

      const isAdd  = formMode === 'add';
      const url    = isAdd
        ? `${END_POINT}/operators/create-operator`
        : `${END_POINT}/operators/update-operator/${selectedOperator._id}`;

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

  // ─────────────────────────────────────────────────────────────────────────
  // Delete
  // ─────────────────────────────────────────────────────────────────────────

  const handleDeleteClick = (operator) => {
    setOperatorToDelete(operator);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!operatorToDelete) return;
    try {
      const res = await apiRequest(`${END_POINT}/operators/delete-operator/${operatorToDelete.qatarId}`, 'DELETE');
      if (!res.ok) throw new Error('Failed to delete operator');

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

  // ─────────────────────────────────────────────────────────────────────────
  // Form Fields Config
  // Defined inside the component (not at module level) because it references
  // dynamic state: formData.sponsorship, profilePicUrls, formData.qatarId.
  // ─────────────────────────────────────────────────────────────────────────

  const operatorFormFields = [
    { name: 'profilePic',               label: 'Profile Picture',          type: 'file',             accept: 'image/*', currentPreview: profilePicUrls[formData.qatarId] || null },
    { name: 'name',                     label: 'Full Name',                 type: 'text',             placeholder: 'Full name',              required: true },
    { name: 'qatarId',                  label: 'Qatar ID',                  type: 'text',             placeholder: 'Qatar ID',               required: true },
    { name: 'contactNo',                label: 'Contact Number',            type: 'text',             placeholder: 'Contact number' },
    { name: 'email',                    label: 'Email',                     type: 'text',             placeholder: 'Email' },
    { name: 'nationality',              label: 'Nationality',               type: 'allow-add-select', options: NATIONALITY_OPTIONS },
    { name: 'sponsorship',              label: 'Sponsorship',               type: 'allow-add-select', options: SPONSORSHIP_OPTIONS },
    ...(formData.sponsorship === 'HIRED' ? [{ name: 'hiredFrom', label: 'Hired From', type: 'text', placeholder: 'Company / organization name', required: true }] : []),
    { name: 'workingIn',                label: 'Working In',                type: 'allow-add-select', options: WORKING_IN_OPTIONS },
    { name: 'equipmentNumber',          label: 'Equipment Number',          type: 'text',             placeholder: 'Equipment number' },
    { name: 'workmenCompensationAdded', label: 'Workmen Compensation',      type: 'select',           options: [{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }] },
    { name: 'passportNo',               label: 'Passport Number',           type: 'text',             placeholder: 'Passport number' },
    { name: 'licenceType',              label: 'Licence Type',              type: 'allow-add-select', options: LICENCE_TYPE_OPTIONS },
    { name: 'dob',                      label: 'Date of Birth',             type: 'date' },
    { name: 'doj',                      label: 'Date of Joining',           type: 'date' },
    { name: 'passportExpiry',           label: 'Passport Expiry',           type: 'date' },
    { name: 'qidExpiry',                label: 'QID Expiry',                type: 'date' },
    { name: 'healthCardExpiry',         label: 'Health Card Expiry',        type: 'date' },
    { name: 'licenceExpiry',            label: 'Licence Expiry',            type: 'date' },
    { name: 'labourContractExpiry',     label: 'Labour Contract Expiry',    type: 'date' },
    { name: 'password',                 label: 'Password',                  type: 'password',         placeholder: 'Password' },
    { name: 'isVerified',               label: 'Verified Operator',         type: 'checkbox' },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Shared Button defaults for this page
  // ─────────────────────────────────────────────────────────────────────────

  const BTN = {
    variant: 'gradient', font: 'md', animation: '', squircle: '4xl',
    width: '160px', height: '38px', type: 'submit',
    shadowPosition: 'to-bottom', shadowColor: 'white-600',
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="operators-container">

      {/* ── Add Button ── */}
      <div className="operators-actions">
        <Button {...BTN} text="Add Operator" onClick={openAddForm} colorScheme="lime-700" textColor="white-200" />
      </div>

      {/* ── Tab Switcher ── */}
      <div className="doc-details-tabs">
        {[
          { key: 'internal', label: 'Company Operators', active: 'amber-300', inactive: 'amber-900' },
          { key: 'hired',    label: 'Hired Operators',   active: 'amber-400', inactive: 'amber-900' },
        ].map(({ key, label, active, inactive }) => (
          <Button
            key={key}
            {...BTN}
            width="50%"
            height="48px"
            text={label}
            onClick={() => setActiveTab(key)}
            colorScheme={activeTab === key ? active : inactive}
            textColor={activeTab === key ? 'black-300' : 'white-900'}
          />
        ))}
      </div>

      {/* ── Operators Table ── */}
      {loading ? (
        <Loader />
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="operators-table-container">
          <table className="operators-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Profile</th>
                {[
                  ['name',            'Name'          ],
                  ['qatarId',         'Qatar ID'      ],
                  ['uniqueCode',      'Unique Code'   ],
                  ['nationality',     'Nationality'   ],
                  ['sponsorship',     'Sponsorship'   ],
                  ['equipmentNumber', 'Equipment No'  ],
                ].map(([field, label]) => (
                  <th key={field} onClick={() => handleSort(field)} style={{ cursor: 'pointer' }}>
                    {label} {getSortIcon(field, sortField, sortDirection)}
                  </th>
                ))}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((operator, index) => {
                // Compute status once per row — not 3× in JSX
                const status    = getOperatorStatus(operator);
                const picUrl    = profilePicUrls[operator.qatarId];
                const initials  = getInitials(operator.name);

                return (
                  <tr key={operator._id || operator.qatarId}>
                    <td>{index + 1}</td>

                    {/* Profile picture / initials */}
                    <td>
                      <div
                        className="profile-pic-small"
                        onClick={() => picUrl && setFullScreenImage(picUrl)}
                        style={{ cursor: picUrl ? 'pointer' : 'default' }}
                      >
                        {picUrl && (
                          <img
                            src={picUrl}
                            alt={operator.name}
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        )}
                        <div className="profile-initials" style={{ display: picUrl ? 'none' : 'flex' }}>
                          {initials}
                        </div>
                      </div>
                    </td>

                    <td>{operator.name}</td>
                    <td>{operator.qatarId}</td>
                    <td>{operator.uniqueCode}</td>
                    <td>{operator.nationality}</td>
                    <td>{operator.sponsorship}</td>
                    <td>{operator.equipmentNumber || 'N/A'}</td>

                    {/* Status badge */}
                    <td>
                      <span className={`status-badge ${status}`}>
                        {status === 'active' ? 'Active' : status === 'expired' ? 'Expired' : 'Pending'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="action-buttons">
                      <Button {...BTN} text="Details" onClick={() => setSelectedOperator(operator)} colorScheme="orange-800" textColor="white-200" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Selected Operator Details Sidebar ── */}
      {selectedOperator && (() => {
        const op     = selectedOperator;
        const picUrl = profilePicUrls[op.qatarId];
        const status = getOperatorStatus(op);

        return (
          <div className="operator-details">
            <div className="details-header">
              <h2>Operator Details</h2>
              <button className="close-btn" onClick={() => setSelectedOperator(null)}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <div className="details-content">

              {/* Profile section */}
              <div className="operator-profile-section">
                <div
                  className="profile-pic-large"
                  onClick={() => picUrl && setFullScreenImage(picUrl)}
                  style={{ cursor: picUrl ? 'pointer' : 'default' }}
                >
                  {picUrl && (
                    <img
                      src={picUrl}
                      alt={op.name}
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  )}
                  <div className="profile-initials-large" style={{ display: picUrl ? 'none' : 'flex' }}>
                    {getInitials(op.name)}
                  </div>
                </div>

                <div className="profile-info">
                  <h3>{op.name}</h3>
                  <DetailItem label="Qatar ID"    value={op.qatarId}     />
                  <DetailItem label="Unique Code" value={op.uniqueCode}  />
                  <DetailItem
                    label="Status"
                    value={status === 'active' ? 'Active' : status === 'expired' ? 'Expired' : 'Operator is not verified'}
                    className={`status-badge ${status}`}
                  />
                </div>
              </div>

              {/* Detail groups */}
              <div className="details-grid">

                <div className="detail-group">
                  <h4>Personal Information</h4>
                  <DetailItem label="Employee ID"  value={op.id}                            />
                  <DetailItem label="Serial No"    value={op.slNo}                          />
                  <DetailItem label="Nationality"  value={op.nationality}                   />
                  <DetailItem label="Date of Birth" value={formatDate(op.dob)}              />
                  <DetailItem label="Contact No"   value={op.contactNo || 'N/A'}            />
                  <DetailItem label="Email"        value={op.email     || 'N/A'}            />
                </div>

                <div className="detail-group">
                  <h4>Employment Details</h4>
                  <DetailItem label="User Type"    value={op.userType}                      />
                  <DetailItem label="Sponsorship"  value={op.sponsorship}                   />
                  <DetailItem label="Working In"   value={op.workingIn}                     />
                  <DetailItem label="Date of Joining" value={formatDate(op.doj)}            />
                  <DetailItem label="Equipment Number" value={op.equipmentNumber || 'N/A'} />
                  <DetailItem label="Workmen Compensation" value={op.workmenCompensationAdded === 'yes' ? 'Yes' : 'No'} />
                </div>

                <div className="detail-group">
                  <h4>Document Details</h4>
                  <DetailItem label="Passport No"   value={op.passportNo || 'N/A'}                                          />
                  <DetailItem label="Passport Expiry"       value={formatDate(op.passportExpiry)}       expired={isExpired(op.passportExpiry)}       />
                  <DetailItem label="QID Expiry"            value={formatDate(op.qidExpiry)}            expired={isExpired(op.qidExpiry)}            />
                  <DetailItem label="Health Card Expiry"    value={formatDate(op.healthCardExpiry)}     expired={isExpired(op.healthCardExpiry)}     />
                  <DetailItem label="License Type"          value={op.licenceType || 'N/A'}                                                        />
                  <DetailItem label="License Expiry"        value={formatDate(op.licenceExpiry)}        expired={isExpired(op.licenceExpiry)}        />
                  <DetailItem label="Labour Contract Expiry" value={formatDate(op.labourContractExpiry)} expired={isExpired(op.labourContractExpiry)} />
                </div>

                <div className="detail-group">
                  <h4>System Information</h4>
                  <DetailItem label="Verified"         value={op.isVerified ? 'Yes' : 'No'}    />
                  <DetailItem label="Verified At"      value={formatDate(op.verifiedAt)}        />
                  <DetailItem label="Created At"       value={formatDate(op.createdAt)}         />
                  <DetailItem label="Last Updated"     value={formatDate(op.updatedAt)}         />
                  <DetailItem label="Assigned Toolkits" value={op.toolkits?.length || 'None'}  />
                </div>

                {/* Toolkits table */}
                <div className="detail-group">
                  <h4>Assigned Safety Items</h4>
                  <div className="operators-table-container">
                    <table className="operators-table">
                      <thead>
                        <tr>
                          <th>SL NO</th>
                          <th>Handovered Date</th>
                          <th>Name</th>
                          <th>Color</th>
                          <th>Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {op.toolkits?.length > 0 ? (
                          op.toolkits.slice().reverse().map((toolkit, i) => (
                            <tr key={toolkit._id}>
                              <td>{op.toolkits.length - i}</td>
                              <td>{formatDate(toolkit.assignedDate)}</td>
                              <td>{toolkit.toolkitName}</td>
                              <td>{toolkit.color}</td>
                              <td>{toolkit.quantity}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="5" className="no-data">No toolkits assigned</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="operator-actions">
                <h3>Actions</h3>
                <div className="action-btn-group">
                  <Button {...BTN} text="Edit Operator"   onClick={() => openEditForm(op)}       colorScheme="blue-700" textColor="white-200" />
                  <Button {...BTN} text="Delete Operator" onClick={() => handleDeleteClick(op)}  colorScheme="red-700"  textColor="white-200" />
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Add / Edit Form Modal ── */}
      <DevModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        type="form"
        title={formMode === 'add' ? 'Add New Operator' : 'Edit Operator'}
        buttonText={uploading ? 'Uploading...' : formMode === 'add' ? 'Add Operator' : 'Update Operator'}
        secondaryButtonText="Cancel"
        onSecondaryClick={() => setFormOpen(false)}
        onButtonClick={handleFormSubmit}
        formFields={operatorFormFields}
        formValues={formData}
        onFormChange={(field, value) => {
          setFormData(prev => {
            const next = { ...prev, [field]: value };
            // Keep the `hired` flag in sync with sponsorship
            if (field === 'sponsorship') {
              next.hired    = value === 'HIRED';
              if (value !== 'HIRED') next.hiredFrom = '';
            }
            return next;
          });
        }}
        onFileChange={(field, file) => {
          if (field === 'profilePic') setProfilePicFile(file);
        }}
      />

      {/* ── Delete Confirmation Modal ── */}
      <DevModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        type="error"
        title="Delete Operator?"
        message={`Are you sure you want to delete ${operatorToDelete?.name}? This action cannot be undone.`}
        buttonText="Delete"
        secondaryButtonText="Cancel"
        onButtonClick={confirmDelete}
        onSecondaryClick={() => setShowDeleteModal(false)}
      />

      {/* ── Fullscreen Image Viewer ── */}
      <FullScreenImageViewer src={fullScreenImage} onClose={() => setFullScreenImage(null)} />
    </div>
  );
};

export default Operators;