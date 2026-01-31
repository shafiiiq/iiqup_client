import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import './ServiceForm.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';
import { useHeaderTitle } from '../../context/HeaderTitleContext';
import Button from '../../common/Button/Button';
import { useAlert } from '../../context/AlertContext';
import { useHeaderVibration } from '../../context/HeaderVibrationContext';
import Input from '../../common/Input/Input';
import Toast from '../../common/Toast/Toast';

const ServiceForm = ({ initialData = {} }) => {
  const navigate = useNavigate();
  const locationState = useLocation();
  const id = locationState.state?.id;
  const { serviceType, historyId } = useParams();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const { showAlert } = useAlert();
  const { triggerVibration } = useHeaderVibration();
  const timeoutRef = useRef(null);
  const hasLoadedHistoryRef = useRef(false);

  const [currentDateTime, setCurrentDateTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [originalDate, setOriginalDate] = useState('');

  const [toastConfig, setToastConfig] = useState({
    isOpen: false,
    type: 'success',
    message: '',
    textColor: '#ffffff'
  });
  const [formData, setFormData] = useState({
    serviceHrs: '',
    regNo: '',
    nextServiceHrs: '',
    machine: initialData.machine || '',
    mechanics: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    operatorName: initialData.operatorName || '',
    remarks: '',
  });
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, description: 'Change Engine oil & Filter', status: '' },
    { id: 2, description: 'Change Fuel Filter', status: '' },
    { id: 3, description: 'Check/Clean Air Filter', status: '' },
    { id: 4, description: 'Check Transmission Filter', status: '' },
    { id: 5, description: 'Check Power Steering Oil', status: '' },
    { id: 6, description: 'Check Hydraulic Oil', status: '' },
    { id: 7, description: 'Check Brake', status: '' },
    { id: 8, description: 'Check Tyre Air Pressure', status: '' },
    { id: 9, description: 'Check Oil Leak', status: '' },
    { id: 10, description: 'Check Battery Condition', status: '' },
    { id: 11, description: 'Check Wiper & Water', status: '' },
    { id: 12, description: 'Check All Lights', status: '' },
    { id: 13, description: 'Check All Horns', status: '' },
    { id: 14, description: 'Check Parking Brake', status: '' },
    { id: 15, description: 'Check Differential Oil', status: '' },
    { id: 16, description: 'Check Rod Water & Hoses', status: '' },
    { id: 17, description: 'Lubricants All Points', status: '' },
    { id: 18, description: 'Check Gear Shift System', status: '' },
    { id: 19, description: 'Check Clutch System', status: '' },
    { id: 20, description: 'Check Wheel Nut', status: '' },
    { id: 21, description: 'Check Starter & Alternator', status: '' },
    { id: 22, description: 'Check Number Plate both', status: '' },
    { id: 23, description: 'Check Paint', status: '' },
    { id: 24, description: 'Check Tires', status: '' },
    { id: 25, description: 'Check Silencer', status: '' },
    { id: 26, description: 'Replace Hydraulic Oil- Filter', status: '' },
    { id: 27, description: 'Replace Transmission Oil', status: '' },
    { id: 28, description: 'Replace Differential Oil', status: '' },
    { id: 29, description: 'Replace Steering Box Oil', status: '' },
    { id: 30, description: 'Check Engine Valve Clearence', status: '' },
    { id: 31, description: 'Replace clutch fluid', status: '' },
    { id: 32, description: 'Check Brake Lining', status: '' },
    { id: 33, description: 'Change Drive Belt', status: '' },
    { id: 34, description: 'Check A/C filter', status: '' },
    { id: 35, description: 'Check Water Seperator', status: '' },
  ]);

  useEffect(() => {
    if (historyId && serviceType && !hasLoadedHistoryRef.current) {
      hasLoadedHistoryRef.current = true;
      setIsLoadingData(true);

      const fetchServiceHistory = async () => {
        try {
          const response = await apiRequest(
            `${END_POINT}/service-history/get-service-history-by/${serviceType}/${historyId}`
          );
          const result = await response.json();

          if (result.ok && result.data) {
            const historyData = result.data;

            let formattedDate = new Date().toISOString().split('T')[0];
            if (historyData.date) {
              if (historyData.date.includes('T')) {
                formattedDate = historyData.date.split('T')[0];
              } else if (/^\d{2}-\d{2}-\d{4}$/.test(historyData.date)) {
                const [day, month, year] = historyData.date.split('-');
                formattedDate = `${year}-${month}-${day}`;
              } else if (/^\d{4}-\d{2}-\d{2}$/.test(historyData.date)) {
                formattedDate = historyData.date;
              }
            }

            setFormData(prev => ({
              ...prev,
              regNo: historyData.equipmentNo || historyData.regNo || '',
              date: formattedDate,
              serviceHrs: historyData.runningHours || historyData.serviceHrs || '',
              nextServiceHrs: historyData.nextServiceHrs || 0,
              mechanics: historyData.mechanics || '',
              location: historyData.location || '',
              remarks: historyData.workRemarks || historyData.remarks || '',
            }));

            if (serviceType === 'tyre') {
              setChecklistItems(prev =>
                prev.map(item => ({
                  ...item,
                  status: (item.id === 8 || item.id === 24) ? '✓' : ''
                }))
              );
            } else if (serviceType === 'battery') {
              setChecklistItems(prev =>
                prev.map(item => ({
                  ...item,
                  status: item.id === 10 ? '✓' : ''
                }))
              );
            } else if (serviceType === 'normal' || serviceType === 'oil') {
              const oil = historyData.oil || '';
              const oilFilter = historyData.oilFilter || '';
              const fuelFilter = historyData.fuelFilter || '';
              const airFilter = historyData.airFilter || '';
              const acFilter = historyData.acFilter || '';
              const waterSeparator = historyData.waterSeparator || '';

              setChecklistItems(prev =>
                prev.map(item => {
                  if (item.id === 1) {
                    const desc =
                      oilFilter === 'Check' && oil === 'Check' ? 'Check Engine oil & Filter' :
                        oilFilter === 'Check' && oil === 'Change' ? 'Checked Filter & Changed Engine oil' :
                          oilFilter === 'Change' && oil === 'Check' ? 'Checked Engine oil & Changed Filter' :
                            'Change Engine oil & Filter';
                    return { ...item, description: desc, status: '✓' };
                  } else if (item.id === 2) {
                    return { ...item, description: fuelFilter === 'Check' ? 'Check Fuel Filter' : 'Change Fuel Filter', status: '✓' };
                  } else if (item.id === 3) {
                    return { ...item, description: airFilter === 'Change' ? 'Check/Change Air Filter' : 'Check/Clean Air Filter', status: '✓' };
                  } else if (item.id === 34) {
                    return { ...item, description: acFilter === 'Check' ? 'Check A/C filter' : 'Clean A/C filter' };
                  } else if (item.id === 35) {
                    return { ...item, description: waterSeparator === 'Check' ? 'Check Water Seperator' : 'Change Water Seperator' };
                  } else if (item.id >= 4 && item.id <= 24) {
                    return { ...item, status: '✓' };
                  }
                  return item;
                })
              );
            } else if (serviceType === 'maintenance') {
              setChecklistItems(prev =>
                prev.map(item => ({ ...item, status: '' }))
              );
            }

            setIsLoadingData(false);
          } else {
            setIsLoadingData(false);
            showAlert('Failed to load service history data', 'error', '--color-error-500');
            triggerVibration();
          }
        } catch (error) {
          setIsLoadingData(false);
          console.error('Error fetching service history:', error);
          showAlert('Error loading service history data', 'error', '--color-error-500');
          triggerVibration();
        }
      };

      fetchServiceHistory();
    }
  }, [historyId, serviceType]);

  useEffect(() => {
    if (formData.regNo) {
      const title = isUpdateMode ? 'Update Service Report' : 'Service Report Form'
      const subtitle = `${formData.regNo}`
      setHeaderTitle(title);
      setHeaderSubtitle(subtitle);
    } else {
      setHeaderTitle('Service History');
      setHeaderSubtitle(null);
    }

    return () => {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    };
  }, [formData.regNo, isUpdateMode]);

  useEffect(() => {
    if (id) {
      setIsUpdateMode(true);
      setIsLoadingData(true);

      const fetchServiceReport = async () => {
        try {
          const response = await apiRequest(`${END_POINT}/service-report/getwith/${id}`);
          const data = await response.json()

          if (data.ok && data.data) {
            const existingData = data.data;

            let formattedDate = '';
            if (existingData[0].date) {
              const dateStr = existingData[0].date;

              if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
                const [day, month, year] = dateStr.split('-');
                formattedDate = `${year}-${month}-${day}`;
              }
              else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                formattedDate = dateStr;
              }
              else {
                const parsedDate = new Date(dateStr);
                if (!isNaN(parsedDate)) {
                  formattedDate = parsedDate.toISOString().split('T')[0];
                }
              }
            }

            // Store original date
            setOriginalDate(formattedDate);

            setFormData({
              serviceHrs: existingData[0].serviceHrs || '',
              regNo: existingData[0].regNo || '',
              nextServiceHrs: existingData[0].nextServiceHrs || '',
              machine: existingData[0].machine || '',
              mechanics: existingData[0].mechanics || '',
              location: existingData[0].location || '',
              date: formattedDate,
              operatorName: existingData[0].operatorName || '',
              remarks: existingData[0].remarks || '',
            });

            if (existingData.checklistItems && existingData.checklistItems.length > 0) {
              setChecklistItems(existingData.checklistItems);
            }
          } else {
            showAlert('Failed to load service report data', 'error', '--color-error-500');
            triggerVibration();
          }
        } catch (error) {
          console.error(`Error fetching service report:`, error);
          showAlert('Error loading service report data', 'error', '--color-error-500');
          triggerVibration();
        } finally {
          setIsLoadingData(false);
        }
      };

      fetchServiceReport();
    }
  }, [id]);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      // Format date as DD-MM-YY
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const dateString = `${day}-${month}-${year}`;

      // Format time in AM/PM
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // Convert 0 to 12
      const timeString = `${hours}:${minutes} ${ampm}`;

      setCurrentDateTime(`${dateString}   |   ${timeString}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchEquipmentByRegNo() {
      if (!formData.regNo || isUpdateMode) return;

      try {
        const response = await apiRequest(`${END_POINT}/equipments/get-equipment/${formData.regNo}`, 'GET');
        const data = await response.json();

        if (data && data.data && data.data.length > 0) {
          const equipment = data.data[0];

          setFormData(prevData => ({
            ...prevData,
            machine: equipment.machine || '',
            operatorName: equipment.certificationBody?.[equipment.certificationBody.length - 1] || '',
          }));
        }
      } catch (error) {
        console.error('Error fetching equipment:', error);
      }
    }

    fetchEquipmentByRegNo();
  }, [formData.regNo, isUpdateMode]);

  const showToast = (message, type = 'success', textColor = '#ffffff') => {
    setToastConfig({
      isOpen: true,
      type,
      message,
      textColor
    });
  };

  const validateForm = () => {
    // Check required fields
    if (!formData.serviceHrs) {
      showToast('Service Hrs/Km is required', 'error', '#ffffff');
      return false;
    }
    if (!formData.regNo) {
      showToast('Registration Number is required', 'error', '#ffffff');
      return false;
    }
    if (formData.nextServiceHrs == null) {
      showToast('Next Service Hrs/Km is required', 'error', '#ffffff');
      return false;
    }
    if (!formData.machine) {
      showToast('Machine name is required', 'error', '#ffffff');
      return false;
    }
    if (!formData.mechanics) {
      showToast('Mechanics name is required', 'warning', '#000000');
      return false;
    }
    if (!formData.location) {
      showToast('Location is required', 'warning', '#000000');
      return false;
    }
    if (!formData.operatorName) {
      showToast('Operator Name is required', 'error', '#ffffff');
      return false;
    }

    return true;
  };

  const handleRemarksChange = async (e) => {

    let { value } = e.target;
    if (value.length === 1) {
      value = value.charAt(0).toUpperCase();
    }
    value = value.replace(/\.\s+([a-z])/g, (match, letter) => '. ' + letter.toUpperCase());

    setFormData({ ...formData, remarks: value });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      if (value.trim()) {
        try {
          const response = await fetch('https://api.languagetool.org/v2/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `text=${encodeURIComponent(value)}&language=en-US`
          });

          const result = await response.json();

          let fixed = value;
          result.matches.reverse().forEach(match => {
            if (match.replacements.length > 0) {
              fixed = fixed.substring(0, match.offset) +
                match.replacements[0].value +
                fixed.substring(match.offset + match.length);
            }
          });

          if (fixed !== value) {
            setFormData({ ...formData, remarks: fixed });
          }
        } catch (error) {
          console.error('Grammar check error:', error);
        }
      }
    }, 1500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleStatusChange = (id, status) => {
    setChecklistItems(
      checklistItems.map(item =>
        item.id === id ? { ...item, status } : item
      )
    );
  };

  const checkAllInRange = (startId, endId, status) => {
    setChecklistItems(
      checklistItems.map(item =>
        (item.id >= startId && item.id <= endId) ? { ...item, status } : item
      )
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: '' });

    const completeData = {
      ...formData,
      checklistItems
    };

    if (isUpdateMode && id) {
      completeData.previousDate = originalDate;
    }

    completeData.serviceType = serviceType;

    if (historyId) {
      completeData.historyId = historyId
    }

    const url = isUpdateMode
      ? `${END_POINT}/service-report/updatewith/${id}`
      : `${END_POINT}/service-report/add-service-report`;

    const method = isUpdateMode ? 'PUT' : 'POST';

    try {
      const data = await apiRequest(url, method, completeData);

      const successMessage = isUpdateMode
        ? 'Service report updated successfully!'
        : 'Service report added successfully!';

      showAlert(`${successMessage}`, 'done_all', '--color-primary');
      triggerVibration();

      setTimeout(() => {
        const responseData = data.data || formData;

        navigate(`/service-doc/${responseData.regNo}/${formatDate(responseData.date)}/${serviceType}/${historyId}`);
      }, 1500);
    } catch (error) {
      console.error(`Error ${isUpdateMode ? 'updating' : 'adding'} service record:`, error);
      const errorMessage = isUpdateMode
        ? 'Failed to update service record. Please try again.'
        : 'Failed to add service record. Please try again.';

      showAlert(`${errorMessage}`, 'error', '--color-error-500');
      triggerVibration();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (isUpdateMode) {
      setMessage({ text: 'Reset functionality in update mode would reload original data.', type: 'info' });
      return;
    }

    setFormData({
      serviceHrs: '',
      regNo: '',
      nextServiceHrs: '',
      machine: initialData.machine || '',
      mechanics: '',
      location: '',
      date: new Date().toISOString().split('T')[0],
      operatorName: initialData.operatorName || '',
      remarks: '',
    });
    setChecklistItems(checklistItems.map(item =>
      item.id <= 24 ? { ...item, status: '✓' } : { ...item, status: '' }
    ));
    setMessage({ text: '', type: '' });
  };

  return (
    <div className="service-form-container">
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="form-container">
        <form className="service-form">
          <div className="form-section">
            <h3 className="section-title">Service Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <Input
                  type="text"
                  id="serviceHrs"
                  name="serviceHrs"
                  value={formData.serviceHrs}
                  onChange={handleInputChange}
                  required="true"
                  colorScheme="yellow-300"
                  textColor="black-100"
                  label='Service Hrs/ Km'
                  labelBgColor='transparent'
                  labelSize='3xl'
                  labelColor='yellow-300'
                  placeholder="Enter service hrs"
                  placeholderColor="black-300"
                  variant="gradient"
                  width="100%"
                  height="57px"
                  squircle="4xl"
                  fontWeight='500'
                  inputPaddingInline="2xl"
                  inputPaddingBlock="xl"
                />
              </div>

              <div className="form-group">
                <Input
                  type="text"
                  id="regNo"
                  name="regNo"
                  value={formData.regNo}
                  onChange={handleInputChange}
                  required="true"
                  colorScheme="yellow-300"
                  textColor="black-100"
                  label='Reg No'
                  labelBgColor='transparent'
                  labelSize='3xl'
                  labelColor='yellow-300'
                  placeholder="Enter equipment registration number"
                  placeholderColor="black-300"
                  variant="gradient"
                  width="100%"
                  height="57px"
                  squircle="4xl"
                  fontWeight='500'
                  inputPaddingInline="2xl"
                  inputPaddingBlock="xl"
                />
              </div>

              <div className="form-group">
                <Input
                  type="text"
                  id="nextServiceHrs"
                  name="nextServiceHrs"
                  value={formData.nextServiceHrs}
                  onChange={handleInputChange}
                  required="true"
                  colorScheme="yellow-300"
                  textColor="black-100"
                  label='Next Service Hrs/ Km'
                  labelBgColor='transparent'
                  labelSize='3xl'
                  labelColor='yellow-300'
                  placeholder="Enter next service hrs"
                  placeholderColor="black-300"
                  variant="gradient"
                  width="100%"
                  height="57px"
                  squircle="4xl"
                  fontWeight='500'
                  inputPaddingInline="2xl"
                  inputPaddingBlock="xl"
                />
              </div>

              <div className="form-group">
                <Input
                  type="text"
                  id="machine"
                  name="machine"
                  value={formData.machine}
                  onChange={handleInputChange}
                  required="true"
                  colorScheme="yellow-300"
                  textColor="black-100"
                  label='Machine'
                  labelBgColor='transparent'
                  labelSize='3xl'
                  labelColor='yellow-300'
                  placeholder="Enter equipment name"
                  placeholderColor="black-300"
                  variant="gradient"
                  width="100%"
                  height="57px"
                  squircle="4xl"
                  fontWeight='500'
                  inputPaddingInline="2xl"
                  inputPaddingBlock="xl"
                />
              </div>

              <div className="form-group">
                <Input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required="true"
                  colorScheme="yellow-300"
                  textColor="black-100"
                  label='Date'
                  labelBgColor='transparent'
                  labelSize='3xl'
                  labelColor='yellow-300'
                  placeholder="Enter equipment name"
                  placeholderColor="black-300"
                  variant="gradient"
                  width="100%"
                  height="57px"
                  squircle="10xl"
                  fontWeight='500'
                  inputPaddingInline="2xl"
                  inputPaddingBlock="xl"
                />
              </div>

              <div className="form-group">
                <Input
                  type="text"
                  id="mechanics"
                  name="mechanics"
                  value={formData.mechanics}
                  onChange={handleInputChange}
                  required="true"
                  colorScheme="yellow-300"
                  textColor="black-100"
                  label='Mechanics'
                  labelBgColor='transparent'
                  labelSize='3xl'
                  labelColor='yellow-300'
                  placeholder="Enter equipment name"
                  placeholderColor="black-300"
                  variant="gradient"
                  width="100%"
                  height="57px"
                  squircle="4xl"
                  fontWeight='500'
                  inputPaddingInline="2xl"
                  inputPaddingBlock="xl"
                />
              </div>

              <div className="form-group">
                <Input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required="true"
                  colorScheme="yellow-300"
                  textColor="black-100"
                  label='Location'
                  labelBgColor='transparent'
                  labelSize='3xl'
                  labelColor='yellow-300'
                  placeholder="Enter equipment name"
                  placeholderColor="black-100"
                  variant="gradient"
                  width="100%"
                  height="57px"
                  squircle="4xl"
                  fontWeight='500'
                  inputPaddingInline="2xl"
                  inputPaddingBlock="xl"
                />
              </div>

              <div className="form-group">
                <Input
                  type="text"
                  id="operatorName"
                  name="operatorName"
                  value={formData.operatorName}
                  onChange={handleInputChange}
                  required="true"
                  colorScheme="yellow-300"
                  textColor="black-100"
                  label='Operator Name'
                  labelBgColor='transparent'
                  labelSize='3xl'
                  labelColor='yellow-300'
                  placeholder="Enter equipment name"
                  placeholderColor="black-300"
                  variant="gradient"
                  width="100%"
                  height="57px"
                  squircle="4xl"
                  fontWeight='500'
                  inputPaddingInline="2xl"
                  inputPaddingBlock="xl"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Remarks</h3>
            <div className="form-group">
              <Input
                type="textarea"
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleRemarksChange}
                required="true"
                colorScheme="yellow-300"
                textColor="black-100"
                labelBgColor='transparent'
                placeholder="Enter any additional remarks"
                placeholderColor="black-300"
                variant="gradient"
                width="100%"
                fullWidth="true"
                height="157px"
                squircle="30xl"
                fontSize='6xl'
                fontWeight='500'
                inputPaddingInline="2xl"
                inputPaddingBlock="xl"
                spellCheck="true"
                rows={10}
              />
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Checklist Items</h3>

            <div className="checklist-grid">
              <div className="checklist-column">
                <div className="checklist-actions">
                  <span>Items 1-24</span>
                  <div className="checklist-buttons">
                    <Button
                      text="YES"
                      onClick={() => checkAllInRange(1, 24, '✓')}
                      colorScheme="lime-300"
                      variant="gradient"
                      font="md"
                      squircle="4xl"
                      width="80px"
                      height="45px"
                      type="button"
                      textColor="black-200"
                      shadowPosition="to-bottom"
                      shadowColor="white-600"
                    />
                    <Button
                      text="NO"
                      onClick={() => checkAllInRange(1, 24, '✗')}
                      colorScheme="red-500"
                      variant="gradient"
                      font="md"
                      squircle="4xl"
                      width="80px"
                      height="45px"
                      type="button"
                      textColor="white-200"
                      shadowPosition="to-bottom"
                      shadowColor="white-600"
                    />
                    <Button
                      text="BLANK"
                      onClick={() => checkAllInRange(1, 24, '--')}
                      colorScheme="gray-500"
                      variant="gradient"
                      font="md"
                      squircle="4xl"
                      width="80px"
                      height="45px"
                      type="button"
                      textColor="white-200"
                      shadowPosition="to-bottom"
                      shadowColor="white-600"
                    />
                  </div>
                </div>

                <div className="checklist-items">
                  {checklistItems.slice(0, 24).map((item) => (
                    <div key={item.id} className="checklist-item">
                      <div className="item-number">{item.id}.</div>
                      <div className="item-description">{item.description}</div>
                      <div className="item-status">
                        <Input
                          type="radio"
                          id="yes"
                          name={`status-${item.id}`}
                          checked={item.status === '✓'}
                          onChange={(e) => handleStatusChange(item.id, '✓')}
                          required="true"
                          colorScheme="lime-700"
                          textColor="black-100"
                          labelBgColor='transparent'
                          size='xs'
                          variant="gradient"
                          borderWidth='2'
                          borderColor='lime-300'
                          onCheckedColor="lime-100"
                          onCheckedSize="sm"
                          rounded="4xl"
                        />
                        <Input
                          type="radio"
                          id="no"
                          name={`status-${item.id}`}
                          checked={item.status === '✗'}
                          onChange={(e) => handleStatusChange(item.id, '✗')}
                          colorScheme="red-700"
                          textColor="black-100"
                          labelBgColor='transparent'
                          size='xs'
                          variant="gradient"
                          borderWidth='2'
                          borderColor='red-500'
                          onCheckedColor="red-100"
                          onCheckedSize="sm"
                          rounded="4xl"
                        />
                        <Input
                          type="radio"
                          id="no"
                          name={`status-${item.id}`}
                          checked={item.status === '--'}
                          onChange={() => handleStatusChange(item.id, '--')}
                          required="true"
                          colorScheme="gray-700"
                          textColor="black-100"
                          labelBgColor='transparent'
                          size='xs'
                          variant="gradient"
                          borderWidth='2'
                          onCheckedColor="gray-100"
                          onCheckedSize="sm"
                          rounded="4xl"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="checklist-column">
                <div className="checklist-actions">
                  <span>Items 25-35</span>
                  <div className="checklist-buttons">
                    <Button
                      text="YES"
                      onClick={() => checkAllInRange(25, 35, '✓')}
                      colorScheme="lime-300"
                      variant="gradient"
                      font="md"
                      squircle="4xl"
                      width="80px"
                      height="45px"
                      type="button"
                      textColor="black-200"
                      shadowPosition="to-bottom"
                      shadowColor="white-600"
                    />
                    <Button
                      text="NO"
                      onClick={() => checkAllInRange(25, 35, '✗')}
                      colorScheme="red-500"
                      variant="gradient"
                      font="md"
                      squircle="4xl"
                      width="80px"
                      height="45px"
                      type="button"
                      textColor="white-200"
                      shadowPosition="to-bottom"
                      shadowColor="white-600"
                    />
                    <Button
                      text="BLANK"
                      onClick={() => checkAllInRange(25, 35, '--')}
                      colorScheme="gray-500"
                      variant="gradient"
                      font="md"
                      squircle="4xl"
                      width="80px"
                      height="45px"
                      type="button"
                      textColor="white-200"
                      shadowPosition="to-bottom"
                      shadowColor="white-600"
                    />
                  </div>
                </div>

                <div className="checklist-items">
                  {checklistItems.slice(24).map((item) => (
                    <div key={item.id} className="checklist-item">
                      <div className="item-number">{item.id}.</div>
                      <div className="item-description">{item.description}</div>
                      <div className="item-status">
                        <Input
                          type="radio"
                          id="yes"
                          name={`status-${item.id}`}
                          checked={item.status === '✓'}
                          onChange={(e) => handleStatusChange(item.id, '✓')}
                          required="true"
                          colorScheme="lime-700"
                          textColor="black-100"
                          labelBgColor='transparent'
                          size='xs'
                          variant="gradient"
                          borderWidth='2'
                          borderColor='lime-300'
                          onCheckedColor="lime-100"
                          onCheckedSize="sm"
                          rounded="4xl"
                        />
                        <Input
                          type="radio"
                          id="no"
                          name={`status-${item.id}`}
                          checked={item.status === '✗'}
                          onChange={(e) => handleStatusChange(item.id, '✗')}
                          colorScheme="red-700"
                          textColor="black-100"
                          labelBgColor='transparent'
                          size='xs'
                          variant="gradient"
                          borderWidth='2'
                          borderColor='red-500'
                          onCheckedColor="red-100"
                          onCheckedSize="sm"
                          rounded="4xl"
                        />
                        <Input
                          type="radio"
                          id="no"
                          name={`status-${item.id}`}
                          checked={item.status === '--'}
                          onChange={() => handleStatusChange(item.id, '--')}
                          required="true"
                          colorScheme="gray-700"
                          textColor="black-100"
                          labelBgColor='transparent'
                          size='xs'
                          variant="gradient"
                          borderWidth='2'
                          onCheckedColor="gray-100"
                          onCheckedSize="sm"
                          rounded="4xl"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Button
              text="Reset"
              onClick={handleReset}
              colorScheme="amber-800"
              variant="gradient"
              font="md"
              animation=""
              squircle="4xl"
              width="160px"
              height="38px"
              type="button"
              textColor="white-200"
              shadowPosition="to-bottom"
              shadowColor="white-600"
            />
            <Button
              text={isLoading
                ? (isUpdateMode ? 'Updating...' : 'Submitting...')
                : (isUpdateMode ? 'Update' : 'Submit')}
              onClick={handleSubmit}
              colorScheme={!isLoading ? 'lime-700' : 'lime-800'}
              variant="gradient"
              font="md"
              animation=""
              squircle="4xl"
              width="160px"
              height="38px"
              type="button"
              textColor="white-200"
              shadowPosition="to-bottom"
              shadowColor="white-600"
            />
          </div>
        </form>
      </div >
      <Toast
        isOpen={toastConfig.isOpen}
        onClose={() => setToastConfig({ ...toastConfig, isOpen: false })}
        type={toastConfig.type}
        message={toastConfig.message}
        textColor={toastConfig.textColor}
        duration={4000}
        position="top-center"
      />
    </div >
  );
};

export default ServiceForm;