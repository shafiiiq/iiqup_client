import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './FormNavigation.css';

const FormNavigation = () => {
    const navigate = useNavigate();
    const { regNo } = useParams();
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

    const navigationItems = [
        {
            title: 'Oil Service',
            description: 'Manage service records',
            path: `/service-history-form/${regNo}`,
            icon: '🔧',
            color: '#3498db'
        },
        {
            title: 'Battery Service',
            description: 'Track battery maintenance and replacements',
            path: `/battery-history-form/${regNo}`,
            icon: '🔋',
            color: '#2ecc71'
        },
        {
            title: 'Tyre Service',
            description: 'Monitor tyre changes and replacements',
            path: `/tyre-history-form/${regNo}`,
            icon: '🚗',
            color: '#f39c12'
        },
        {
            title: 'Major Works',
            description: 'Complete maintenance records and reports',
            path: `/maintenance-history-form/${regNo}`,
            icon: '📋',
            color: '#e74c3c'
        }
    ];

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <div className="form-nav-container">
            <div className="form-nav-header">
                <h1 className="form-nav-title">Select the service type</h1>
                <div className="form-nav-datetime">{currentDateTime}</div>
            </div>

            <div className="form-nav-grid">
                {navigationItems.map((item, index) => (
                    <div
                        key={index}
                        className="form-nav-card"
                        onClick={() => handleNavigation(item.path)}
                        style={{ '--card-color': item.color }}
                    >
                        <div className="form-nav-card-header">
                            <div className="form-nav-icon">{item.icon}</div>
                            <h3 className="form-nav-card-title">{item.title}</h3>
                        </div>
                        <p className="form-nav-card-description">{item.description}</p>
                        <div className="form-nav-card-arrow">→</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FormNavigation;