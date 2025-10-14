// New file: utils/deviceFingerprint.js
export const getDeviceFingerprint = () => {
  const navigatorInfo = window.navigator;
  const screenInfo = window.screen;
  
  // Generate unique code based on browser characteristics
  const uniqueCode = btoa(
    `${navigatorInfo.userAgent}-${screenInfo.width}x${screenInfo.height}-${navigatorInfo.language}`
  ).substring(0, 32);
  
  return {
    uniqueCode,
    userAgent: navigatorInfo.userAgent,
    browserInfo: `${navigatorInfo.appName} ${navigatorInfo.appVersion}`,
    screenResolution: `${screenInfo.width}x${screenInfo.height}`,
    language: navigatorInfo.language,
    platform: navigatorInfo.platform
  };
};

export const getLocationInfo = async () => {
  try {
    // Get IP-based location
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    return {
      city: data.city || 'Unknown',
      region: data.region || 'Unknown',
      country: data.country_name || 'Unknown',
      ipAddress: data.ip || 'Unknown'
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return {
      city: 'Unknown',
      region: 'Unknown',
      country: 'Unknown',
      ipAddress: 'Unknown'
    };
  }
};