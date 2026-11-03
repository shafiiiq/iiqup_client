import { useCallback, useEffect, useRef, useState } from 'react';
import { requestSignatureActivation, pollSignatureActivation, cancelSignatureActivation } from '../api/signature.api';
import { SIGNATURE_ACTIVATION_POLL_INTERVAL_MS, SIGNATURE_ACTIVATION_KIND } from '../constants/signature.constant';
import { generateDeviceKeyPair, exportPublicKey } from '../helper/signature.device.crypto';
import { storePendingPrivateKey, takePendingPrivateKey, storeDeviceCredentials } from '../helper/signature.device.storage';

const useSignatureActivation = ({ onApproved, onFailed }) => {
    const [activeRequest, setActiveRequest] = useState(null);
    const callbacksRef = useRef({ onApproved, onFailed });
    callbacksRef.current = { onApproved, onFailed };

    useEffect(() => {
        if (!activeRequest) return undefined;

        let isCancelled = false;
        let timerId = null;

        const poll = async () => {
            try {
                const response = await pollSignatureActivation(activeRequest.requestId, activeRequest.pollSecret);
                const { data } = await response.json();
                if (isCancelled) return;

                if (data.status === 'pending') {
                    timerId = setTimeout(poll, SIGNATURE_ACTIVATION_POLL_INTERVAL_MS);
                    return;
                }

                if (data.status === 'approved' && data.deviceToken) {
                    const privateKey = await takePendingPrivateKey();
                    await storeDeviceCredentials({ deviceToken: data.deviceToken, privateKey });
                    setActiveRequest(null);
                    callbacksRef.current.onApproved();
                    return;
                }

                setActiveRequest(null);
                callbacksRef.current.onFailed(data.status);
            } catch (error) {
                if (isCancelled) return;
                console.error('[useSignatureActivation] poll:', error);
                setActiveRequest(null);
                callbacksRef.current.onFailed('failed', error.message);
            }
        };

        poll();

        return () => {
            isCancelled = true;
            clearTimeout(timerId);
        };
    }, [activeRequest]);

    const start = useCallback(async ({ activationCode = '', kind = SIGNATURE_ACTIVATION_KIND.ACTIVATION }) => {
        try {
            const keyPair = await generateDeviceKeyPair();
            const publicKey = await exportPublicKey(keyPair.publicKey);
            const response = await requestSignatureActivation({
                kind,
                activationCode,
                publicKey,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            });
            const { data } = await response.json();
            await storePendingPrivateKey(keyPair.privateKey);
            setActiveRequest({ requestId: data.requestId, pollSecret: data.pollSecret, matchNumber: data.matchNumber });
            return { ok: true };
        } catch (error) {
            return { ok: false, message: error.message || 'Activation failed' };
        }
    }, []);

    const cancel = useCallback(async () => {
        const currentRequest = activeRequest;
        setActiveRequest(null);
        if (!currentRequest) return;
        await cancelSignatureActivation(currentRequest.requestId, currentRequest.pollSecret).catch(() => undefined);
    }, [activeRequest]);

    return {
        isWaiting: Boolean(activeRequest),
        matchNumber: activeRequest?.matchNumber ?? null,
        start,
        cancel,
    };
};

export default useSignatureActivation;