import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { checkWebGLSupport } from '@/features/core/device/compatibility.device';
import { createLightningStorm } from '../helper/intro.helper';
import {
    NO_WEBGL_REDIRECT_DELAY_MS,
    SPLINE_ERROR_REDIRECT_DELAY_MS,
    LOGIN_CLICK_REDIRECT_DELAY_MS,
} from '../constants/intro.constant';

const useIntro = () => {
    const navigate = useNavigate();
    const [isDisintegrating, setIsDisintegrating] = useState(false);
    const [splineError, setSplineError] = useState(false);
    const [supportsWebGL, setSupportsWebGL] = useState(false);

    useEffect(() => {
        const hasWebGL = checkWebGLSupport();
        setSupportsWebGL(hasWebGL);

        if (!hasWebGL) {
            localStorage.setItem('hasSeenIntro', 'true');
            setTimeout(() => {
                navigate('/login');
            }, NO_WEBGL_REDIRECT_DELAY_MS);
        }
    }, [navigate]);

    useEffect(() => {
        if (splineError) {
            localStorage.setItem('hasSeenIntro', 'true');
            setTimeout(() => {
                navigate('/login');
            }, SPLINE_ERROR_REDIRECT_DELAY_MS);
        }
    }, [splineError, navigate]);

    const handleLoginClick = () => {
        localStorage.setItem('hasSeenIntro', 'true');

        setIsDisintegrating(true);
        createLightningStorm();

        setTimeout(() => {
            navigate('/login');
        }, LOGIN_CLICK_REDIRECT_DELAY_MS);
    };

    const handleSplineError = () => setSplineError(true);

    return {
        isDisintegrating,
        supportsWebGL,
        handleLoginClick,
        handleSplineError,
    };
};

export default useIntro;