import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './FormNavigation.css';
import { useHeaderTitle } from '../../context/HeaderTitleContext';
import BatteryService from '../../assets/images/battery-service.png';
import OilService from '../../assets/images/oil-service.png';
import NormalService from '../../assets/images/normal-service.jpg';
import TyeService from '../../assets/images/tyre-service.jpg';
import MajorWork from '../../assets/images/major-service.jpg';

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
            image: NormalService
        },
        {
            title: 'Oil Service',
            description: 'Manage Oil service records',
            path: `/service-history-form/${regNo}`,
            image: OilService 
        },
        {
            title: 'Battery Service',
            description: 'Track battery maintenance and replacements',
            path: `/battery-history-form/${regNo}`,
            image: BatteryService 
        },
        {
            title: 'Tyre Service',
            description: 'Monitor tyre changes and replacements',
            path: `/tyre-history-form/${regNo}`,
            image: TyeService
        },
        {
            title: 'Major Works',
            description: 'Complete maintenance or major records and reports',
            path: `/maintenance-history-form/${regNo}`,
            image: MajorWork
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
                        <div className="form-nav-card-image-wrapper">
                            <img
                                src={item.image}
                                alt={item.title}
                                className="form-nav-card-image"
                            />
                        </div>
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