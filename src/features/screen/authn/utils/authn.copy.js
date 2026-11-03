import { AUTHN_STEPS } from '../constants/authn.constant';

const DEFAULT_PANEL_SUBTITLE =
    'New updates include useful features for everyday work tasks users, to support normal work needs ease comfort clarity and smooth use across teams daily.';

export const getAuthnPanelTitle = ({ step, hasError }) => {
    if (hasError) return 'Please be here';
    if (step === AUTHN_STEPS.OTP) return "We've sent an OTP";
    if (step === AUTHN_STEPS.UPDATE_AUTH_MAIL) return 'Set up your security';
    return 'Step forward';
};

export const getAuthnPanelSubtitle = ({ step, errorMessage }) => {
    if (errorMessage) return errorMessage;
    if (step === AUTHN_STEPS.OTP) return '';
    if (step === AUTHN_STEPS.UPDATE_AUTH_MAIL) return 'Set up your authentication email for enhanced security';
    return DEFAULT_PANEL_SUBTITLE;
};

export const getAuthnContinueText = ({ step, isLoading, canResendOtp }) => {
    if (canResendOtp) return 'Resend Code';
    if (isLoading) return step === AUTHN_STEPS.AUTHN ? 'Signing in...' : 'Verifying...';
    return 'Continue';
};