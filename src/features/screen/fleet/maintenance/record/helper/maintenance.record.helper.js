export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
};

export const getServiceTypeClass = (serviceType) => {
    const type = serviceType?.toLowerCase() || 'normal';
    return `service-row-${type}`;
};

export const getServiceTypeDisplay = (serviceType) => {
    const type = serviceType?.toLowerCase() || 'normal';
    if (type === 'major') return 'MAJOR SERVICE';
    return type.toUpperCase();
};

export const calculateRowHeight = (text) => {
    if (!text) return 35;
    const charCount = text.length;
    const lines = Math.ceil(charCount / 50);
    return Math.max(35, lines * 15);
};

export const groupServiceRecordsByEquipment = (items) => {
    const groups = {};
    items.forEach((item) => {
        const key = `${item.machine || 'Equipment'} — ${item.regNo || 'Unknown'}`;
        (groups[key] = groups[key] || []).push(item);
    });
    return groups;
};