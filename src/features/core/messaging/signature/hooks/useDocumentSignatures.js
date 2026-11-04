import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import socketService from '@/features/core/network/socket/socket.service';
import {
    fetchMySignatureStatus,
    fetchDocumentSignatures,
    fetchSignatureImage,
    submitSignature,
} from '../api/signature.api';
import { buildSigningProof } from '../helper/signature.device.proof';

const useDocumentSignatures = ({ sourceKey, documentId }) => {
    const [slots, setSlots] = useState([]);
    const [imageByEventId, setImageByEventId] = useState({});
    const [status, setStatus] = useState(null);
    const [isSigning, setIsSigning] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const imageCacheRef = useRef({});

    const loadImages = useCallback(async (loadedSlots) => {
        const missingSlots = loadedSlots.filter((slot) => slot.eventId && !imageCacheRef.current[slot.eventId]);
        const loadedImages = await Promise.all(
            missingSlots.map(async (slot) => {
                try {
                    const response = await fetchSignatureImage(slot.eventId);
                    const body = await response.json();
                    return [slot.eventId, body.data.dataUrl];
                } catch (error) {
                    console.error('[useDocumentSignatures] loadImages:', error);
                    return [slot.eventId, ''];
                }
            })
        );

        loadedImages.forEach(([eventId, dataUrl]) => {
            if (dataUrl) imageCacheRef.current[eventId] = dataUrl;
        });
        setImageByEventId({ ...imageCacheRef.current });
    }, []);

    const refreshStatus = useCallback(async () => {
        const response = await fetchMySignatureStatus();
        const body = await response.json();
        setStatus(body.data);
        return body.data;
    }, []);

    const load = useCallback(async () => {
        if (!documentId) return;

        try {
            const [viewBody, statusBody] = await Promise.all([
                fetchDocumentSignatures(sourceKey, documentId).then((response) => response.json()),
                fetchMySignatureStatus().then((response) => response.json()).catch(() => null),
            ]);

            setSlots(viewBody.data.slots);
            if (statusBody) setStatus(statusBody.data);
            await loadImages(viewBody.data.slots);
        } catch (error) {
            console.error('[useDocumentSignatures] load:', error);
        } finally {
            setIsLoaded(true);
        }
    }, [sourceKey, documentId, loadImages]);

    const sign = useCallback(
        async ({ slotId, override = false }) => {
            setIsSigning(true);
            try {
                const { challengeId, proof } = await buildSigningProof({ sourceKey, documentId, slotId });
                const response = await submitSignature({ sourceKey, documentId, slotId, override, challengeId, proof });
                const body = await response.json();

                if (body.requireOverride) {
                    return { outcome: 'override_required', unsignedPositions: body.unsignedPositions || [] };
                }

                await load();
                return { outcome: 'signed' };
            } catch (error) {
                console.error('[useDocumentSignatures] sign:', error);
                return { outcome: 'failed', code: error.body?.errors?.code || null, message: error.message };
            } finally {
                setIsSigning(false);
            }
        },
        [sourceKey, documentId, load]
    );

    useEffect(() => socketService.on('signature_status_changed', () => { refreshStatus().catch(() => undefined); }), [refreshStatus]);

    const slotViews = useMemo(
        () => slots.map((slot) => ({ ...slot, imageUrl: slot.eventId ? imageByEventId[slot.eventId] || '' : '' })),
        [slots, imageByEventId]
    );

    return { slots: slotViews, status, isSigning, isLoaded, load, refreshStatus, sign };
};

export default useDocumentSignatures;