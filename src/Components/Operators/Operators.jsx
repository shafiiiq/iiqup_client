import React, { useState, useEffect, useRef } from 'react';
import './Operators.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';
import { useSearch } from '../../context/SearchContext';
import Button from '../../common/Button/Button';

const Operators = () => {
  const { searchTerm, setSearchTerm } = useSearch();

  // Predefined options
  const nationalityOptions = ['INDIAN', 'NEPALI', 'BANGLADESHI', 'PAKISTANI', 'SRI LANKAN', 'OTHER'];
  const sponsorshipOptions = ['ATE', 'ASK', 'HIRED'];
  const workingInOptions = ['ATE', 'SITE', 'OFFICE', 'ASK'];
  const licenceTypeOptions = ['Loader', 'Car', 'Bus', 'Med. Truck', 'Heavy Truck', 'Crane', 'Forklift'];

  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [profilePicUrls, setProfilePicUrls] = useState({});
  const [fullScreenImage, setFullScreenImage] = useState(null);

  // Sorting states
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const [formData, setFormData] = useState({
    id: '',
    slNo: '',
    name: '',
    userType: 'operator',
    uniqueCode: '',
    nationality: 'INDIAN',
    sponsorship: 'ATE',
    workingIn: 'ATE',
    doj: '',
    passportNo: '',
    passportExpiry: '',
    qatarId: '',
    qidExpiry: '',
    healthCardExpiry: '',
    licenceType: '',
    licenceExpiry: '',
    labourContractExpiry: '',
    workmenCompensationAdded: 'no',
    contactNo: '',
    dob: '',
    email: '',
    password: '',
    equipmentNumber: '',
    isVerified: false,
    toolkits: []
  });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Search states for dropdowns
  const [nationalitySearchTerm, setNationalitySearchTerm] = useState('');
  const [sponsorshipSearchTerm, setSponsorshipSearchTerm] = useState('');
  const [workingInSearchTerm, setWorkingInSearchTerm] = useState('');
  const [licenceTypeSearchTerm, setLicenceTypeSearchTerm] = useState('');

  // States for dropdown visibility
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [showSponsorshipDropdown, setShowSponsorshipDropdown] = useState(false);
  const [showWorkingInDropdown, setShowWorkingInDropdown] = useState(false);
  const [showLicenceTypeDropdown, setShowLicenceTypeDropdown] = useState(false);

  // Refs for dropdown components
  const nationalityDropdownRef = useRef(null);
  const sponsorshipDropdownRef = useRef(null);
  const workingInDropdownRef = useRef(null);
  const licenceTypeDropdownRef = useRef(null);

  // Refs for date inputs
  const dobRef = useRef(null);
  const dojRef = useRef(null);
  const passportExpiryRef = useRef(null);
  const qidExpiryRef = useRef(null);
  const healthCardExpiryRef = useRef(null);
  const licenceExpiryRef = useRef(null);
  const labourContractExpiryRef = useRef(null);

  // Filtered lists based on search term
  const filteredNationalities = nationalityOptions.filter(nationality =>
    nationality.toLowerCase().includes(nationalitySearchTerm.toLowerCase())
  );

  const filteredSponsorships = sponsorshipOptions.filter(sponsorship =>
    sponsorship.toLowerCase().includes(sponsorshipSearchTerm.toLowerCase())
  );

  const filteredWorkingIn = workingInOptions.filter(working =>
    working.toLowerCase().includes(workingInSearchTerm.toLowerCase())
  );

  const filteredLicenceTypes = licenceTypeOptions.filter(licence =>
    licence.toLowerCase().includes(licenceTypeSearchTerm.toLowerCase())
  );

  // Sorting function
  const handleSort = (field) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
  };

  // Get sorted operators
  const getSortedOperators = (operatorsToSort) => {
    return [...operatorsToSort].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle null/undefined values
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      // Convert to string for consistent comparison
      aValue = aValue.toString().toLowerCase();
      bValue = bValue.toString().toLowerCase();

      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  };

  // Load profile pic URLs when operators are fetched
  useEffect(() => {
    const loadProfilePics = async () => {
      const urls = {};

      for (const operator of operators) {
        if (operator.profilePic?.filePath) {
          const url = await getProfilePicUrl(operator.profilePic.filePath);
          if (url) {
            urls[operator.qatarId] = url;
          }
        }
      }

      setProfilePicUrls(urls);
    };

    if (operators.length > 0) {
      loadProfilePics();
    }
  }, [operators]);

  // Update current date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const dateString = `${day}-${month}-${year}`;

      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const timeString = `${hours}:${minutes} ${ampm}`;

      setCurrentDateTime(`${dateString}   |   ${timeString}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (nationalityDropdownRef.current && !nationalityDropdownRef.current.contains(event.target)) {
        setShowNationalityDropdown(false);
      }
      if (sponsorshipDropdownRef.current && !sponsorshipDropdownRef.current.contains(event.target)) {
        setShowSponsorshipDropdown(false);
      }
      if (workingInDropdownRef.current && !workingInDropdownRef.current.contains(event.target)) {
        setShowWorkingInDropdown(false);
      }
      if (licenceTypeDropdownRef.current && !licenceTypeDropdownRef.current.contains(event.target)) {
        setShowLicenceTypeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Apply dark mode to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);

  // Fetch operators data
  useEffect(() => {
    const fetchOperators = async () => {
      try {
        setLoading(true);
        const response = await apiRequest(`${END_POINT}/operators/get-all-operators`);
        if (!response.ok) throw new Error('Failed to fetch operators');
        const result = await response.json();
        setOperators(Array.isArray(result.data) ? result.data : []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error('Error fetching operators:', err);
      }
    };

    fetchOperators();
  }, []);

  // Filter and sort operators
  const filteredOperators = operators.filter(operator =>
    operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    operator.qatarId.includes(searchTerm) ||
    operator.uniqueCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    operator.nationality.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedAndFilteredOperators = getSortedOperators(filteredOperators);

  // Generate initials for profile picture placeholder
  const getInitials = (name) => {
    if (!name) return 'OP';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Check if date is expired
  const isExpired = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  // Calculate operator status
  const calculateOperatorStatus = (operator) => {
    const expiredDocs = [];
    if (isExpired(operator.passportExpiry)) expiredDocs.push('Passport');
    if (isExpired(operator.qidExpiry)) expiredDocs.push('QID');
    if (isExpired(operator.licenceExpiry)) expiredDocs.push('License');
    if (isExpired(operator.healthCardExpiry)) expiredDocs.push('Health Card');
    if (isExpired(operator.labourContractExpiry)) expiredDocs.push('Labour Contract');

    if (expiredDocs.length > 0) return 'expired';
    if (!operator.isVerified) return 'pending';
    return 'active';
  };

  // Show operator details
  const showDetails = (operator) => {
    setSelectedOperator(operator);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle date input clicks
  const handleDateInputClick = (ref) => {
    if (ref.current) {
      ref.current.showPicker();
    }
  };

  // Handle file selection for profile picture
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      setProfilePicFile(file);
    }
  };

  // Handle dropdown selections
  const handleNationalitySelect = (selected) => {
    setFormData({ ...formData, nationality: selected });
    setNationalitySearchTerm(selected);
    setShowNationalityDropdown(false);
  };

  const handleSponsorshipSelect = (selected) => {
    setFormData({ ...formData, sponsorship: selected });
    setSponsorshipSearchTerm(selected);
    setShowSponsorshipDropdown(false);
  };

  const handleWorkingInSelect = (selected) => {
    setFormData({ ...formData, workingIn: selected });
    setWorkingInSearchTerm(selected);
    setShowWorkingInDropdown(false);
  };

  const handleLicenceTypeSelect = (selected) => {
    setFormData({ ...formData, licenceType: selected });
    setLicenceTypeSearchTerm(selected);
    setShowLicenceTypeDropdown(false);
  };

  // Handle search input changes
  const handleNationalitySearchChange = (e) => {
    setNationalitySearchTerm(e.target.value);
    setShowNationalityDropdown(true);
  };

  const handleSponsorshipSearchChange = (e) => {
    setSponsorshipSearchTerm(e.target.value);
    setShowSponsorshipDropdown(true);
  };

  const handleWorkingInSearchChange = (e) => {
    setWorkingInSearchTerm(e.target.value);
    setShowWorkingInDropdown(true);
  };

  const handleLicenceTypeSearchChange = (e) => {
    setLicenceTypeSearchTerm(e.target.value);
    setShowLicenceTypeDropdown(true);
  };

  // Toggle dropdowns
  const toggleNationalityDropdown = () => {
    setShowNationalityDropdown(!showNationalityDropdown);
    setShowSponsorshipDropdown(false);
    setShowWorkingInDropdown(false);
    setShowLicenceTypeDropdown(false);
  };

  const toggleSponsorshipDropdown = () => {
    setShowSponsorshipDropdown(!showSponsorshipDropdown);
    setShowNationalityDropdown(false);
    setShowWorkingInDropdown(false);
    setShowLicenceTypeDropdown(false);
  };

  const toggleWorkingInDropdown = () => {
    setShowWorkingInDropdown(!showWorkingInDropdown);
    setShowNationalityDropdown(false);
    setShowSponsorshipDropdown(false);
    setShowLicenceTypeDropdown(false);
  };

  const toggleLicenceTypeDropdown = () => {
    setShowLicenceTypeDropdown(!showLicenceTypeDropdown);
    setShowNationalityDropdown(false);
    setShowSponsorshipDropdown(false);
    setShowWorkingInDropdown(false);
  };

  // Open add form
  const openAddForm = () => {
    setFormMode('add');
    setFormData({
      id: '',
      slNo: '',
      name: '',
      userType: 'operator',
      uniqueCode: '',
      nationality: 'INDIAN',
      sponsorship: 'ATE',
      workingIn: 'ATE',
      doj: '',
      passportNo: '',
      passportExpiry: '',
      qatarId: '',
      qidExpiry: '',
      healthCardExpiry: '',
      licenceType: '',
      licenceExpiry: '',
      labourContractExpiry: '',
      workmenCompensationAdded: 'no',
      contactNo: '',
      dob: '',
      email: '',
      password: '',
      equipmentNumber: '',
      isVerified: false,
      toolkits: []
    });
    setNationalitySearchTerm('INDIAN');
    setSponsorshipSearchTerm('ATE');
    setWorkingInSearchTerm('ATE');
    setLicenceTypeSearchTerm('');
    setProfilePicFile(null);
    setShowForm(true);
  };

  // Open edit form
  const openEditForm = (operator) => {
    setFormMode('update');
    setFormData({
      _id: operator._id,
      id: operator.id,
      slNo: operator.slNo,
      name: operator.name,
      userType: operator.userType,
      uniqueCode: operator.uniqueCode,
      nationality: operator.nationality,
      sponsorship: operator.sponsorship,
      workingIn: operator.workingIn,
      doj: operator.doj ? new Date(operator.doj).toISOString().split('T')[0] : '',
      passportNo: operator.passportNo,
      passportExpiry: operator.passportExpiry ? new Date(operator.passportExpiry).toISOString().split('T')[0] : '',
      qatarId: operator.qatarId,
      qidExpiry: operator.qidExpiry ? new Date(operator.qidExpiry).toISOString().split('T')[0] : '',
      healthCardExpiry: operator.healthCardExpiry ? new Date(operator.healthCardExpiry).toISOString().split('T')[0] : '',
      licenceType: operator.licenceType,
      licenceExpiry: operator.licenceExpiry ? new Date(operator.licenceExpiry).toISOString().split('T')[0] : '',
      labourContractExpiry: operator.labourContractExpiry ? new Date(operator.labourContractExpiry).toISOString().split('T')[0] : '',
      workmenCompensationAdded: operator.workmenCompensationAdded,
      contactNo: operator.contactNo,
      dob: operator.dob ? new Date(operator.dob).toISOString().split('T')[0] : '',
      email: operator.email,
      password: operator.password,
      equipmentNumber: operator.equipmentNumber,
      isVerified: operator.isVerified,
      toolkits: operator.toolkits || []
    });
    setNationalitySearchTerm(operator.nationality);
    setSponsorshipSearchTerm(operator.sponsorship);
    setWorkingInSearchTerm(operator.workingIn);
    setLicenceTypeSearchTerm(operator.licenceType);
    setProfilePicFile(null);
    setShowForm(true);
  };

  // Upload profile picture to S3
  const uploadProfilePicture = async (qatarId, name) => {
    if (!profilePicFile) return null;

    try {
      setUploading(true);
      const response = await apiRequest(
        `${END_POINT}/operators/upload-profile-pic`,
        'POST',
        { qatarId },
        {},
        profilePicFile
      );

      if (!response.ok) throw new Error('Failed to upload profile picture');
      const result = await response.json();
      return result.data.profilePic;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Form submit handler
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    try {
      let profilePicUrl = null;

      if (profilePicFile) {
        profilePicUrl = await uploadProfilePicture(formData.qatarId, formData.name);
      }

      const operatorData = {
        ...formData,
        ...(profilePicUrl && { profilePic: profilePicUrl })
      };

      let response;

      if (formMode === 'add') {
        response = await apiRequest(
          `${END_POINT}/operators/create-operator`,
          'POST',
          operatorData
        );
      } else {
        response = await apiRequest(
          `${END_POINT}/operators/operators/${formData.qatarId}`,
          'PUT',
          operatorData
        );
      }

      if (!response.ok) throw new Error(`Failed to ${formMode} operator`);
      const result = await response.json();

      if (formMode === 'add') {
        setOperators([...operators, result.data]);
      } else {
        setOperators(operators.map(op =>
          op.qatarId === result.data.qatarId ? result.data : op
        ));
        if (selectedOperator && selectedOperator._id === formData._id) {
          setSelectedOperator(result.data);
        }
      }

      setShowForm(false);
      setProfilePicFile(null);

    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Failed to ${formMode} operator: ${error.message}`);
    }
  };

  // Delete operator
  const deleteOperator = async (qatarId) => {
    if (!window.confirm('Are you sure you want to delete this operator?')) return;

    try {
      const response = await apiRequest(
        `${END_POINT}/operators/operators/${qatarId}`,
        'DELETE'
      );

      if (!response.ok) throw new Error('Failed to delete operator');

      setOperators(operators.filter(op => op.qatarId !== qatarId));
      if (selectedOperator && selectedOperator.qatarId === qatarId) {
        setSelectedOperator(null);
      }

    } catch (error) {
      console.error('Error deleting operator:', error);
      alert(`Failed to delete operator: ${error.message}`);
    }
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return '⇅';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getProfilePicUrl = async (filePath) => {
    if (!filePath) return null;

    try {
      const body = { key: filePath, isLong: false };
      const s3response = await apiRequest(`${END_POINT}/s3Config/get-pre-signed-url`, 'POST', body);

      if (!s3response.ok) return null;

      const s3URL = await s3response.json();
      return s3URL.dataUrl;
    } catch (error) {
      console.error('Error getting profile pic URL:', error);
      return null;
    }
  };

  const FullScreenImageViewer = () => {
    if (!fullScreenImage) return null;

    return (
      <div
        className="fullscreen-image-overlay"
        onClick={() => setFullScreenImage(null)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          cursor: 'pointer'
        }}
      >
        <button
          onClick={() => setFullScreenImage(null)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            fontSize: '30px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
        >
          ×
        </button>
        <img
          src={fullScreenImage}
          alt="Full screen"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '90%',
            maxHeight: '90%',
            objectFit: 'contain',
            borderRadius: '8px'
          }}
        />
      </div>
    );
  };

  return (
    <div className="operators-container">
      <div className="operators-actions">
        <Button
          text="Add Operator"
          onClick={openAddForm}
          colorScheme="lime-700"
          variant="gradient"
          font="md"
          animation=""
          rounded="md"
          width="160px"
          height="38px"
          type="submit"
          textColor="white-200"
          shadowPosition="to-bottom"
          shadowColor="white-600"
        />
      </div>

      {loading ? (
        <div className="loading">Loading operators...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="operators-table-container">
          <table className="operators-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Profile</th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  Name {getSortIcon('name')}
                </th>
                <th onClick={() => handleSort('qatarId')} style={{ cursor: 'pointer' }}>
                  Qatar ID {getSortIcon('qatarId')}
                </th>
                <th onClick={() => handleSort('uniqueCode')} style={{ cursor: 'pointer' }}>
                  Unique Code {getSortIcon('uniqueCode')}
                </th>
                <th onClick={() => handleSort('nationality')} style={{ cursor: 'pointer' }}>
                  Nationality {getSortIcon('nationality')}
                </th>
                <th onClick={() => handleSort('sponsorship')} style={{ cursor: 'pointer' }}>
                  Sponsorship {getSortIcon('sponsorship')}
                </th>
                <th onClick={() => handleSort('equipmentNumber')} style={{ cursor: 'pointer' }}>
                  Equipment No {getSortIcon('equipmentNumber')}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredOperators.map((operator, index) => (
                <tr key={operator._id || operator.qatarId}>
                  <td>{index + 1}</td>
                  <td>
                    <div
                      className="profile-pic-small"
                      onClick={() => profilePicUrls[operator.qatarId] && setFullScreenImage(profilePicUrls[operator.qatarId])}
                      style={{ cursor: profilePicUrls[operator.qatarId] ? 'pointer' : 'default' }}
                    >
                      {profilePicUrls[operator.qatarId] ? (
                        <img
                          src={profilePicUrls[operator.qatarId]}
                          alt={operator.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="profile-initials"
                        style={{
                          display: profilePicUrls[operator.qatarId] ? 'none' : 'flex'
                        }}
                      >
                        {getInitials(operator.name)}
                      </div>
                    </div>
                  </td>
                  <td>{operator.name}</td>
                  <td>{operator.qatarId}</td>
                  <td>{operator.uniqueCode}</td>
                  <td>{operator.nationality}</td>
                  <td>{operator.sponsorship}</td>
                  <td>{operator.equipmentNumber || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${calculateOperatorStatus(operator)}`}>
                      {calculateOperatorStatus(operator) === 'active' ? 'Active' :
                        calculateOperatorStatus(operator) === 'expired' ? 'Expired' : 'Pending'}
                    </span>
                  </td>
                  <td className="action-buttons">
                    <Button
                      text="Details"
                      onClick={() => showDetails(operator)}
                      colorScheme="orange-800"
                      variant="gradient"
                      font="md"
                      animation=""
                      rounded="md"
                      width="160px"
                      height="38px"
                      type="submit"
                      textColor="white-200"
                      shadowPosition="to-bottom"
                      shadowColor="white-600"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected operator details sidebar */}
      {selectedOperator && (
        <div className="operator-details">
          <div className="details-header">
            <h2>Operator Details</h2>
            <button className="close-btn" onClick={() => setSelectedOperator(null)}>
              <span class="material-symbols-rounded">
                close
              </span>
            </button>
          </div>
          <div className="details-content">
            <div className="operator-profile-section">
              <div
                className="profile-pic-large"
                onClick={() => profilePicUrls[selectedOperator.qatarId] && setFullScreenImage(profilePicUrls[selectedOperator.qatarId])}
                style={{ cursor: profilePicUrls[selectedOperator.qatarId] ? 'pointer' : 'default' }}
              >
                {profilePicUrls[selectedOperator.qatarId] ? (
                  <img
                    src={profilePicUrls[selectedOperator.qatarId]}
                    alt={selectedOperator.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="profile-initials-large"
                  style={{
                    display: profilePicUrls[selectedOperator.qatarId] ? 'none' : 'flex'
                  }}
                >
                  {getInitials(selectedOperator.name)}
                </div>
              </div>
              <div className="profile-info">
                <h3>{selectedOperator.name}</h3>
                <div className="operator-detail-item">
                  <span className="label">Qatar ID:</span>
                  <span className="value">{selectedOperator.qatarId}</span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">Unique Code:</span>
                  <span className="value">{selectedOperator.uniqueCode}</span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">Status:</span>
                  <span className={`value status-badge ${calculateOperatorStatus(selectedOperator)}`}>
                    {calculateOperatorStatus(selectedOperator) === 'active' ? 'Active' :
                      calculateOperatorStatus(selectedOperator) === 'expired' ? 'Expired' : 'Operator is not verified'}
                  </span>
                </div>
              </div>
            </div>

            <div className="details-grid">
              <div className="detail-group">
                <h4>Personal Information</h4>
                <div className="operator-detail-item">
                  <span className="label">Employee ID:</span>
                  <span className="value">{selectedOperator.id}</span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">Serial No:</span>
                  <span className="value">{selectedOperator.slNo}</span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">Nationality:</span>
                  <span className="value">{selectedOperator.nationality}</span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">Date of Birth:</span>
                  <span className="value">{formatDate(selectedOperator.dob)}</span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">Contact No:</span>
                  <span className="value">{selectedOperator.contactNo || 'N/A'}</span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">Email:</span>
                  <span className="value">{selectedOperator.email || 'N/A'}</span>
                </div>
              </div>

              <div className="detail-group">
                <h4>Employment Details</h4>
                <div className="operator-detail-item">
                  <span className="label">User Type:</span>
                  <span className="value">{selectedOperator.userType}</span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">Sponsorship:</span>
                  <span className="value">{selectedOperator.sponsorship}</span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">Working In:</span>
                  <span className="value">{selectedOperator.workingIn}</span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">Date of Joining:</span>
                  <span className="value">{formatDate(selectedOperator.doj)}</span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">Equipment Number:</span>
                  <span className="value">{selectedOperator.equipmentNumber || 'N/A'}</span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">Workmen Compensation:</span>
                  <span className="value">{selectedOperator.workmenCompensationAdded === 'yes' ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div className="detail-group">
                <h4>Document Details</h4>
                <div className="operator-detail-item">
                  <span className="label">Passport No:</span>
                  <span className="value">{selectedOperator.passportNo || 'N/A'}</span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">Passport Expiry:</span>
                  <span className={`value ${isExpired(selectedOperator.passportExpiry) ? 'expired' : ''}`}>
                    {formatDate(selectedOperator.passportExpiry)}
                    {isExpired(selectedOperator.passportExpiry) && ' (Expired)'}
                  </span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">QID Expiry:</span>
                  <span className={`value ${isExpired(selectedOperator.qidExpiry) ? 'expired' : ''}`}>
                    {formatDate(selectedOperator.qidExpiry)}
                    {isExpired(selectedOperator.qidExpiry) && ' (Expired)'}
                  </span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">Health Card Expiry:</span>
                  <span className={`value ${isExpired(selectedOperator.healthCardExpiry) ? 'expired' : ''}`}>
                    {formatDate(selectedOperator.healthCardExpiry)}
                    {isExpired(selectedOperator.healthCardExpiry) && ' (Expired)'}
                  </span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">License Type:</span>
                  <span className="value">{selectedOperator.licenceType || 'N/A'}</span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">License Expiry:</span>
                  <span className={`value ${isExpired(selectedOperator.licenceExpiry) ? 'expired' : ''}`}>
                    {formatDate(selectedOperator.licenceExpiry)}
                    {isExpired(selectedOperator.licenceExpiry) && ' (Expired)'}
                  </span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">Labour Contract Expiry:</span>
                  <span className={`value ${isExpired(selectedOperator.labourContractExpiry) ? 'expired' : ''}`}>
                    {formatDate(selectedOperator.labourContractExpiry)}
                    {isExpired(selectedOperator.labourContractExpiry) && ' (Expired)'}
                  </span>
                </div>
              </div>

              <div className="detail-group">
                <h4>System Information</h4>
                <div className="operator-detail-item">
                  <span className="label">Verified:</span>
                  <span className="value">{selectedOperator.isVerified ? 'Yes' : 'No'}</span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">Verified At:</span>
                  <span className="value">{formatDate(selectedOperator.verifiedAt)}</span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">Created At:</span>
                  <span className="value">{formatDate(selectedOperator.createdAt)}</span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">Last Updated:</span>
                  <span className="value">{formatDate(selectedOperator.updatedAt)}</span>
                </div>
                <div className="operator-detail-item">
                  <span className="label">Assigned Toolkits:</span>
                  <span className="value">{selectedOperator.toolkits && selectedOperator.toolkits.length > 0 ? selectedOperator.toolkits.length : 'None'}</span>
                </div>
              </div>

              <div className="detail-group">
                <h4>Assigned Safety Items</h4>
                <div>
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
                      {selectedOperator.toolkits.length > 0 ? (
                        selectedOperator.toolkits.slice().reverse().map((toolkit, index) => (
                          <tr key={toolkit._id}>
                            <td>{selectedOperator.toolkits.length - index}</td>
                            <td>{formatDate(toolkit.assignedDate)}</td>
                            <td>{toolkit.toolkitName}</td>
                            <td>{toolkit.color}</td>
                            <td>{toolkit.quantity}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="no-data">No toolkits assigned</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="operator-actions">
              <h3>Actions</h3>
              <div className="action-btn-group">
                <Button
                  text="Edit Operator"
                  onClick={() => openEditForm(selectedOperator)}
                  colorScheme="blue-700"
                  variant="gradient"
                  font="md"
                  animation=""
                  rounded="md"
                  width="160px"
                  height="38px"
                  type="submit"
                  textColor="white-200"
                  shadowPosition="to-bottom"
                  shadowColor="white-600"
                />
                <Button
                  text="Delete Operator"
                  onClick={() => deleteOperator(selectedOperator.qatarId)}
                  colorScheme="red-700"
                  variant="gradient"
                  font="md"
                  animation=""
                  rounded="md"
                  width="160px"
                  height="38px"
                  type="submit"
                  textColor="white-200"
                  shadowPosition="to-bottom"
                  shadowColor="white-600"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal for Add/Update Operator */}
      {showForm && (
        <div className="form-modal-overlay">
          <div className="form-modal large">
            <div className="form-header">
              <h2>{formMode === 'add' ? 'Add New Operator' : 'Edit Operator'}</h2>
              <button className="close-btn" onClick={() => setShowForm(false)}>
                <span class="material-symbols-rounded">
                  close
                </span>
              </button>
            </div>
            <div className="form-content">
              <form>
                <div className="form-section">
                  <h3>Profile Picture</h3>
                  <div className="profile-upload">
                    <div className="profile-preview">
                      {profilePicFile ? (
                        <img
                          src={URL.createObjectURL(profilePicFile)}
                          alt="Preview"
                          onClick={() => setFullScreenImage(URL.createObjectURL(profilePicFile))}
                          style={{ cursor: 'pointer' }}
                        />
                      ) : profilePicUrls[formData.qatarId] ? (
                        <img
                          src={profilePicUrls[formData.qatarId]}
                          alt="Current"
                          onClick={() => setFullScreenImage(profilePicUrls[formData.qatarId])}
                          style={{ cursor: 'pointer' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="profile-initials-form"
                        style={{
                          display: (profilePicFile || profilePicUrls[formData.qatarId]) ? 'none' : 'flex'
                        }}
                      >
                        {getInitials(formData.name)}
                      </div>
                    </div>
                    <label className="file-upload-btn">
                      Choose File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {profilePicFile && (
                      <span className="file-name">{profilePicFile.name}</span>
                    )}
                  </div>
                </div>

                <div className="form-section">
                  <h3>Basic Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Full Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="qatarId">Qatar ID *</label>
                      <input
                        type="text"
                        id="qatarId"
                        name="qatarId"
                        value={formData.qatarId}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="id">Employee ID *</label>
                      <input
                        type="number"
                        id="id"
                        name="id"
                        value={formData.id}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="slNo">Serial No *</label>
                      <input
                        type="number"
                        id="slNo"
                        name="slNo"
                        value={formData.slNo}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="uniqueCode">Unique Code *</label>
                      <input
                        type="text"
                        id="uniqueCode"
                        name="uniqueCode"
                        value={formData.uniqueCode}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="dob">Date of Birth</label>
                      <input
                        ref={dobRef}
                        type="date"
                        id="dob"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        onClick={() => handleDateInputClick(dobRef)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="contactNo">Contact Number</label>
                      <input
                        type="tel"
                        id="contactNo"
                        name="contactNo"
                        value={formData.contactNo}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Employment Details</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="nationality">Nationality</label>
                      <div className="custom-dropdown" ref={nationalityDropdownRef}>
                        <div className="dropdown-input-container">
                          <input
                            type="text"
                            id="nationality"
                            value={nationalitySearchTerm}
                            onChange={handleNationalitySearchChange}
                            onClick={toggleNationalityDropdown}
                            placeholder="Select nationality"
                            autoComplete="off"
                            required
                          />
                          <button type="button" className="dropdown-toggle" onClick={toggleNationalityDropdown}>
                            ▼
                          </button>
                        </div>
                        {showNationalityDropdown && (
                          <div className="dropdown-menu">
                            {filteredNationalities.length > 0 ? (
                              filteredNationalities.map((nationality, index) => (
                                <div
                                  key={index}
                                  className="dropdown-item"
                                  onClick={() => handleNationalitySelect(nationality)}
                                >
                                  {nationality}
                                </div>
                              ))
                            ) : nationalitySearchTerm.trim() !== '' ? (
                              <div className="dropdown-item new-item" onClick={() => handleNationalitySelect(nationalitySearchTerm)}>
                                Add "{nationalitySearchTerm}"
                              </div>
                            ) : (
                              <div className="no-results">No nationalities found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="sponsorship">Sponsorship</label>
                      <div className="custom-dropdown" ref={sponsorshipDropdownRef}>
                        <div className="dropdown-input-container">
                          <input
                            type="text"
                            id="sponsorship"
                            value={sponsorshipSearchTerm}
                            onChange={handleSponsorshipSearchChange}
                            onClick={toggleSponsorshipDropdown}
                            placeholder="Select sponsorship"
                            autoComplete="off"
                            required
                          />
                          <button type="button" className="dropdown-toggle" onClick={toggleSponsorshipDropdown}>
                            ▼
                          </button>
                        </div>
                        {showSponsorshipDropdown && (
                          <div className="dropdown-menu">
                            {filteredSponsorships.length > 0 ? (
                              filteredSponsorships.map((sponsorship, index) => (
                                <div
                                  key={index}
                                  className="dropdown-item"
                                  onClick={() => handleSponsorshipSelect(sponsorship)}
                                >
                                  {sponsorship}
                                </div>
                              ))
                            ) : sponsorshipSearchTerm.trim() !== '' ? (
                              <div className="dropdown-item new-item" onClick={() => handleSponsorshipSelect(sponsorshipSearchTerm)}>
                                Add "{sponsorshipSearchTerm}"
                              </div>
                            ) : (
                              <div className="no-results">No sponsorships found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="workingIn">Working In</label>
                      <div className="custom-dropdown" ref={workingInDropdownRef}>
                        <div className="dropdown-input-container">
                          <input
                            type="text"
                            id="workingIn"
                            value={workingInSearchTerm}
                            onChange={handleWorkingInSearchChange}
                            onClick={toggleWorkingInDropdown}
                            placeholder="Select working location"
                            autoComplete="off"
                          />
                          <button type="button" className="dropdown-toggle" onClick={toggleWorkingInDropdown}>
                            ▼
                          </button>
                        </div>
                        {showWorkingInDropdown && (
                          <div className="dropdown-menu">
                            {filteredWorkingIn.length > 0 ? (
                              filteredWorkingIn.map((working, index) => (
                                <div
                                  key={index}
                                  className="dropdown-item"
                                  onClick={() => handleWorkingInSelect(working)}
                                >
                                  {working}
                                </div>
                              ))
                            ) : workingInSearchTerm.trim() !== '' ? (
                              <div className="dropdown-item new-item" onClick={() => handleWorkingInSelect(workingInSearchTerm)}>
                                Add "{workingInSearchTerm}"
                              </div>
                            ) : (
                              <div className="no-results">No locations found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="doj">Date of Joining</label>
                      <input
                        ref={dojRef}
                        type="date"
                        id="doj"
                        name="doj"
                        value={formData.doj}
                        onChange={handleInputChange}
                        onClick={() => handleDateInputClick(dojRef)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="equipmentNumber">Equipment Number</label>
                      <input
                        type="text"
                        id="equipmentNumber"
                        name="equipmentNumber"
                        value={formData.equipmentNumber}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="workmenCompensationAdded">Workmen Compensation</label>
                      <select
                        id="workmenCompensationAdded"
                        name="workmenCompensationAdded"
                        value={formData.workmenCompensationAdded}
                        onChange={handleInputChange}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Document Details</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="passportNo">Passport Number</label>
                      <input
                        type="text"
                        id="passportNo"
                        name="passportNo"
                        value={formData.passportNo}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="passportExpiry">Passport Expiry</label>
                      <input
                        ref={passportExpiryRef}
                        type="date"
                        id="passportExpiry"
                        name="passportExpiry"
                        value={formData.passportExpiry}
                        onChange={handleInputChange}
                        onClick={() => handleDateInputClick(passportExpiryRef)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="qidExpiry">QID Expiry</label>
                      <input
                        ref={qidExpiryRef}
                        type="date"
                        id="qidExpiry"
                        name="qidExpiry"
                        value={formData.qidExpiry}
                        onChange={handleInputChange}
                        onClick={() => handleDateInputClick(qidExpiryRef)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="healthCardExpiry">Health Card Expiry</label>
                      <input
                        ref={healthCardExpiryRef}
                        type="date"
                        id="healthCardExpiry"
                        name="healthCardExpiry"
                        value={formData.healthCardExpiry}
                        onChange={handleInputChange}
                        onClick={() => handleDateInputClick(healthCardExpiryRef)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="licenceType">License Type</label>
                      <div className="custom-dropdown" ref={licenceTypeDropdownRef}>
                        <div className="dropdown-input-container">
                          <input
                            type="text"
                            id="licenceType"
                            value={licenceTypeSearchTerm}
                            onChange={handleLicenceTypeSearchChange}
                            onClick={toggleLicenceTypeDropdown}
                            placeholder="Select license type"
                            autoComplete="off"
                          />
                          <button type="button" className="dropdown-toggle" onClick={toggleLicenceTypeDropdown}>
                            ▼
                          </button>
                        </div>
                        {showLicenceTypeDropdown && (
                          <div className="dropdown-menu">
                            {filteredLicenceTypes.length > 0 ? (
                              filteredLicenceTypes.map((licence, index) => (
                                <div
                                  key={index}
                                  className="dropdown-item"
                                  onClick={() => handleLicenceTypeSelect(licence)}
                                >
                                  {licence}
                                </div>
                              ))
                            ) : licenceTypeSearchTerm.trim() !== '' ? (
                              <div className="dropdown-item new-item" onClick={() => handleLicenceTypeSelect(licenceTypeSearchTerm)}>
                                Add "{licenceTypeSearchTerm}"
                              </div>
                            ) : (
                              <div className="no-results">No license types found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="licenceExpiry">License Expiry</label>
                      <input
                        ref={licenceExpiryRef}
                        type="date"
                        id="licenceExpiry"
                        name="licenceExpiry"
                        value={formData.licenceExpiry}
                        onChange={handleInputChange}
                        onClick={() => handleDateInputClick(licenceExpiryRef)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="labourContractExpiry">Labour Contract Expiry</label>
                      <input
                        ref={labourContractExpiryRef}
                        type="date"
                        id="labourContractExpiry"
                        name="labourContractExpiry"
                        value={formData.labourContractExpiry}
                        onChange={handleInputChange}
                        onClick={() => handleDateInputClick(labourContractExpiryRef)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="password">Password</label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>System Settings</h3>
                  <div className="form-group">
                    <label htmlFor="isVerified">
                      <input
                        type="checkbox"
                        id="isVerified"
                        name="isVerified"
                        checked={formData.isVerified}
                        onChange={handleInputChange}
                      />
                      Verified Operator
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <Button
                    text="Cancel"
                    onClick={() => setShowForm(false)}
                    colorScheme="red-700"
                    variant="gradient"
                    font="md"
                    animation=""
                    rounded="md"
                    width="160px"
                    height="38px"
                    type="submit"
                    textColor="white-900"
                    shadowPosition="to-bottom"
                    shadowColor="white-600"
                  />
                  <Button
                    text={uploading ? 'Uploading...' : (formMode === 'add' ? 'Add Operator' : 'Update Operator')}
                    onClick={(e) => handleFormSubmit(e)}
                    colorScheme={uploading ? 'lime-900' : 'lime-500'}
                    variant="gradient"
                    font="md"
                    animation=""
                    rounded="md"
                    width="160px"
                    height="38px"
                    type={uploading ? 'disabled' : 'submit'}
                    textColor={uploading ? 'white-900' : 'black-500'}
                    shadowPosition="to-bottom"
                    shadowColor="white-600"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <FullScreenImageViewer />
    </div>
  );
};

export default Operators;