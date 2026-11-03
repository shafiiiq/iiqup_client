export const convertVapidKeyToBytes = (base64UrlKey) => {
  const padding = '='.repeat((4 - (base64UrlKey.length % 4)) % 4);
  const base64Key = (base64UrlKey + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawKey = window.atob(base64Key);
  return Uint8Array.from(rawKey, (character) => character.charCodeAt(0));
};