import React from 'react';
import Spline from '@splinetool/react-spline';
import Button from '@/shared/components/widgets/button/Button';
import useOnboard from '../hooks/useOnboard';
import { SPLINE_SCENE_URL } from '../constants/onboard.constant';
import './Onboard.css';

function Onboard() {
    const {
        isDisintegrating,
        supportsWebGL,
        handleAuthnClick,
        handleSplineError,
    } = useOnboard();

    return (
        <div className={`onboard-hero ${isDisintegrating ? 'disintegrating' : ''}`}>
            <div className="authn-navigate">
                <Button
                    text="Continue to Login"
                    onClick={handleAuthnClick}
                    colorScheme="warning-600"
                    variant="gradient"
                    font="3xl"
                    squircle="4xl"
                    width="300px"
                    height="70px"
                    type="button"
                    textColor="black-200"
                    shadowPosition="to-bottom"
                    shadowColor="white-600"
                />
            </div>
            {supportsWebGL ? (
                <Spline
                    scene={SPLINE_SCENE_URL}
                    style={{ width: '100%', height: '105vh' }}
                    onError={handleSplineError}
                />
            ) : (
                <div className="spline-fallback"> </div>
            )}
        </div>
    );
}

export default Onboard;