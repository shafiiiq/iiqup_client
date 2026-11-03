import { requestSignatureChallenge } from '../api/signature.api';
import { SIGNATURE_ERROR_CODE } from '../constants/signature.constant';
import { signMessage } from './signature.device.crypto';
import { getStoredPrivateKey } from './signature.device.storage';

const buildProofMessage = ({ nonce, sourceKey, documentId, slotId }) => `${nonce}:${sourceKey}:${documentId}:${slotId}`;

const buildNotActivatedError = () =>
    Object.assign(new Error('This browser is not activated for signing'), {
        body: { errors: { code: SIGNATURE_ERROR_CODE.DEVICE_NOT_ACTIVATED } },
    });

export const buildSigningProof = async ({ sourceKey, documentId, slotId }) => {
    const privateKey = await getStoredPrivateKey();
    if (!privateKey) throw buildNotActivatedError();

    const challengeResponse = await requestSignatureChallenge();
    const challengeBody = await challengeResponse.json();
    const { challengeId, nonce } = challengeBody.data;

    const proof = await signMessage(privateKey, buildProofMessage({ nonce, sourceKey, documentId: String(documentId), slotId }));
    return { challengeId, proof };
};