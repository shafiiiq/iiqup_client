import { useState } from 'react';
import { OTP_LENGTH } from '../constants/authn.constant';
import {
    createEmptyOtpDigits,
    createOtpDigitsFromText,
    extractOtpDigit,
    extractOtpDigits,
    focusOtpInputByIndex,
} from '../utils/authn.otp';

export const useOtpInputs = () => {
    const [otpDigits, setOtpDigits] = useState(createEmptyOtpDigits());

    const otpCode = otpDigits.join('');
    const isOtpComplete = otpDigits.every(Boolean);

    const replaceDigitAt = (index, digit) =>
        setOtpDigits((currentDigits) =>
            currentDigits.map((currentDigit, digitIndex) => (digitIndex === index ? digit : currentDigit))
        );

    const handleOtpChange = (index, event) => {
        const digit = extractOtpDigit(event.target.value);
        if (!digit) return;
        replaceDigitAt(index, digit);
        if (index < OTP_LENGTH - 1) focusOtpInputByIndex(index + 1);
    };

    const handleOtpKeyDown = (index, event) => {
        if (event.key !== 'Backspace') return;
        if (otpDigits[index]) {
            replaceDigitAt(index, '');
            return;
        }
        if (index > 0) {
            replaceDigitAt(index - 1, '');
            focusOtpInputByIndex(index - 1);
        }
    };

    const handleOtpPaste = (event) => {
        event.preventDefault();
        const pastedDigits = extractOtpDigits(event.clipboardData.getData('text'));
        if (!pastedDigits) return;
        setOtpDigits(createOtpDigitsFromText(pastedDigits));
        focusOtpInputByIndex(Math.min(pastedDigits.length, OTP_LENGTH - 1));
    };

    const resetOtpInputs = () => setOtpDigits(createEmptyOtpDigits());

    return {
        otpDigits,
        otpCode,
        isOtpComplete,
        handleOtpChange,
        handleOtpKeyDown,
        handleOtpPaste,
        resetOtpInputs,
    };
};