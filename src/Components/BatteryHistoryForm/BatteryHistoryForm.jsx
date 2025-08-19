import React, { useState, useEffect } from 'react';
import '../BatteryHistoryForm/BatteryHistoryForm.css';
import { END_POINT } from '../../constants';
import { useNavigate, useParams } from 'react-router';
import { apiRequest } from '../../utils/0auth';

const BatteryHistoryForm = () => {
  const {regNo} = useParams()
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    batteryModel: '',
    equipment: '',
    equipmentNo: regNo || '',
    location: '',
    operator: '',
    runningHours: ''
  });

  const [equipments, setEquipments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [currentDateTime, setCurrentDateTime] = useState('');
  const navigate = useNavigate();


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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Replace with your actual API endpoint
      const response = await apiRequest(`${END_POINT}/service-history/add-batery-history`,
        'POST',
        formData
      );

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      
      const result = await response.json();
      setMessage({ text: 'Tyre history record added successfully!', type: 'success' });
      navigate(`/service-form/${formData.equipmentNo}/${formData.date}/${formData.location}`);

      // Reset form after successful submission
      setFormData({
        date: '',
        batteryModel: '',
        equipment: '',
        equipmentNo: '',
        location: '',
        operator: '',
      });

    } catch (error) {
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
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
      <div className="tyre-header">
        <h1 className="tyre-title">Add Battery History Record</h1>
        <div className="date-time">{currentDateTime}</div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="form-container">
        <form onSubmit={handleSubmit} className="tyre-history-form">
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="tyreModel">Battery Model</label>
            <input
              type="text"
              id="batteryModel"
              name="batteryModel"
              value={formData.batteryModel}
              onChange={handleChange}
              required
              placeholder="Enter tyre model"
            />
          </div>

          <div className="form-group">
            <label htmlFor="equipment">Equipment</label>
            <input
              type="text"
              id="equipment"
              name="equipment"
              value={formData.equipment}
              onChange={handleChange}
              required
              placeholder="Enter equipment type"
            />
          </div>

          <div className="form-group">
            <label htmlFor="equipmentNo">Equipment No</label>
            <input
              type="text"
              id="equipmentNo"
              name="equipmentNo"
              value={formData.equipmentNo}
              onChange={handleChange}
              required
              placeholder="Enter equipment number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              placeholder="Enter location"
            />
          </div>

          <div className="form-group">
            <label htmlFor="operator">Operator</label>
            <input
              type="text"
              id="operator"
              name="operator"
              value={formData.operator}
              onChange={handleChange}
              required
              placeholder="Enter operator name"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleReset}
              className="action-btn reset"
            >
              Reset
            </button>
            <button
              type="submit"
              className="action-btn submit"
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BatteryHistoryForm;