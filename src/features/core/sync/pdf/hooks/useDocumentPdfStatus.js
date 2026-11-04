import { useEffect, useState } from 'react';
import socketService from '@/features/core/network/socket/socket.service';
import { fetchDocumentPdfStatus } from '../api/document.pdf.api';
import { DOCUMENT_PDF_STATUS_EVENT, DOCUMENT_PDF_READY_STATUS } from '../constants/document.pdf.constant';
import { isPdfRenderMode } from '../helper/document.pdf.helper';

const useDocumentPdfStatus = ({ sourceKey, documentId }) => {
    const [isPdfReady, setIsPdfReady] = useState(false);

    useEffect(() => {
        if (!sourceKey || !documentId || isPdfRenderMode()) return undefined;

        let isCancelled = false;
        setIsPdfReady(false);

        const loadPdfStatus = async () => {
            try {
                const body = await fetchDocumentPdfStatus(sourceKey, documentId);
                if (!isCancelled) setIsPdfReady(Boolean(body.data?.isReady));
            } catch (error) {
                console.error('[useDocumentPdfStatus] loadPdfStatus:', error);
            }
        };

        loadPdfStatus();

        const stopListening = socketService.on(DOCUMENT_PDF_STATUS_EVENT, (payload) => {
            if (payload.sourceKey !== sourceKey || payload.documentId !== documentId) return;
            setIsPdfReady(payload.status === DOCUMENT_PDF_READY_STATUS);
        });

        return () => {
            isCancelled = true;
            stopListening();
        };
    }, [sourceKey, documentId]);

    return { isPdfReady };
};

export default useDocumentPdfStatus;