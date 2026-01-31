import React, { useState, useEffect } from 'react';
import '../BatteryHistoryForm/BatteryHistoryForm.css';
import { END_POINT } from '../../constants';
import { useNavigate, useParams } from 'react-router';
import { apiRequest } from '../../utils/0auth';
import { useHeaderTitle } from '../../context/HeaderTitleContext';
import Button from '../../common/Button/Button';
import BatteryService from '../../assets/images/battery-service.png';
import Input from '../../common/Input/Input';
import Toast from '../../common/Toast/Toast';
import { useAlert } from '../../context/AlertContext';
import { useHeaderVibration } from '../../context/HeaderVibrationContext';

const BatteryHistoryForm = () => {
  const { regNo } = useParams()
  const navigate = useNavigate();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const { showAlert } = useAlert();
  const { triggerVibration } = useHeaderVibration();

  const [equipments, setEquipments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    batteryModel: '',
    equipment: '',
    equipmentNo: regNo || '',
    location: '',
    operator: '',
  });
  const [toastConfig, setToastConfig] = useState({
    isOpen: false,
    type: 'success',
    message: '',
    textColor: '#ffffff'
  });

  useEffect(() => {
    if (regNo) {
      const title = 'Add Battery Service Record'
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
  }, [setHeaderTitle, regNo]);


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

  useEffect(() => {
    if (equipments.length > 0 && formData.equipmentNo) {
      const regNoValue = formData.equipmentNo.trim();
      const foundEquipment = equipments.find(
        (equipment) => equipment.regNo === regNoValue
      );

      if (foundEquipment) {
        setFormData(prevData => ({
          ...prevData,
          equipment: foundEquipment.machine || '',
          operator: foundEquipment.certificationBody[foundEquipment.certificationBody.length - 1] || '',
        }));
      }
    }
  }, [equipments, formData.equipmentNo]);


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

  const showToast = (message, type = 'success', textColor = '#ffffff') => {
    setToastConfig({
      isOpen: true,
      type,
      message,
      textColor
    });
  };

  const validateForm = () => {
    if (!formData.date) {
      showToast('Service Date is required', 'error', '#ffffff');
      return false;
    }
    if (!formData.batteryModel) {
      showToast('Battery Model is required', 'error', '#ffffff');
      return false;
    }
    if (!formData.equipment) {
      showToast('Equipment Name is required', 'error', '#ffffff');
      return false;
    }
    if (!formData.equipmentNo) {
      showToast('Equipment Reg No is required', 'error', '#ffffff');
      return false;
    }
    if (!formData.location) {
      showToast('Location is required', 'warning', '#000000');
      return false;
    }
    if (!formData.operator) {
      showToast('Operator is required', 'error', '#ffffff');
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await apiRequest(`${END_POINT}/service-history/add-batery-history`,
        'POST',
        formData
      );

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      const result = await response.json();

      showAlert('Battery history record added successfully!', 'done_all', '--color-primary');
      triggerVibration();

      setTimeout(() => {
        navigate(`/service-form/battery/${result.data?._id}`);
      }, 1500);

    } catch (error) {
      showAlert(`Error: ${error.message}`, 'error', '--color-error-500');
      triggerVibration();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      date: '',
      batteryModel: '',
      equipment: '',
      equipmentNo: '',
      location: '',
      operator: '',
    });
    setMessage({ text: '', type: '' });
  };

  return (
    <div className="tyre-history-container">
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="form-overlay-cnt-img">
        <img src={BatteryService} alt="Battery Service" className="overlay-img" />
      </div>

      <div className="form-container form-container-hst">
        <form className="tyre-history-form">
          <div className="form-group">
            <Input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              label='Service Date'
              labelBgColor='transparent'
              labelSize='3xl'
              required="true"
              labelColor='yellow-300'
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
              id="batteryModel"
              name="batteryModel"
              value={formData.batteryModel}
              onChange={handleChange}
              placeholder="Enter battery model"
              placeholderColor="black-300"
              label='Battery Model'
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
              id="equipment"
              name="equipment"
              value={formData.equipment}
              onChange={handleChange}
              placeholder="Enter equipment name"
              placeholderColor="black-300"
              label='Equipment Name'
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
              id="equipmentNo"
              name="equipmentNo"
              value={formData.equipmentNo}
              onChange={handleChange}
              placeholder="Enter equipment number"
              placeholderColor="black-300"
              label='Equipment Reg No'
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
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter location"
              placeholderColor="black-300"
              label='Location'
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
              id="operator"
              name="operator"
              value={formData.operator}
              onChange={handleChange}
              placeholder="Enter operator name"
              placeholderColor="black-300"
              label='Operator'
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

          <div className="form-actions">
            <Button
              text="Reset"
              onClick={() => handleReset}
              colorScheme="amber-800"
              variant="gradient"
              font="md"
              animation=""
              squircle="4xl"
              width="200px"
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
              width="200px"
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
};

export default BatteryHistoryForm;