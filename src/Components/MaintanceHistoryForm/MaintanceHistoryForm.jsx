import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../MaintanceHistoryForm/MaintanceHistoryForm.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';
import { useHeaderTitle } from '../../context/HeaderTitleContext';
import Button from '../../common/Button/Button';
import MajorWork from '../../assets/images/major-service.jpg';
import Input from '../../common/Input/Input';
import Toast from '../../common/Toast/Toast';
import { useAlert } from '../../context/AlertContext';
import { useHeaderVibration } from '../../context/HeaderVibrationContext';

const MaintanceHistoryForm = () => {
    const navigate = useNavigate();
    const { regNo } = useParams();
    const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
    const { showAlert } = useAlert();
    const { triggerVibration } = useHeaderVibration();

    const [equipments, setEquipments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [currentDateTime, setCurrentDateTime] = useState('');

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        equipment: '',
        regNo: regNo || '',
        workRemarks: '',
        mechanics: ''
    });
    const [toastConfig, setToastConfig] = useState({
        isOpen: false,
        type: 'success',
        message: '',
        textColor: '#ffffff'
    });

    useEffect(() => {
        if (regNo) {
            const title = 'Add Major Service Record'
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
        if (!formData.equipment) {
            showToast('Equipment Name is required', 'error', '#ffffff');
            return false;
        }
        if (!formData.regNo) {
            showToast('Equipment Reg No is required', 'error', '#ffffff');
            return false;
        }
        if (!formData.mechanics) {
            showToast('Mechanics name is required', 'warning', '#000000');
            return false;
        }
        if (!formData.workRemarks) {
            showToast('Work Remarks is required', 'error', '#ffffff');
            return false;
        }
        return true;
    };

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

        if (!validateForm()) {
            return;
        }

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

            showAlert('Maintenance record submitted successfully!', 'done_all', '--color-primary');
            triggerVibration();

            setTimeout(() => {
                navigate(`/service-form/maintenance/${result.data?._id}`);
            }, 1500);

        } catch (error) {
            showAlert(`Error: ${error.message}`, 'error', '--color-error-500');
            triggerVibration();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="maintenance-history-container">
            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="form-overlay-cnt-img">
                <img src={MajorWork} alt="Major Service" className="overlay-img" />
            </div>

            <div className="form-container form-container-hst">
                <form className="maintenance-history-form">
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
                            id="regNo"
                            name="regNo"
                            value={formData.regNo}
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
                            id="mechanics"
                            name="mechanics"
                            value={formData.mechanics}
                            onChange={handleChange}
                            placeholder="Enter mechanic's name"
                            placeholderColor="black-300"
                            label='Mechanics'
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

                    <div className="form-group full-width">
                        <Input
                            type="textarea"
                            id="workRemarks"
                            name="workRemarks"
                            value={formData.workRemarks}
                            onChange={handleChange}
                            required="true"
                            colorScheme="yellow-300"
                            textColor="black-100"
                            label='Work Remarks'
                            labelColor='yellow-300'
                            labelBgColor='transparent'
                            labelSize='3xl'
                            placeholder="Enter work remarks and details"
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
                            rows={5}
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
                            width="160px"
                            height="57px"
                            type="submit"
                            textColor="white-200"
                            shadowPosition="to-bottom"
                            shadowColor="white-600"
                        />
                        <Button
                            text={isSubmitting ? 'Submitting...' : 'Submit'}
                            onClick={handleSubmit}
                            colorScheme={!isSubmitting ? 'lime-600' : 'lime-800'}
                            variant="gradient"
                            font="md"
                            animation=""
                            squircle="4xl"
                            width="160px"
                            height="57px"
                            type="submit"
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

export default MaintanceHistoryForm;