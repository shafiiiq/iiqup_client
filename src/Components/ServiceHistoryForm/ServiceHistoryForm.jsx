import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ServiceHistoryForm.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';
import { useHeaderTitle } from '../../context/HeaderTitleContext';
import Button from '../../common/Button/Button';
import { useAlert } from '../../context/AlertContext';
import { useHeaderVibration } from '../../context/HeaderVibrationContext';
import OilService from '../../assets/images/oil-service.png';
import NormalService from '../../assets/images/normal-service.jpg';
import Input from '../../common/Input/Input';
import Toast from '../../common/Toast/Toast';

function ServiceHistoryForm() {
  const { regNo } = useParams();
  const { normal } = useParams();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const { showAlert } = useAlert();
  const { triggerVibration } = useHeaderVibration();
  const navigate = useNavigate();

  const [equipmentData, setEquipmentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [currentDateTime, setCurrentDateTime] = useState('');

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
  const [toastConfig, setToastConfig] = useState({
    isOpen: false,
    type: 'success',
    message: '',
    textColor: '#ffffff'
  });

  useEffect(() => {
    if (regNo) {
      const title = normal ? 'Add Nomal Service Record' : 'Add Oil Service Record'
      const subtitle = `${regNo}`
      setHeaderTitle(title);
      setHeaderSubtitle(subtitle);
    } else {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    }

    // Cleanup - reset when component unmounts
    return () => {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    };
  }, [setHeaderTitle, regNo, normal]);

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

  const showToast = (message, type = 'success', textColor = '#ffffff') => {
    setToastConfig({
      isOpen: true,
      type,
      message,
      textColor
    });
  };

  const validateForm = () => {
    if (!formData.regNo) {
      showToast('Equipment Reg No is required', 'error', '#ffffff');
      return false;
    }
    if (!formData.date) {
      showToast('Service Date is required', 'error', '#ffffff');
      return false;
    }
    if (!formData.serviceHrs) {
      showToast('Service Hrs/Km is required', 'error', '#ffffff');
      return false;
    }
    if (!formData.nextServiceHrs) {
      showToast('Next Service Hrs/Km is required', 'error', '#ffffff');
      return false;
    }
    return true;
  };

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

    // Handle boolean conversion for fullService
    if (name === 'fullService') {
      const boolValue = value === 'true' || value === true;
      setFormData(prev => ({
        ...prev,
        [name]: boolValue
      }));
      return;
    }

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

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

      console.log("serviceData", serviceData);

      if (!serviceResponse.ok) {
        throw new Error(serviceData.error);
      }

      showAlert('Service record added successfully', 'done_all', '--color-primary');
      triggerVibration();

      // Navigate to success page after short delay
      setTimeout(() => {
        if (normal === 'normal') {
          console.log("normalll");
          navigate(`/service-form/${formData.regNo}/${formData.date}/${formData.serviceHrs}/${formData.nextServiceHrs}/${formData.oil}/${formData.oilFilter}/${formData.fuelFilter}/${formData.airFilter}/${formData.acFilter}/${formData.waterSeparator}/${serviceData.data?._id}/true`);
        } else {
          navigate(`/service-form/${formData.regNo}/${formData.date}/${formData.serviceHrs}/${formData.nextServiceHrs}/${formData.oil}/${formData.oilFilter}/${formData.fuelFilter}/${formData.airFilter}/${formData.acFilter}/${formData.waterSeparator}/${serviceData.data?._id}/false`);
        }
      }, 1500);

    } catch (error) {
      console.error("Error adding service record:", error);
      showAlert(`${error.message}`, 'error', '--color-error-500');
      triggerVibration();
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
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="form-overlay-cnt-img">
        <img src={normal ? NormalService : OilService} alt="Oil Service" className="overlay-img" />
      </div>

      <div className="form-container form-container-hst">
        <form className="service-history-form">
          <div className="form-group">
            <Input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              label='Service Date'
              labelBgColor='transparent'
              labelSize='3xl'
              required="true"
              labelColor='yellow-300'
              onChange={handleInputChange}
              placeholder="Start Date"
              colorScheme="yellow-300"
              variant="gradient"
              squircle="4xl"
              width="100%"
              height="57px"
              textColor="black-100"
              placeholderColor="black-300"
              fontWeight='500'
              inputPaddingInline="2xl"
              inputPaddingBlock="xl"
            />
          </div>

          <div className="form-group">
            <Input
              type="text"
              id="serviceHrs"
              name="serviceHrs"
              value={formData.serviceHrs}
              onChange={handleInputChange}
              placeholder="Enter current hours (e.g., 100km, 500hrs)"
              placeholderColor="black-300"
              label='Service Hrs/ Km'
              labelBgColor='transparent'
              labelSize='3xl'
              required="true"
              labelColor='yellow-300'
              colorScheme="yellow-300"
              variant="gradient"
              width="100%"
              height="57px"
              squircle="4xl"
              textColor="black-100"
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
              placeholder="Auto-calculated or enter manually"
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
              type="select"
              id="oil"
              name="oil"
              value={formData.oil}
              onChange={handleInputChange}
              required="true"
              options={[
                { value: 'Check', label: 'Check' },
                { value: 'Change', label: 'Change' },
              ]}
              colorScheme="yellow-300"
              textColor="black-100"
              label='Oil'
              labelBgColor='transparent'
              labelSize='3xl'
              labelColor='yellow-300'
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
              type="select"
              id="oilFilter"
              name="oilFilter"
              value={formData.oilFilter}
              onChange={handleInputChange}
              required="true"
              options={[
                { value: 'Check', label: 'Check' },
                { value: 'Change', label: 'Change' },
              ]}
              colorScheme="yellow-300"
              textColor="black-100"
              label='Oil Filter'
              labelBgColor='transparent'
              labelSize='3xl'
              labelColor='yellow-300'
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
              type="select"
              id="fuelFilter"
              name="fuelFilter"
              value={formData.fuelFilter}
              onChange={handleInputChange}
              required="true"
              options={[
                { value: 'Check', label: 'Check' },
                { value: 'Change', label: 'Change' },
              ]}
              colorScheme="yellow-300"
              textColor="black-100"
              label='Fuel Filter'
              labelBgColor='transparent'
              labelSize='3xl'
              labelColor='yellow-300'
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
              type="select"
              id="acFilter"
              name="acFilter"
              value={formData.acFilter}
              onChange={handleInputChange}
              required="true"
              options={[
                { value: 'Check', label: 'Check' },
                { value: 'Clean', label: 'Clean' },
              ]}
              colorScheme="yellow-300"
              textColor="black-100"
              label='A/C Filter'
              labelBgColor='transparent'
              labelSize='3xl'
              labelColor='yellow-300'
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
              type="select"
              id="airFilter"
              name="airFilter"
              value={formData.airFilter}
              onChange={handleInputChange}
              required="true"
              options={[
                { value: 'Clean', label: 'Clean' },
                { value: 'Change', label: 'Change' },
              ]}
              colorScheme="yellow-300"
              textColor="black-100"
              label='Air Filter'
              labelBgColor='transparent'
              labelSize='3xl'
              labelColor='yellow-300'
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
              type="select"
              id="waterSeparator"
              name="waterSeparator"
              value={formData.waterSeparator}
              onChange={handleInputChange}
              required="true"
              options={[
                { value: 'Check', label: 'Check' },
                { value: 'Change', label: 'Change' },
              ]}
              colorScheme="yellow-300"
              textColor="black-100"
              label='Water Separator'
              labelBgColor='transparent'
              labelSize='3xl'
              labelColor='yellow-300'
              variant="gradient"
              width="100%"
              height="57px"
              squircle="4xl"
              fontWeight='500'
              inputPaddingInline="2xl"
              inputPaddingBlock="xl"
            />
          </div>

          <div className="form-group full-service-group">
            <Input
              type="select"
              id="fullService"
              name="fullService"
              value={formData.fullService}
              onChange={handleInputChange}
              required="true"
              options={[
                { value: false, label: 'No' },
                { value: true, label: 'Yes' },
              ]}
              colorScheme="yellow-300"
              textColor="black-100"
              label='Full Service'
              labelBgColor='transparent'
              placeholderColor='black-100'
              labelSize='3xl'
              labelColor='yellow-300'
              variant="gradient"
              width="100%"
              height="57px"
              squircle="4xl"
              fontWeight='500'
              inputPaddingInline="2xl"
              inputPaddingBlock="xl"
            />
          </div>

          <div className="form-actions">
            <Button
              text="Reset"
              onClick={() => handleReset}
              colorScheme="amber-800"
              variant="gradient"
              font="md"
              animation=""
              squircle="4xl"
              width="100%"
              height="57px"
              type="submit"
              textColor="white-200"
              shadowPosition="to-bottom"
              shadowColor="white-600"
            />
            <Button
              text={isLoading ? 'Submitting...' : 'Submit'}
              onClick={handleSubmit}
              colorScheme={!isLoading ? 'lime-600' : 'lime-800'}
              variant="gradient"
              font="md"
              animation=""
              squircle="4xl"
              width="100%"
              height="57px"
              type={!isLoading ? 'disabled' : 'submit'}
              textColor="white-200"
              shadowPosition="to-bottom"
              shadowColor="white-600"
            />
          </div>
        </form>
      </div>
      <Toast
        isOpen={toastConfig.isOpen}
        onClose={() => setToastConfig({ ...toastConfig, isOpen: false })}
        type={toastConfig.type}
        message={toastConfig.message}
        textColor={toastConfig.textColor}
        duration={4000}
        position="top-center"
      />
    </div>
  );
}

export default ServiceHistoryForm;