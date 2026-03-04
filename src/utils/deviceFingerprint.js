export const getDeviceFingerprint = () => {
  const navigatorInfo = window.navigator;
  const screenInfo = window.screen;
  
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

let locationCache = null;
const LOCATION_CACHE_KEY = 'locationCache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; 

export const getLocationInfo = async () => {
  if (locationCache) {
    return locationCache;
  }

  const cached = localStorage.getItem(LOCATION_CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      locationCache = data;
      return data;
    }
  }

  try {
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000)
    });
    
    const data = await response.json();
    
    locationCache = {
      city: data.city || 'Unknown',
      region: data.region || 'Unknown',
      country: data.country_name || 'Unknown',
      ipAddress: data.ip || 'Unknown'
    };
    
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({
      data: locationCache,
      timestamp: Date.now()
    }));
    
    return locationCache;
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