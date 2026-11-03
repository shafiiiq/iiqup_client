import { readStoredUserData } from '@/features/core/device/storage/credentials/credentials.user.data';

const DATABASE_NAME = 'signatureDeviceStore';
const STORE_NAME = 'deviceCredentials';
const DATABASE_VERSION = 2;

const readCurrentUserId = () => readStoredUserData()?._id || '';

const buildPendingKeyName = (userId) => `pending:${userId}`;

const requireCurrentUserId = () => {
    const userId = readCurrentUserId();
    if (!userId) throw new Error('Signed-in user not found');
    return userId;
};

const openDatabase = () =>
    new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

const runStoreOperation = async (mode, operation) => {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const request = operation(transaction.objectStore(STORE_NAME));
        transaction.oncomplete = () => {
            database.close();
            resolve(request.result);
        };
        transaction.onerror = () => {
            database.close();
            reject(transaction.error);
        };
    });
};

export const getStoredDeviceCredentials = async () => {
    const userId = readCurrentUserId();
    if (!userId) return null;
    try {
        return (await runStoreOperation('readonly', (store) => store.get(userId))) || null;
    } catch (error) {
        console.error('[signature.device.storage] getStoredDeviceCredentials:', error);
        return null;
    }
};

export const getStoredDeviceToken = async () => (await getStoredDeviceCredentials())?.deviceToken || '';

export const getStoredPrivateKey = async () => (await getStoredDeviceCredentials())?.privateKey || null;

export const storeDeviceCredentials = async ({ deviceToken, privateKey }) => {
    const userId = requireCurrentUserId();
    await runStoreOperation('readwrite', (store) => store.put({ deviceToken, privateKey }, userId));
};

export const clearStoredDeviceCredentials = async () => {
    const userId = readCurrentUserId();
    if (!userId) return;
    await runStoreOperation('readwrite', (store) => store.delete(userId));
};

export const storePendingPrivateKey = async (privateKey) => {
    const userId = requireCurrentUserId();
    await runStoreOperation('readwrite', (store) => store.put(privateKey, buildPendingKeyName(userId)));
};

export const takePendingPrivateKey = async () => {
    const userId = requireCurrentUserId();
    const privateKey = await runStoreOperation('readonly', (store) => store.get(buildPendingKeyName(userId)));
    await runStoreOperation('readwrite', (store) => store.delete(buildPendingKeyName(userId)));
    return privateKey || null;
};