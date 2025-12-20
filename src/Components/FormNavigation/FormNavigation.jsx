import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './FormNavigation.css';
import { useHeaderTitle } from '../../context/HeaderTitleContext';

const FormNavigation = () => {
    const navigate = useNavigate();
    const { regNo } = useParams();
    const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();

    useEffect(() => {
        setHeaderTitle('Select the Service Type');
        // Cleanup - reset when component unmounts
        return () => {
            setHeaderTitle(null);
            setHeaderSubtitle(null);
        };
    }, [setHeaderTitle]);

    const navigationItems = [
        {
            title: 'Normal Service',
            description: 'Manage Normal service records',
            path: `/service-history-form/normal/${regNo}`,
        },
        {
            title: 'Oil Service',
            description: 'Manage Oil service records',
            path: `/service-history-form/${regNo}`,
        },
        {
            title: 'Battery Service',
            description: 'Track battery maintenance and replacements',
            path: `/battery-history-form/${regNo}`,
        },
        {
            title: 'Tyre Service',
            description: 'Monitor tyre changes and replacements',
            path: `/tyre-history-form/${regNo}`,
        },
        {
            title: 'Major Works',
            description: 'Complete maintenance or major records and reports',
            path: `/maintenance-history-form/${regNo}`,
        }
    ];

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <div className="form-nav-container">
            <div className="form-nav-grid">
                {navigationItems.map((item, index) => (
                    <div
                        key={index}
                        className="form-nav-card"
                        onClick={() => handleNavigation(item.path)}
                    >
                        <div className="form-nav-card-header">
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