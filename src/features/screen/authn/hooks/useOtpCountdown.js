import { useEffect, useState } from 'react';
import { OTP_RESEND_COOLDOWN_SECONDS } from '../constants/authn.constant';

export const useOtpCountdown = () => {
    const [remainingSeconds, setRemainingSeconds] = useState(0);

    useEffect(() => {
        if (remainingSeconds <= 0) return undefined;
        const timeoutId = setTimeout(() => setRemainingSeconds((seconds) => seconds - 1), 1000);
        return () => clearTimeout(timeoutId);
    }, [remainingSeconds]);

    const startCountdown = () => setRemainingSeconds(OTP_RESEND_COOLDOWN_SECONDS);

    const stopCountdown = () => setRemainingSeconds(0);

    const countdownLabel = `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`;

    return { remainingSeconds, countdownLabel, startCountdown, stopCountdown };
};