import React, { useState } from 'react';
import NameSplash from '../assets/images/al-ansari.png';
import "./SplashScreen.css";

function SplashScreen() {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
    console.log('Image failed to load:', NameSplash);
  };

  const handleImageLoad = () => {
    return true
  };

  return (
    <div className="iiqup-splash-container">
      {/* Animated background particles */}
      <div className="iiqup-splash-particles">
        <div className="iiqup-splash-particle"></div>
        <div className="iiqup-splash-particle"></div>
        <div className="iiqup-splash-particle"></div>
        <div className="iiqup-splash-particle"></div>
        <div className="iiqup-splash-particle"></div>
      </div>
      
      {/* Main content */}
      <div className="iiqup-splash-content">
        {/* Logo container with animations */}
        <div className="iiqup-splash-logo-container">
          {!imageError ? (
            <img 
              src={NameSplash} 
              alt="Al Ansari Connect" 
              className="iiqup-splash-logo-image"
              onError={handleImageError}
              onLoad={handleImageLoad}
              style={{ opacity: imageError ? 0 : 1 }}
            />
          ) : (
            <div className="iiqup-splash-logo-fallback">
              <h1 style={{ 
                color: '#4a90e2', 
                fontSize: '3rem', 
                fontWeight: 'bold',
                margin: 0,
                textShadow: '0 0 20px rgba(74, 144, 226, 0.5)'
              }}>
                Al Ansari Connect
              </h1>
            </div>
          )}
        </div>
        
        {/* Loading animation */}
        <div className="iiqup-splash-loading-container">
          <div className="iiqup-splash-loading-bar">
            <div className="iiqup-splash-loading-progress"></div>
          </div>
          <div className="iiqup-splash-loading-dots">
            <span className="iiqup-splash-dot"></span>
            <span className="iiqup-splash-dot"></span>
            <span className="iiqup-splash-dot"></span>
          </div>
        </div>
        
        {/* Powered by text */}
        <div className="iiqup-splash-powered-by">
          <p>Powered By Al Ansari</p>
        </div>
      </div>
      
      {/* Overlay effects */}
      <div className="iiqup-splash-overlay-gradient"></div>
    </div>
  );
}

export default SplashScreen;