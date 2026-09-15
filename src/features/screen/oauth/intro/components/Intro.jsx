import React from 'react';
import Spline from '@splinetool/react-spline';
import Button from '@/shared/components/widgets/button/Button';
import useIntro from '../hooks/useIntro';
import { SPLINE_SCENE_URL } from '../constants/intro.constant';
import './Intro.css';

function Intro() {
    const {
        isDisintegrating,
        supportsWebGL,
        handleLoginClick,
        handleSplineError,
    } = useIntro();

    return (
        <div className={`intro-hero ${isDisintegrating ? 'disintegrating' : ''}`}>
            <div className="login-navigate">
                <Button
                    text="Login"
                    onClick={handleLoginClick}
                    colorScheme="amber-600"
                    variant="gradient"
                    font="3xl"
                    squircle="4xl"
                    width="300px"
                    height="70px"
                    type="button"
                    textColor="white-200"
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

export default Intro;