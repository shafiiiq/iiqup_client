import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ServiceHistoryForm.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';

function ServiceHistoryForm() {
  const { regNo } = useParams();
  const { normal } = useParams();
  const navigate = useNavigate();
  const [equipmentData, setEquipmentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Form data state
  const [formData, setFormData] = useState({
    regNo: regNo || '',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    oil: 'Check',
    oilFilter: 'Check',
    fuelFilter: 'Check',
    acFilter: 'Clean',
    waterSeparator: 'Check',
    airFilter: 'Clean',
    serviceHrs: '',
    nextServiceHrs: '',
    fullService: false
  });

  // Get current date in DD-MM-YY format and time in AM/PM format
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

  // Load equipment details if available
  useEffect(() => {
    if (regNo) {
      import('../../equipments').then(module => {
        const equipment = module.default.find(eq => eq.regNo.trim() === regNo.trim());
        setEquipmentData(equipment);
      }).catch(err => {
        console.error("Could not load equipment data:", err);
      });
    }
  }, [regNo]);

  // Function to format and convert service hours/km input
  const formatServiceInput = (input) => {
    if (!input) return '';

    // Convert to uppercase
    const upperInput = input.toUpperCase();

    // If input doesn't end with HRS or KM, return as is
    if (!upperInput.endsWith('HRS') && !upperInput.endsWith('KM')) {
      return upperInput;
    }

    return upperInput;
  };

  // Calculate next service hours/km automatically
  const calculateNextService = (currentValue) => {
    if (!currentValue) return '';

    const upperValue = currentValue.toUpperCase();

    // Extract numeric value and unit
    let numericValue = 0;
    let unit = '';

    if (upperValue.endsWith('KM')) {
      numericValue = parseInt(upperValue.replace('KM', ''));
      unit = 'KM';
    } else if (upperValue.endsWith('HRS')) {
      numericValue = parseInt(upperValue.replace('HRS', ''));
      unit = 'HRS';
    } else {
      // If no unit specified, assume hours and add 400
      numericValue = parseInt(upperValue);
      return (numericValue + 400).toString();
    }

    if (isNaN(numericValue)) return '';

    // Add 400 to the numeric value and append the unit
    return `${numericValue + 400}${unit}`;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'serviceHrs') {
      const formattedValue = formatServiceInput(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else if (name === 'nextServiceHrs') {
      // Allow manual editing of next service field with formatting
      const formattedValue = formatServiceInput(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Update next service hours when service hours change
  useEffect(() => {
    if (formData.serviceHrs) {
      const nextService = calculateNextService(formData.serviceHrs);
      setFormData(prev => ({
        ...prev,
        nextServiceHrs: nextService
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        nextServiceHrs: ''
      }));
    }
  }, [formData.serviceHrs]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (formData.nextServiceHrs && formData.serviceHrs) {
        const currentHrs = parseInt(formData.serviceHrs.toString().replace(/[^0-9]/g, ''));
        const nextHrs = parseInt(formData.nextServiceHrs.toString().replace(/[^0-9]/g, ''));

        const currentMilestone = Math.floor(currentHrs / 3000);
        const nextMilestone = Math.floor(nextHrs / 3000);

        if (nextMilestone > currentMilestone) {

          // Add full service notification
          await apiRequest(`${END_POINT}/service-history/add-full-service-notification`,
            "POST",
            {
              regNo: regNo,
              nextServiceHrs: formData.nextServiceHrs
            }
          );
        }
      }

      // Add service history
      const serviceResponse = await apiRequest(`${END_POINT}/service-history/add-service-history`,
        "POST",
        formData
      );

      const serviceData = await serviceResponse.json();

      if (!serviceResponse.ok) {
        throw new Error(serviceData.error);
      }

      setMessage({ text: 'Service record added successfully!', type: 'success' });

      // Navigate to success page after short delay
      setTimeout(() => {
        if (normal === 'normal') {
          console.log("normalll");
          navigate(`/service-form/${formData.regNo}/${formData.date}/${formData.serviceHrs}/${formData.nextServiceHrs}/${formData.oil}/${formData.oilFilter}/${formData.fuelFilter}/${formData.airFilter}/${formData.acFilter}/${formData.waterSeparator}/normal`);
        } else {
          navigate(`/service-form/${formData.regNo}/${formData.date}/${formData.serviceHrs}/${formData.nextServiceHrs}/${formData.oil}/${formData.oilFilter}/${formData.fuelFilter}/${formData.airFilter}/${formData.acFilter}/${formData.waterSeparator}`);
        }
      }, 1500);

    } catch (error) {
      console.error("Error adding service record:", error);
      setMessage({ text: `${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      regNo: regNo || '',
      date: new Date().toISOString().split('T')[0],
      oil: 'Check',
      oilFilter: 'Check',
      fuelFilter: 'Check',
      acFilter: 'Clean',
      waterSeparator: 'Check',
      airFilter: 'Clean',
      serviceHrs: '',
      nextServiceHrs: '',
      fullService: false
    });
    setMessage({ text: '', type: '' });
  };

  return (
    <div className="service-history-container">
      <div className="service-header">
        <h1 className="service-title">Add Service Record</h1>
        <div className="date-time">{currentDateTime}</div>
      </div>

      {equipmentData && (
        <div className="equipment-info">
          {equipmentData.machine} - {regNo}
        </div>
      )}

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="form-container">
        <form onSubmit={handleSubmit} className="service-history-form">
          <div className="form-group">
            <label htmlFor="date">Service Date</label>
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
            <label htmlFor="serviceHrs">Service Hrs/ Km</label>
            <input
              type="text"
              id="serviceHrs"
              name="serviceHrs"
              value={formData.serviceHrs}
              onChange={handleInputChange}
              placeholder="Enter current hours (e.g., 100km, 500hrs)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="nextServiceHrs">Next Service Hrs/ Km</label>
            <input
              type="text"
              id="nextServiceHrs"
              name="nextServiceHrs"
              value={formData.nextServiceHrs}
              onChange={handleInputChange}
              placeholder="Auto-calculated or enter manually"
            />
          </div>

          <div className="form-group">
            <label htmlFor="oil">Oil</label>
            <select
              id="oil"
              name="oil"
              value={formData.oil}
              onChange={handleInputChange}
            >
              <option value="Check">Check</option>
              <option value="Change">Change</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="oilFilter">Oil Filter</label>
            <select
              id="oilFilter"
              name="oilFilter"
              value={formData.oilFilter}
              onChange={handleInputChange}
            >
              <option value="Check">Check</option>
              <option value="Change">Change</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="fuelFilter">Fuel Filter</label>
            <select
              id="fuelFilter"
              name="fuelFilter"
              value={formData.fuelFilter}
              onChange={handleInputChange}
            >
              <option value="Check">Check</option>
              <option value="Change">Change</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="acFilter">A/C Filter</label>
            <select
              id="acFilter"
              name="acFilter"
              value={formData.acFilter}
              onChange={handleInputChange}
            >
              <option value="Check">Check</option>
              <option value="Clean">Clean</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="waterSeparator">Water Separator</label>
            <select
              id="waterSeparator"
              name="waterSeparator"
              value={formData.waterSeparator}
              onChange={handleInputChange}
            >
              <option value="Check">Check</option>
              <option value="Change">Change</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="airFilter">Air Filter</label>
            <select
              id="airFilter"
              name="airFilter"
              value={formData.airFilter}
              onChange={handleInputChange}
            >
              <option value="Clean">Clean</option>
              <option value="Change">Change</option>
            </select>
          </div>

          <div className="form-group full-service-group">
            <label htmlFor="fullService">Full Service</label>
            <select
              id="fullService"
              name="fullService"
              value={formData.fullService}
              onChange={handleInputChange}
            >
              <option value="false">X</option>
              <option value="true">✓</option>
            </select>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleReset}
              className="action-btn action-btn-svc reset"
            >
              Reset
            </button>
            <button
              type="submit"
              className="action-btn action-btn-svc submit"
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ServiceHistoryForm;