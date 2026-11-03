const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const REMEMBERED_SESSION_LIFETIME_DAYS = 30;
const STANDARD_SESSION_LIFETIME_DAYS = 1;

export const resolveSessionExpiryTimestamp = (isRemembered) => {
  const lifetimeDays = isRemembered ? REMEMBERED_SESSION_LIFETIME_DAYS : STANDARD_SESSION_LIFETIME_DAYS;
  return Date.now() + lifetimeDays * MILLISECONDS_PER_DAY;
};