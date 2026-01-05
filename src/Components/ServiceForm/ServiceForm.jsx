import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ServiceForm.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';
import { useHeaderTitle } from '../../context/HeaderTitleContext';
import Button from '../../common/Button/Button';
import { useAlert } from '../../context/AlertContext';

const ServiceForm = ({ initialData = {} }) => {
  const navigate = useNavigate();
  const { normal } = useParams();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const { showAlert } = useAlert();

  const { regNo, date, serviceHrs, nextServiceHrs, oil, oilFilter, fuelFilter, airFilter, acFilter, waterSeparator, id, location, runningHours, tyreForm, mechanics, workRemarks } = useParams();
  const [equipments, setEquipments] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  // Set header title when component mounts or data changes
  useEffect(() => {
    if (regNo) {
      const title = isUpdateMode ? 'Update Service Report' : 'Service Report Form'
      const subtitle = `${regNo}`
      setHeaderTitle(title);
      setHeaderSubtitle(subtitle);
    } else {
      setHeaderTitle('Service History');
      setHeaderSubtitle(null);
    }

    // Cleanup - reset when component unmounts
    return () => {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    };
  }, [regNo, isUpdateMode]);

  // Check if we're in update mode
  useEffect(() => {
    if (id) {
      setIsUpdateMode(true);
      setIsLoadingData(true);

      // Fetch existing service report data using apiRequest
      const fetchServiceReport = async () => {
        try {
          const response = await apiRequest(`${END_POINT}/service-report/getwith/${id}`);

          const data = await response.json()

          if (data.ok && data.data) {
            const existingData = data.data;

            // Convert date from DD-MM-YYYY to YYYY-MM-DD for input field
            let formattedDate = existingData[0].date;
            if (existingData[0].date && existingData[0].date.includes('-')) {
              const dateParts = existingData[0].date.split('-');
              if (dateParts.length === 3) {
                formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
              }
            }

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

            // Update checklist items if they exist
            if (existingData.checklistItems && existingData.checklistItems.length > 0) {
              setChecklistItems(existingData.checklistItems);
            }
          } else {
            showAlert('Failed to load service report data', 'error', '--color-primary');
          }
        } catch (error) {
          console.error(`Error fetching service report:`, error);
          showAlert('Error loading service report data', 'error', '--color-primary');
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
    async function fetchEquipments() {
      try {
        const response = await apiRequest(`${END_POINT}/equipments/get-equipments`, 'GET');
        const data = await response.json();
        setEquipments(data.data);
      } catch (error) {
        console.error('Error fetching equipment records:', error);
      }
    }

    fetchEquipments()
  }, []);

  // Form data state
  const [formData, setFormData] = useState({
    serviceHrs: runningHours || serviceHrs || '',
    regNo: regNo || '',
    nextServiceHrs: location || mechanics ? 0 : nextServiceHrs || '',
    machine: initialData.machine || '',
    mechanics: mechanics || initialData.mechanics || '',
    location: location ? location : initialData.location || '',
    date: date || new Date().toISOString().split('T')[0],
    operatorName: initialData.operatorName || '',
    remarks: workRemarks || initialData.remarks || '',
  });

  // Create checklist items array with their status (only if not in update mode)
  const [checklistItems, setChecklistItems] = useState([
    {
      id: 1,
      description
        : oilFilter === 'Check' && oil === 'Check'
          ? 'Check Engine oil & Filter'
          : oilFilter === 'Check' && oil === 'Change'
            ? 'Checked Filter & Changed Engine oil'
            : oilFilter === 'Change' && oil === 'Check'
              ? 'Checked Engine oil & Changed Filter'
              : 'Change Engine oil & Filter',
      status: location ? '' : '✓'
    },
    { id: 2, description: fuelFilter === 'Check' ? 'Check Fuel Filter' : 'Change Fuel Filter', status: location ? '' : '✓' },
    { id: 3, description: airFilter === 'Change' ? 'Check/Change Air Filter' : 'Check/Clean Air Filter', status: location ? '' : '✓' },
    { id: 4, description: 'Check Transmission Filter', status: location ? '' : '✓' },
    { id: 5, description: 'Check Power Steering Oil', status: location ? '' : '✓' },
    { id: 6, description: 'Check Hydraulic Oil', status: location ? '' : '✓' },
    { id: 7, description: 'Check Brake', status: location ? '' : '✓' },
    { id: 8, description: 'Check Tyre Air Pressure', status: location && !tyreForm ? '' : location && tyreForm ? '✓' : '✓' },
    { id: 9, description: 'Check Oil Leak', status: location ? '' : '✓' },
    { id: 10, description: 'Check Battery Condition', status: location && !tyreForm ? '✓' : location && tyreForm ? '' : '✓' },
    { id: 11, description: 'Check Wiper & Water', status: location ? '' : '✓' },
    { id: 12, description: 'Check All Lights', status: location ? '' : '✓' },
    { id: 13, description: 'Check All Horns', status: location ? '' : '✓' },
    { id: 14, description: 'Check Parking Brake', status: location ? '' : '✓' },
    { id: 15, description: 'Check Differential Oil', status: location ? '' : '✓' },
    { id: 16, description: 'Check Rod Water & Hoses', status: location ? '' : '✓' },
    { id: 17, description: 'Lubricants All Points', status: location ? '' : '✓' },
    { id: 18, description: 'Check Gear Shift System', status: location ? '' : '✓' },
    { id: 19, description: 'Check Clutch System', status: location ? '' : '✓' },
    { id: 20, description: 'Check Wheel Nut', status: location ? '' : '✓' },
    { id: 21, description: 'Check Starter & Alternator', status: location ? '' : '✓' },
    { id: 22, description: 'Check Number Plate both', status: location ? '' : '✓' },
    { id: 23, description: 'Check Paint', status: location ? '' : '✓' },
    { id: 24, description: 'Check Tires', status: location && !tyreForm ? '' : location && tyreForm ? '✓' : '✓' },
    { id: 25, description: 'Check Silencer', status: '' },
    { id: 26, description: 'Replace Hydraulic Oil- Filter', status: '' },
    { id: 27, description: 'Replace Transmission Oil', status: '' },
    { id: 28, description: 'Replace Differential Oil', status: '' },
    { id: 29, description: 'Replace Steering Box Oil', status: '' },
    { id: 30, description: 'Check Engine Valve Clearence', status: '' },
    { id: 31, description: 'Replace clutch fluid', status: '' },
    { id: 32, description: 'Check Brake Lining', status: '' },
    { id: 33, description: 'Change Drive Belt', status: '' },
    { id: 34, description: acFilter === 'Check' ? 'Check A/C filter' : 'Clean A/C filter', status: '' },
    { id: 35, description: waterSeparator === 'Check' ? 'Check Water Seperator' : 'Change Water Seperator', status: '' },
  ]);

  useEffect(() => {
    if (equipments.length > 0 && formData.regNo && !isUpdateMode) {
      const regNoValue = formData.regNo.trim();
      const foundEquipment = equipments.find(
        (equipment) => equipment.regNo === regNoValue
      );

      if (foundEquipment) {
        setFormData(prevData => ({
          ...prevData,
          machine: foundEquipment.machine || '',
          operatorName: foundEquipment.certificationBody[foundEquipment.certificationBody.length - 1] || '',
        }));
      }
    }
  }, [equipments, formData.regNo, isUpdateMode]);

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
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    const completeData = {
      ...formData,
      checklistItems
    };

    if (normal) {
      console.log("yes here also normal");
      completeData.serviceType = 'normal'
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

      setTimeout(() => {
        const responseData = data.data || formData;

        isUpdateMode
          ? navigate(`/service-doc/${responseData.serviceReport.regNo}/${formatDate(responseData.serviceReport.date)}`)
          : navigate(`/service-doc/${responseData.regNo}/${formatDate(responseData.date)}`);
      }, 1500);
    } catch (error) {
      console.error(`Error ${isUpdateMode ? 'updating' : 'adding'} service record:`, error);
      const errorMessage = isUpdateMode
        ? 'Failed to update service record. Please try again.'
        : 'Failed to add service record. Please try again.';

      showAlert(`${errorMessage}`, 'error', '--color-primary');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (isUpdateMode) {
      // In update mode, reset to original values - would need to refetch or store original
      setMessage({ text: 'Reset functionality in update mode would reload original data.', type: 'info' });
      return;
    }

    setFormData({
      serviceHrs: serviceHrs || '',
      regNo: regNo || '',
      nextServiceHrs: nextServiceHrs || '',
      machine: initialData.machine || '',
      mechanics: '',
      location: '',
      date: date || new Date().toISOString().split('T')[0],
      operatorName: initialData.operatorName || '',
      remarks: '',
    });
    setChecklistItems(checklistItems.map(item =>
      item.id <= 24 ? { ...item, status: '✓' } : { ...item, status: '' }
    ));
    setMessage({ text: '', type: '' });
  };

  // Show loading spinner while fetching data in update mode
  if (isLoadingData) {
    return (
      <div className="service-form-container">
        <div className="loading-container">
          <h2>Loading service report data...</h2>
        </div>
      </div>
    );
  }

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
                <label htmlFor="serviceHrs">Service Hours</label>
                <input
                  type="text"
                  id="serviceHrs"
                  name="serviceHrs"
                  value={formData.serviceHrs}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter service hrs"
                />
              </div>

              <div className="form-group">
                <label htmlFor="regNo">Equipment No</label>
                <input
                  type="text"
                  id="regNo"
                  name="regNo"
                  value={formData.regNo}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter equipment registration number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="nextServiceHrs">Next Service Hours</label>
                <input
                  type="text"
                  id="nextServiceHrs"
                  name="nextServiceHrs"
                  value={formData.nextServiceHrs}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter next service hrs"
                />
              </div>

              <div className="form-group">
                <label htmlFor="machine">Machine</label>
                <input
                  type="text"
                  id="machine"
                  name="machine"
                  value={formData.machine}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="mechanics">Mechanics</label>
                <input
                  type="text"
                  id="mechanics"
                  name="mechanics"
                  value={formData.mechanics}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="operatorName">Operator Name</label>
                <input
                  type="text"
                  id="operatorName"
                  name="operatorName"
                  value={formData.operatorName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Remarks</h3>
            <div className="form-group">
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows="4"
                placeholder="Enter any additional remarks..."
              ></textarea>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Checklist Items</h3>

            <div className="checklist-grid">
              <div className="checklist-column">
                <div className="checklist-actions">
                  <span>Items 1-24</span>
                  <div className="checklist-buttons">
                    <button
                      type="button"
                      className="checklist-button"
                      onClick={() => checkAllInRange(1, 24, '✓')}
                    >
                      All ✓
                    </button>
                    <button
                      type="button"
                      className="checklist-button"
                      onClick={() => checkAllInRange(1, 24, '✗')}
                    >
                      All ✗
                    </button>
                    <button
                      type="button"
                      className="checklist-button"
                      onClick={() => checkAllInRange(1, 24, '--')}
                    >
                      All --
                    </button>
                  </div>
                </div>

                <div className="checklist-items">
                  {checklistItems.slice(0, 24).map((item) => (
                    <div key={item.id} className="checklist-item">
                      <div className="item-number">{item.id}.</div>
                      <div className="item-description">{item.description}</div>
                      <div className="item-status">
                        <label>
                          <input
                            type="radio"
                            name={`status-${item.id}`}
                            checked={item.status === '✓'}
                            onChange={() => handleStatusChange(item.id, '✓')}
                          />
                          <span className="status-yes">✓</span>
                        </label>
                        <label>
                          <input
                            type="radio"
                            name={`status-${item.id}`}
                            checked={item.status === '✗'}
                            onChange={() => handleStatusChange(item.id, '✗')}
                          />
                          <span className="status-no">✗</span>
                        </label>
                        <label>
                          <input
                            type="radio"
                            name={`status-${item.id}`}
                            checked={item.status === '--'}
                            onChange={() => handleStatusChange(item.id, '--')}
                          />
                          <span className="status-na">--</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="checklist-column">
                <div className="checklist-actions">
                  <span>Items 25-33</span>
                  <div className="checklist-buttons">
                    <button
                      type="button"
                      className="checklist-button"
                      onClick={() => checkAllInRange(25, 33, '✓')}
                    >
                      All ✓
                    </button>
                    <button
                      type="button"
                      className="checklist-button"
                      onClick={() => checkAllInRange(25, 33, '✗')}
                    >
                      All ✗
                    </button>
                    <button
                      type="button"
                      className="checklist-button"
                      onClick={() => checkAllInRange(25, 33, '--')}
                    >
                      All --
                    </button>
                  </div>
                </div>

                <div className="checklist-items">
                  {checklistItems.slice(24).map((item) => (
                    <div key={item.id} className="checklist-item">
                      <div className="item-number">{item.id}.</div>
                      <div className="item-description">{item.description}</div>
                      <div className="item-status">
                        <label>
                          <input
                            type="radio"
                            name={`status-${item.id}`}
                            checked={item.status === '✓'}
                            onChange={() => handleStatusChange(item.id, '✓')}
                          />
                          <span className="status-yes">✓</span>
                        </label>
                        <label>
                          <input
                            type="radio"
                            name={`status-${item.id}`}
                            checked={item.status === '✗'}
                            onChange={() => handleStatusChange(item.id, '✗')}
                          />
                          <span className="status-no">✗</span>
                        </label>
                        <label>
                          <input
                            type="radio"
                            name={`status-${item.id}`}
                            checked={item.status === '--'}
                            onChange={() => handleStatusChange(item.id, '--')}
                          />
                          <span className="status-na">--</span>
                        </label>
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
              type="submit"
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
              type={!isLoading ? 'disabled' : 'submit'}
              textColor="white-200"
              shadowPosition="to-bottom"
              shadowColor="white-600"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceForm;