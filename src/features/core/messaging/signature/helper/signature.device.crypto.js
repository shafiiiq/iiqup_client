const KEY_ALGORITHM = { name: 'ECDSA', namedCurve: 'P-256' };
const SIGN_ALGORITHM = { name: 'ECDSA', hash: 'SHA-256' };

const toBase64 = (buffer) => window.btoa(String.fromCharCode(...new Uint8Array(buffer)));

const getSubtleCrypto = () => {
    const subtleCrypto = window.crypto?.subtle;
    if (!subtleCrypto) {
        throw new Error('Secure browser cryptography is unavailable. Open this page over HTTPS in a supported browser and try again.');
    }
    return subtleCrypto;
};

export const generateDeviceKeyPair = () => getSubtleCrypto().generateKey(KEY_ALGORITHM, false, ['sign', 'verify']);

export const exportPublicKey = async (publicKey) => toBase64(await getSubtleCrypto().exportKey('spki', publicKey));

export const signMessage = async (privateKey, message) =>
    toBase64(await getSubtleCrypto().sign(SIGN_ALGORITHM, privateKey, new TextEncoder().encode(message)));