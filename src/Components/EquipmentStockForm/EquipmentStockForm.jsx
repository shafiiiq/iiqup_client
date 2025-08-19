import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../EquipmentStockForm/EquipmentStockForm.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';

const EquipmentStockForm = () => {
    const { regNo } = useParams(); // Get equipment number from URL params

    // Form state
    const [formData, setFormData] = useState({
        equipmentName: '',
        equipmentNo: regNo || '', // Use regNo from URL params
        images: []
    });

    // Image labeling state
    const [showLabelPopup, setShowLabelPopup] = useState(false);
    const [currentImage, setCurrentImage] = useState(null);
    const [imageLabel, setImageLabel] = useState('');

    // Loading and error states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState('');

    // Image upload limits
    const MAX_FILE_SIZE = 2048 * 2048; // 2MB per file
    const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB total
    const MAX_FILES = 10; // Maximum 10 files

    // Update equipment number when regNo param changes
    useEffect(() => {
        if (regNo) {
            setFormData(prev => ({
                ...prev,
                equipmentNo: regNo
            }));
        }
    }, [regNo]);

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

    // Handle input change for basic fields
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle image selection with validation
    const handleImageChange = (e) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);

            // Calculate current total size
            const currentTotalSize = formData.images.reduce((sum, img) => sum + img.file.size, 0);

            // Validate number of files
            if (formData.images.length + selectedFiles.length > MAX_FILES) {
                setError(`You can upload a maximum of ${MAX_FILES} images`);
                return;
            }

            // Process files one by one
            processNextFile(selectedFiles, 0, currentTotalSize);
        }
    };

    // Process files sequentially to show label popup for each
    const processNextFile = (files, index, currentTotalSize) => {
        if (index >= files.length) return;

        const file = files[index];

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            setError(`File ${file.name} exceeds the maximum size of 2MB`);
            return;
        }

        // Check total size
        const newTotalSize = currentTotalSize + file.size;
        if (newTotalSize > MAX_TOTAL_SIZE) {
            setError(`Total file size exceeds the maximum of 10MB`);
            return;
        }

        // Show label popup for current file
        setCurrentImage(file);
        setImageLabel('');
        setShowLabelPopup(true);

        // The next file will be processed after this one is labeled
    };

    // Handle saving the image label
    const handleSaveLabel = () => {
        if (!imageLabel.trim()) {
            alert("Please enter a label for the image");
            return;
        }

        // Add image with label to form data
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, {
                file: currentImage,
                label: imageLabel
            }]
        }));

        // Clear current states
        setShowLabelPopup(false);

        // Find the index of the current file in the selected files array
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput && fileInput.files) {
            const files = Array.from(fileInput.files);
            const currentIndex = files.findIndex(f => f === currentImage);

            // Process next file if available
            if (currentIndex < files.length - 1) {
                const currentTotalSize = formData.images.reduce((sum, img) => sum + img.file.size, 0) + currentImage.size;
                processNextFile(files, currentIndex + 1, currentTotalSize);
            }
        }

        setError(null);
    };

    // Remove selected image
    const removeImage = (index) => {
        const updatedImages = [...formData.images];
        updatedImages.splice(index, 1);

        setFormData({
            ...formData,
            images: updatedImages
        });
        // Clear error when removing images
        setError(null);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // First send the basic equipment data
            const equipmentData = {
                equipmentName: formData.equipmentName,
                equipmentNo: formData.equipmentNo
            };

            // First request - send equipment data without images
            const equipmentResponse = await apiRequest(`${END_POINT}/stocks/add-handover-report`,
                "POST",
                equipmentData
            );

            if (!equipmentResponse.ok) {
                throw new Error('Failed to save equipment data');
            }

            const equipmentResult = await equipmentResponse.json();
            const equipmentId = equipmentResult.id; // Assuming your API returns the created equipment ID

            // Then upload images individually if there are any
            if (formData.images.length > 0) {
                for (let i = 0; i < formData.images.length; i++) {
                    const imageData = new FormData();
                    imageData.append('equipmentId', equipmentId);
                    imageData.append('image', formData.images[i].file);
                    imageData.append('label', formData.images[i].label);

                    const imageResponse = await apiRequest(`${END_POINT}/stocks/add-equipment-image`,
                        "POST",
                        imageData
                    );

                    if (!imageResponse.ok) {
                        throw new Error(`Failed to upload image ${i + 1}`);
                    }
                }
            }

            // Success handling
            setSuccess(true);
            setFormData({
                equipmentName: '',
                equipmentNo: regNo || '',
                images: []
            });
        } catch (err) {
            setError(err.message || 'An error occurred');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Cancel labeling
    const handleCancelLabel = () => {
        setShowLabelPopup(false);
        setCurrentImage(null);
    };

    // Reset form
    const handleReset = () => {
        setFormData({
            equipmentName: '',
            equipmentNo: regNo || '',
            images: []
        });
        setError(null);
        setSuccess(false);
    };

    return (
        <div className="es-container">
            <div className="es-header">
                <h1>Equipment Stock Form</h1>
                <div className="es-date-time">{currentDateTime}</div>
            </div>

            {regNo && (
                <div className="es-equipment-info">
                    Equipment Number: {regNo}
                </div>
            )}

            {error && <div className="es-message error">{error}</div>}
            {success && <div className="es-message success">Equipment data saved successfully!</div>}

            <div className="es-form-container">
                <form onSubmit={handleSubmit} className="es-form">
                    <div className="es-form-group">
                        <label htmlFor="equipmentName">Equipment Name</label>
                        <input
                            type="text"
                            id="equipmentName"
                            name="equipmentName"
                            value={formData.equipmentName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="es-form-group">
                        <label htmlFor="equipmentNo">Equipment Number</label>
                        <input
                            type="text"
                            id="equipmentNo"
                            name="equipmentNo"
                            value={formData.equipmentNo}
                            onChange={handleInputChange}
                            readOnly={!!regNo} // Make read-only if regNo exists in URL
                            required
                        />
                    </div>

                    <div className="es-form-group es-form-group-full">
                        <label>Equipment Photos (Max: 10 images, 2MB per image, 10MB total)</label>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="es-file-input"
                        />

                        <div className="es-images-grid">
                            {formData.images.map((image, index) => (
                                <div key={index} className="es-image-preview-container">
                                    <div className="es-image-preview">
                                        <img
                                            src={URL.createObjectURL(image.file)}
                                            alt={`Preview ${index}`}
                                        />
                                    </div>
                                    <div className="es-image-label">
                                        {image.label}
                                    </div>
                                    <button
                                        type="button"
                                        className="es-remove-btn"
                                        onClick={() => removeImage(index)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>

                        {formData.images.length > 0 && (
                            <div className="es-image-count">
                                {formData.images.length} image(s) selected
                                <span className="es-file-size">
                                    {" - "}
                                    {(formData.images.reduce((sum, img) => sum + img.file.size, 0) / (1024 * 1024)).toFixed(2)}MB
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="es-form-actions">
                        <button
                            type="button"
                            className="es-btn es-btn-danger"
                            onClick={handleReset}
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            className="es-btn es-btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Equipment Data'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Image Label Popup */}
            {showLabelPopup && (
                <div className="es-popup-overlay">
                    <div className="es-popup-content">
                        <h3>Label this Image</h3>
                        <div className="es-popup-image-preview">
                            <img src={currentImage ? URL.createObjectURL(currentImage) : ''} alt="Preview" />
                        </div>
                        <div className="es-popup-form">
                            <label htmlFor="imageLabel">Image Label:</label>
                            <input
                                type="text"
                                id="imageLabel"
                                value={imageLabel}
                                onChange={(e) => setImageLabel(e.target.value)}
                                placeholder="Enter a label for this image"
                                autoFocus
                                required
                            />
                            <div className="es-popup-buttons">
                                <button type="button" className="es-popup-btn es-popup-btn-cancel" onClick={handleCancelLabel}>
                                    Cancel
                                </button>
                                <button type="button" className="es-popup-btn es-popup-btn-save" onClick={handleSaveLabel}>
                                    Save Label
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquipmentStockForm;