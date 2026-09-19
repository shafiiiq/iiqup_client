export const getTodayDateInput = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60000);
    return localDate.toISOString().split('T')[0];
};

export const generateBackchargeRef = (number) => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const padded = String(Math.max(0, Math.floor(Number(number) || 0))).padStart(3, '0');
    return `ATE-BC-${day}${month}${year}-${padded}`;
};