import { OTP_LENGTH } from '../constants/authn.constant';

const AUTH_MAIL_PATTERN = /^\S+@\S+\.\S+$/;

export const normalizeAuthMail = (authMail) => authMail.trim().toLowerCase();

export const validateAuthnFields = (email, password) =>
    !email.trim() || !password ? 'Please fill in all fields' : null;

export const validateAuthMail = (authMail) => {
    const normalizedAuthMail = normalizeAuthMail(authMail);
    if (!normalizedAuthMail) return 'Please enter an email address';
    if (!AUTH_MAIL_PATTERN.test(normalizedAuthMail)) return 'Please enter a valid email address';
    return null;
};

export const validateOtpCode = (otpCode) =>
    otpCode.length < OTP_LENGTH ? `Please enter the ${OTP_LENGTH}-digit code` : null;