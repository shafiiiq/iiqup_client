import { readStoredDeviceId, writeStoredDeviceId } from '../storage/keys/keys.device';

const DEVICE_ID_BYTE_LENGTH = 16;

const generateDeviceId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(DEVICE_ID_BYTE_LENGTH)), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');

const resolveDeviceId = () => {
  const storedDeviceId = readStoredDeviceId();
  if (storedDeviceId) return storedDeviceId;
  const generatedDeviceId = generateDeviceId();
  writeStoredDeviceId(generatedDeviceId);
  return generatedDeviceId;
};

export const getDeviceInfo = () => {
  const operatingSystemName = navigator.userAgentData?.platform || navigator.platform || 'Unknown OS';
  return {
    deviceId: resolveDeviceId(),
    deviceName: `${operatingSystemName} Browser`,
    deviceModel: navigator.userAgent.slice(0, 200),
    brand: 'Web',
    osName: operatingSystemName,
    platform: 'web',
    authnTime: new Date().toISOString(),
  };
};