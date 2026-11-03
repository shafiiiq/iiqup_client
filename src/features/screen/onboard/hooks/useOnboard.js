import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { checkWebGLSupport } from '@/features/core/device/compatibility.device';
import { writeOnboardSeen } from '@/features/core/device/storage/keys/keys.app.flags';
import { createLightningStorm } from '../helper/onboard.helper';
import {
    NO_WEBGL_REDIRECT_DELAY_MS,
    SPLINE_ERROR_REDIRECT_DELAY_MS,
    AUTHN_CLICK_REDIRECT_DELAY_MS,
} from '../constants/onboard.constant';

const useOnboard = () => {
    const navigate = useNavigate();
    const [isDisintegrating, setIsDisintegrating] = useState(false);
    const [splineError, setSplineError] = useState(false);
    const [supportsWebGL, setSupportsWebGL] = useState(false);

    useEffect(() => {
        const hasWebGL = checkWebGLSupport();
        setSupportsWebGL(hasWebGL);

        if (!hasWebGL) {
            writeOnboardSeen();
            setTimeout(() => {
                navigate('/authn');
            }, NO_WEBGL_REDIRECT_DELAY_MS);
        }
    }, [navigate]);

    useEffect(() => {
        if (splineError) {
            writeOnboardSeen();
            setTimeout(() => {
                navigate('/authn');
            }, SPLINE_ERROR_REDIRECT_DELAY_MS);
        }
    }, [splineError, navigate]);

    const handleAuthnClick = () => {
        writeOnboardSeen();

        setIsDisintegrating(true);
        createLightningStorm();

        setTimeout(() => {
            navigate('/authn');
        }, AUTHN_CLICK_REDIRECT_DELAY_MS);
    };

    const handleSplineError = () => setSplineError(true);

    return {
        isDisintegrating,
        supportsWebGL,
        handleAuthnClick,
        handleSplineError,
    };
};

export default useOnboard;