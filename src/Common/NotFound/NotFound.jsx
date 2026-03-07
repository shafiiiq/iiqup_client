import React from 'react'
import Button from '../Button/Button'
import { useNavigate } from 'react-router';
import Oops from '../../assets/video/not-found.mp4'
import './NotFound.css'

function NotFound() {
    const navigate = useNavigate();

    const backToHome = () => {
        navigate(`/`);

    };

    return (
        <div className="not-found-wrapper">
            <video
                className="not-found-video-overlay"
                autoPlay
                loop
                muted
                playsInline
            >
                <source src={Oops} type="video/mp4" />
            </video>
            <div className="not-found-container">
                <h1 className="not-found-status">
                    404
                </h1>
                <div className="not-found-details">
                    <p className="not-found-title">
                        Oops, I think we're lost
                    </p>
                    <p className="not-found-subtitle">
                        Lets'get you back to somewher familiar
                    </p>
                    <Button
                        text="Back to Home"
                        onClick={backToHome}
                        colorScheme="yellow-500"
                        variant="gradient"
                        font="xl"
                        animation=""
                        squircle="6xl"
                        width="220px"
                        height="58px"
                        type="submit"
                        textColor="black-200"
                        shadowPosition="to-bottom"
                        shadowColor="white-600"
                    />
                </div>
            </div>
        </div>
    )
}

export default NotFound