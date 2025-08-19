import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../MaintanceHistoryForm/MaintanceHistoryForm.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';

const MaintanceHistoryForm = () => {
    const navigate = useNavigate();
    const { regNo } = useParams();
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        equipment: '',
        regNo: regNo || '',
        workRemarks: '',
        mechanics: ''
    });

    const [equipments, setEquipments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [currentDateTime, setCurrentDateTime] = useState('');

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
        if (equipments.length > 0 && formData.regNo) {
            const regNoValue = formData.regNo.trim();
            const foundEquipment = equipments.find(
                (equipment) => equipment.regNo === regNoValue
            );

            if (foundEquipment) {
                setFormData(prevData => ({
                    ...prevData,
                    equipment: foundEquipment.machine || '',
                }));
            }
        }
    }, [equipments, formData.regNo]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleReset = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            equipment: '',
            regNo: regNo || '',
            workRemarks: '',
            mechanics: ''
        });
        setMessage({ text: '', type: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await apiRequest(`${END_POINT}/service-history/add-maintanance-history`,
                'POST',
                formData
            );

            if (!response.ok) {
                throw new Error('Failed to submit form');
            }

            const result = await response.json();
            setMessage({ text: 'Maintenance record submitted successfully!', type: 'success' });
            navigate(`/service-form/${formData.regNo}/${formData.date}/${formData.mechanics}/${formData.workRemarks}`);

        } catch (error) {
            setMessage({ text: `Error: ${error.message}`, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="maintenance-history-container">
            <div className="maintenance-header">
                <h1 className="maintenance-title">Equipment Maintenance Form</h1>
                <div className="date-time">{currentDateTime}</div>
            </div>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="form-container">
                <form onSubmit={handleSubmit} className="maintenance-history-form">
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
                        <label htmlFor="equipment">Equipment</label>
                        <input
                            type="text"
                            id="equipment"
                            name="equipment"
                            value={formData.equipment}
                            onChange={handleChange}
                            placeholder="Enter equipment name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="regNo">Equipment No</label>
                        <input
                            type="text"
                            id="regNo"
                            name="regNo"
                            value={formData.regNo}
                            onChange={handleChange}
                            placeholder="Enter equipment number"
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
                            onChange={handleChange}
                            placeholder="Enter mechanic's name"
                            required
                        />
                    </div>

                    <div className="form-group full-width">
                        <label htmlFor="workRemarks">Work Remarks</label>
                        <textarea
                            id="workRemarks"
                            name="workRemarks"
                            value={formData.workRemarks}
                            onChange={handleChange}
                            placeholder="Enter work remarks and details"
                            rows="5"
                            required
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
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MaintanceHistoryForm;