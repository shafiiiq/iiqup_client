import React, { useState, useEffect, useRef } from 'react';
import './Operators.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';
import { useSearch } from '../../context/SearchContext';
import Button from '../../common/Button/Button';
import Loader from '../../common/Loader/Loader';
import DevModal from '../../common/DevModal';

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
  const [devModalOpen, setDevModalOpen] = React.useState(false);
  const [devModalFileValues, setDevModalFileValues] = React.useState({});
  const [formMode, setFormMode] = useState('add');
  const [profilePicUrls, setProfilePicUrls] = useState({});
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [activeTab, setActiveTab] = useState('internal');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const [formData, setFormData] = useState({
    name: '',
    userType: 'operator',
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
    toolkits: [],
    hired: false,
    hiredFrom: ''
  });

  const operatorFormFields = [
    { name: 'profilePic', label: 'Profile Picture', type: 'file', accept: 'image/*', currentPreview: profilePicUrls[formData.qatarId] || null },
    { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'qatarId', label: 'Qatar ID', type: 'text', placeholder: 'Qatar ID', required: true },
    { name: 'contactNo', label: 'Contact Number', type: 'text', placeholder: 'Contact number' },
    { name: 'email', label: 'Email', type: 'text', placeholder: 'Email' },
    { name: 'nationality', label: 'Nationality', type: 'allow-add-select', placeholder: 'Select nationality', options: nationalityOptions },
    { name: 'sponsorship', label: 'Sponsorship', type: 'allow-add-select', placeholder: 'Select sponsorship', options: sponsorshipOptions },
    ...(formData.sponsorship === 'HIRED' ? [{
      name: 'hiredFrom',
      label: 'Hired From',
      type: 'text',
      placeholder: 'Enter company/organization name',
      required: true
    }] : []),
    { name: 'workingIn', label: 'Working In', type: 'allow-add-select', placeholder: 'Select location', options: workingInOptions },
    { name: 'equipmentNumber', label: 'Equipment Number', type: 'text', placeholder: 'Equipment number' },
    { name: 'workmenCompensationAdded', label: 'Workmen Compensation', type: 'select', options: [{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }] },
    { name: 'passportNo', label: 'Passport Number', type: 'text', placeholder: 'Passport number' },
    { name: 'licenceType', label: 'Licence Type', type: 'allow-add-select', placeholder: 'Select licence type', options: licenceTypeOptions },
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

  const filteredOperators = operators.filter(operator => {
    // Filter by tab
    const tabFilter = activeTab === 'internal'
      ? !operator.hired || operator.hired === false
      : operator.hired === true;

    // Filter by search term
    const searchFilter =
      operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operator.qatarId.includes(searchTerm) ||
      operator.uniqueCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operator.nationality.toLowerCase().includes(searchTerm.toLowerCase());

    return tabFilter && searchFilter;
  });

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

  const openAddForm = () => {
    setFormMode('add');
    setFormData({
      name: '',
      userType: 'operator',
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
      toolkits: [],
      hired: false,
      hiredFrom: ''
    });
    setNationalitySearchTerm('INDIAN');
    setSponsorshipSearchTerm('ATE');
    setWorkingInSearchTerm('ATE');
    setLicenceTypeSearchTerm('');
    setProfilePicFile(null);
    setDevModalOpen(true);
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
      toolkits: operator.toolkits || [],
      hired: operator.hired || false
    });
    setNationalitySearchTerm(operator.nationality);
    setSponsorshipSearchTerm(operator.sponsorship);
    setWorkingInSearchTerm(operator.workingIn);
    setLicenceTypeSearchTerm(operator.licenceType);
    setProfilePicFile(null);
    setDevModalOpen(true)
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
          `${END_POINT}/operators/update-operator/${selectedOperator._id}`,
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

      setDevModalOpen(false)
      setProfilePicFile(null);

    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Failed to ${formMode} operator: ${error.message}`);
    }
  };

  const deleteOperator = async (qatarId) => {
    if (!window.confirm('Are you sure you want to delete this operator?')) return;

    try {
      const response = await apiRequest(
        `${END_POINT}/operators/delete-operator/${qatarId}`,
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
          squircle="4xl"
          width="160px"
          height="38px"
          type="submit"
          textColor="white-200"
          shadowPosition="to-bottom"
          shadowColor="white-600"
        />
      </div>

      <div className="doc-details-tabs">
        <Button
          text="Company Operators"
          onClick={() => setActiveTab('internal')}
          colorScheme={activeTab === 'internal' ? 'amber-300' : 'amber-900'}
          variant="gradient"
          font="md"
          animation=""
          squircle="4xl"
          width="50%"
          height="48px"
          type="submit"
          textColor={activeTab === 'internal' ? 'black-300' : 'white-900'}
          shadowPosition="to-bottom"
          shadowColor="white-600"
        />
        <Button
          text="Hired Operators"
          onClick={() => setActiveTab('hired')}
          colorScheme={activeTab === 'hired' ? 'amber-400' : 'amber-900'}
          variant="gradient"
          font="md"
          animation=""
          squircle="4xl"
          width="50%"
          height="48px"
          type="submit"
          textColor={activeTab === 'hired' ? 'black-300' : 'white-900'}
          shadowPosition="to-bottom"
          shadowColor="white-600"
        />
      </div>

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
                      squircle="4xl"
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
                <div className='operators-table-container'>
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
                          <td colSpan="40" className="no-data">No toolkits assigned</td>
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
                  squircle="4xl"
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
          </div>
        </div>
      )}

      <DevModal
        isOpen={devModalOpen}
        onClose={() => setDevModalOpen(false)}
        type="form"
        title={formMode === 'add' ? 'Add New Operator' : 'Edit Operator'}
        buttonText={uploading ? 'Uploading...' : formMode === 'add' ? 'Add Operator' : 'Update Operator'}
        secondaryButtonText="Cancel"
        onSecondaryClick={() => setDevModalOpen(false)}
        onButtonClick={handleFormSubmit}
        formFields={operatorFormFields}
        formValues={formData}
        onFormChange={(fieldName, value) => {
          setFormData(prev => {
            const updated = { ...prev, [fieldName]: value };
            if (fieldName === 'sponsorship') {
              updated.hired = value === 'HIRED';
              if (value !== 'HIRED') updated.hiredFrom = '';
            }
            return updated;
          });
        }}
        fileValues={devModalFileValues}
        onFileChange={(fieldName, file) => {
          setDevModalFileValues(prev => ({ ...prev, [fieldName]: file }));
          setProfilePicFile(file);
        }}
      />
      <FullScreenImageViewer />
    </div>
  );
};

export default Operators;