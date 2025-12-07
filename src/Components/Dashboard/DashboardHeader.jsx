import React, { useEffect, useRef, useState } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';

const DashboardHeader = ({ title, subtitle, currentDateTime, refreshing, handleRefresh }) => {
  const notificationSoundRef = useRef(null);

  const soundOptions = {
    bell: {
      name: 'Bell 🔔',
      url: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'
    },
    elegant: {
      name: 'Elegant ✨',
      url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
    },
    soft: {
      name: 'Soft 🎵',
      url: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3'
    },
    chime: {
      name: 'Chime 🎐',
      url: 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3'
    },
    ding: {
      name: 'Ding 🔊',
      url: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3'
    }
  };

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationSoundEnabled');
    return saved === 'true';
  });
  const [selectedSound, setSelectedSound] = useState(() => {
    return localStorage.getItem('notificationSound') || 'bell';
  });

  // Fallback sound generator using Web Audio API
  const playFallbackSound = () => {
    console.log('🔊 playFallbackSound called');

    if (!soundEnabled) {
      console.log('⚠️ Fallback sound disabled by user');
      return;
    }

    try {
      console.log('🎵 Generating fallback beep sound...');
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // First beep
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);

      console.log('✅ First beep generated');

      // Second beep
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();

        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);

        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';

        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.1);

        console.log('✅ Second beep generated');
      }, 150);

      console.log('✅ Fallback sound played successfully!');
    } catch (error) {
      console.error('❌ Fallback sound generation failed:', error);
    }
  };

  const playNotificationSound = () => {
    setTimeout(() => {
      console.log('🔔 playNotificationSound called');
      // Check if sound is enabled
      if (!soundEnabled) {
        return;
      }

      try {
        if (notificationSoundRef.current) {
          notificationSoundRef.current.currentTime = 0;
          notificationSoundRef.current.volume = 0.7;

          const playPromise = notificationSoundRef.current.play();

          if (playPromise !== undefined) {
            playPromise
              .then(() => {
              })
              .catch(e => {
                console.error('❌ Audio play failed:', e);
                console.log('🔄 Trying fallback sound...');
                playFallbackSound();
              });
          }
        } else {
          console.error('❌ notificationSoundRef.current is null');
          playFallbackSound();
        }
      } catch (error) {
        console.error('❌ Error playing notification sound:', error);
        playFallbackSound();
      }
    }, 1000);
  };

  return (
    <div className="dashboard-header">
      <audio 
        ref={notificationSoundRef}
        src={soundOptions[selectedSound].url}
        preload="auto"
      />
      <div className="header-content">
        <h1 className="dashboard-title">{title}</h1>
        <p className="dashboard-subtitle">{subtitle}</p>
      </div>
      <div className="header-actions">
        <div className="datetime-display">
          <Calendar className="datetime-icon" />
          <span>{currentDateTime}</span>
        </div>
        <button
          onClick={() => {
            const newSoundState = !soundEnabled;
            setSoundEnabled(newSoundState);
            localStorage.setItem('notificationSoundEnabled', newSoundState.toString());
            console.log('🔊 Sound preference saved to localStorage:', newSoundState);

            // Play test sound when enabling
            if (newSoundState) {
              setTimeout(() => playNotificationSound(), 100);
            }
          }}
          className={`ntf-sound-toggle-btn ${soundEnabled ? 'sound-on' : 'sound-off'}`}
          title={soundEnabled ? 'Disable notification sound' : 'Enable notification sound'}
        >
          <span className="ntf-sound-icon">
            {soundEnabled ? (
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z" />
              </svg>
            )}
          </span>
          {soundEnabled ? 'Sound On' : 'Sound Off'}
        </button>
        <select
          value={selectedSound}
          onChange={(e) => {
            const newSound = e.target.value;
            setSelectedSound(newSound);
            localStorage.setItem('notificationSound', newSound);
            if (notificationSoundRef.current) {
              notificationSoundRef.current.src = soundOptions[newSound].url;
            }
            console.log('🎵 Changed sound to:', soundOptions[newSound].name);
            // Play preview
            setTimeout(() => playNotificationSound(), 100);
          }}
          className="ntf-sound-selector"
          title="Choose notification sound"
        >
          {Object.entries(soundOptions).map(([key, sound]) => (
            <option key={key} value={key}>
              {sound.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DashboardHeader;