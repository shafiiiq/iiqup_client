import { OTP_LENGTH } from '../constants/authn.constant';

export const createEmptyOtpDigits = () => Array(OTP_LENGTH).fill('');

export const createOtpDigitsFromText = (text) =>
    Array.from({ length: OTP_LENGTH }, (_, index) => text[index] ?? '');

export const extractOtpDigit = (text) => text.replace(/\D/g, '').slice(-1);

export const extractOtpDigits = (text) => text.replace(/\D/g, '').slice(0, OTP_LENGTH);

export const focusOtpInputByIndex = (index) => {
    document.querySelectorAll('.auth-otp-inputs input')[index]?.focus();
};