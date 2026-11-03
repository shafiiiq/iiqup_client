import React from 'react';
import Spline from '@splinetool/react-spline';

import Button from '@/shared/components/widgets/button/Button';
import Input from '@/shared/components/widgets/input/Input';

import useAuthn from '../hooks/useAuthn';
import { FIELD_INPUT_PROPS, FORGOT_PASSWORD_THRESHOLD } from '../constants/authn.constant';

import './Authn.css';

function AuthnFormFields({ email, setEmail, password, setPassword, rememberMe, setRememberMe }) {
    return (
        <div className="auth-authn-form-container">
            <form className="auth-authn-form">
                <div className="auth-form-group">
                    <Input
                        {...FIELD_INPUT_PROPS}
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        label="Email Address"
                        placeholder="Enter your email"
                    />
                </div>
                <div className="auth-form-group">
                    <Input
                        {...FIELD_INPUT_PROPS}
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        label="Password"
                        placeholder="Enter your password"
                    />
                </div>
                <div className="auth-form-group">
                    <Input
                        type="checkbox"
                        name="rememberMe"
                        onChange={(e) => setRememberMe(e.target.checked)}
                        checked={rememberMe}
                        label="Remember me for 30 days"
                        labelPosition="right"
                        labelBgColor="transparent"
                        labelSize="2xl"
                        size="md"
                        squircle="10xl"
                        colorScheme="warning-700"
                        onCheckedColorScheme="warning-300"
                        onCheckedColor="black-300"
                        variant="gradient"
                    />
                </div>
            </form>
        </div>
    );
}

function AuthMailFormFields({ authMail, setAuthMail }) {
    return (
        <div className="auth-authn-form-container">
            <form className="auth-authn-form">
                <div className="auth-form-group">
                    <Input
                        {...FIELD_INPUT_PROPS}
                        type="email"
                        id="authMail"
                        name="authMail"
                        value={authMail}
                        onChange={(e) => setAuthMail(e.target.value)}
                        label="Authentication Email"
                        placeholder="Enter authentication email"
                    />
                </div>
            </form>
        </div>
    );
}

function OTPFormFields({ otpDigits, onOTPChange, onOTPKeyDown, onOTPPaste }) {
    return (
        <div className="auth-authn-form-container">
            <form className="auth-authn-form">
                <div className="auth-form-group">
                    <div className="auth-otp-inputs">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                            <Input
                                key={index}
                                type="text"
                                maxLength={1}
                                value={otpDigits[index] || ''}
                                onChange={(e) => onOTPChange(index, e)}
                                onKeyDown={(e) => onOTPKeyDown(index, e)}
                                onPaste={onOTPPaste}
                                colorScheme="warning-400"
                                textColor="black-100"
                                fontSize="40xl"
                                variant="gradient"
                                width="100px"
                                height="100px"
                                squircle="10xl"
                                fontWeight="600"
                                inputPaddingInline="null"
                            />
                        ))}
                    </div>
                </div>
            </form>
        </div>
    );
}

const Authn = ({ setUserLoggedIn }) => {
    const {
        step,
        error,
        email,
        setEmail,
        password,
        setPassword,
        authMail,
        setAuthMail,
        otpDigits,
        otpEmailDisplay,
        rememberMe,
        setRememberMe,
        remainingTime,
        failedAttempts,
        supportsWebGL,
        handleOTPChange,
        handleOTPKeyDown,
        handleOTPPaste,
        handleResendOTP,
        countdownLabel,
        isOTPContinueDisabled,
        panelTitle,
        panelSubtitle,
        isBackEnabled,
        continueText,
        handleContinue,
        handleBackToAuthn,
    } = useAuthn({ setUserLoggedIn });

    return (
        <div className="auth-authn-container">

            <div className="auth-left-section">
                <div className="auth-left-spt">

                    {supportsWebGL ? (
                        <Spline
                            scene="https://prod.spline.design/LCYzYZEH1lngG-Tq/scene.splinecode"
                            style={{ width: '100%', height: '105vh' }}
                        />
                    ) : (
                        <div className="spline-fallback" />
                    )}

                    <div className="auth-info">
                        <h1 className={`auth-title${error ? ' auth-subtitle-error' : ''}`}>
                            {panelTitle}
                        </h1>
                        <p className={`auth-subtitle${error ? ' auth-subtitle-error' : ''}`}>
                            {step === 'otp' && !error ? (
                                <>
                                    Enter the 6-digit code sent to <strong>{otpEmailDisplay}</strong>
                                </>
                            ) : (
                                panelSubtitle
                            )}
                        </p>

                        <div className="auth-buttons">
                            <Button
                                text={isBackEnabled ? 'Back to login' : "Let's"}
                                onClick={isBackEnabled ? handleBackToAuthn : undefined}
                                colorScheme="primary-100"
                                variant="gradient"
                                font="3xl"
                                squircle="4xl"
                                width="300px"
                                height="70px"
                                type="button"
                                cursor={isBackEnabled ? 'pointer' : 'not-allowed'}
                                textColor="white-200"
                                shadowPosition="to-bottom"
                                shadowColor="white-600"
                            />

                            <Button
                                text={continueText}
                                onClick={handleContinue}
                                colorScheme="warning-400"
                                variant="gradient"
                                font="3xl"
                                squircle="4xl"
                                width="300px"
                                height="70px"
                                type={isOTPContinueDisabled ? 'disabled' : 'button'}
                                cursor={isOTPContinueDisabled ? 'not-allowed' : 'pointer'}
                                textColor="black-200"
                                shadowPosition="to-bottom"
                                shadowColor="white-600"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="auth-right-section">
                <div className="auth-authn-card">
                    {step === 'updateAuthMail' && <AuthMailFormFields authMail={authMail} setAuthMail={setAuthMail} />}
                    {step === 'otp' && (
                        <OTPFormFields
                            otpDigits={otpDigits}
                            onOTPChange={handleOTPChange}
                            onOTPKeyDown={handleOTPKeyDown}
                            onOTPPaste={handleOTPPaste}
                        />
                    )}
                    {step !== 'updateAuthMail' && step !== 'otp' && (
                        <AuthnFormFields
                            email={email}
                            setEmail={setEmail}
                            password={password}
                            setPassword={setPassword}
                            rememberMe={rememberMe}
                            setRememberMe={setRememberMe}
                        />
                    )}
                </div>
            </div>

            {step === 'authn' && failedAttempts >= FORGOT_PASSWORD_THRESHOLD && (
                <div className="auth-form-footer">
                    <button type="button" className="auth-forgot-btn">
                        Oops, looks like lost! Forgot Password?
                    </button>
                </div>
            )}

            {step === 'otp' && (
                <div className="auth-form-footer">
                    <div className="auth-resend-container">
                        <Button
                            text={remainingTime > 0
                                ? `Resend code in ${countdownLabel}`
                                : "Didn't receive the code? Resend Code"}
                            onClick={handleResendOTP}
                            disabled={remainingTime > 0}
                            colorScheme="black-900"
                            variant="gradient"
                            font="3xl"
                            animation=""
                            squircle="10xl"
                            width={remainingTime > 0 ? '300px' : '580px'}
                            height="50px"
                            type={remainingTime > 0 ? 'disabled' : 'button'}
                            cursor={remainingTime > 0 ? 'not-allowed' : 'pointer'}
                            textColor="white-200"
                            shadowPosition="to-bottom"
                            shadowColor="white-600"
                        />
                    </div>
                </div>
            )}

        </div>
    );
};

export default Authn;