import React, { useRef, useState } from 'react';
import Button from '../../Common/Button/Button';
import Input from '../../Common/Input/Input';

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
    const saved = localStorage.getItem('notificationSound');
    return (saved && soundOptions[saved]) ? saved : 'bell';
  });

  const enableSound = () => {
    const newSoundState = !soundEnabled;
    setSoundEnabled(newSoundState);
    localStorage.setItem('notificationSoundEnabled', newSoundState.toString());
    if (newSoundState) {
      setTimeout(() => playNotificationSound(), 100);
    }
  }

  const playFallbackSound = () => {
    if (!soundEnabled) {
      console.error('Fallback sound disabled by user');
      return;
    }

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
      }, 150);

    } catch (error) {
      console.error('❌ Fallback sound generation failed:', error);
    }
  };

  const playNotificationSound = () => {
    setTimeout(() => {
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
          <span>{currentDateTime}</span>
        </div>
        <Button
          text={soundEnabled ? 'Sound On' : 'Sound Off'}
          onClick={enableSound}
          colorScheme={!soundEnabled ? 'amber-300' : 'amber-700'}
          variant="gradient"
          font="md"
          animation=""
          squircle="4xl"
          width="160px"
          height="46px"
          type="submit"
          textColor={!soundEnabled ? 'black-300' : 'white-800'}
          iconRight={!soundEnabled ? 'notification_audio_off' : 'notification_audio'}
          shadowPosition="to-bottom"
          shadowColor="white-600"
        />
        <Input
          type="select"
          value={selectedSound}
          onChange={(e) => {
            const newSound = e.target.value;
            setSelectedSound(newSound);
            localStorage.setItem('notificationSound', newSound);
            notificationSoundRef.current.src = soundOptions[newSound].url;
            setTimeout(() => playNotificationSound(), 100);
          }}
          options={Object.entries(soundOptions).map(([key, sound]) => ({
            label: sound.name,
            value: key
          }))}
          colorScheme="rose-700"
          variant="gradient"
          fontSize="md"
          squircle="4xl"
          width="140px"
          height="46px"
          textColor="white-200"
          shadowPosition="bottom"
          shadowColor="white-200"
          animation="none"
          fontWeight="500"
          inputPaddingInline="xl"
        />
      </div>
    </div>
  );
};

export default DashboardHeader;