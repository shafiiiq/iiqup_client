export const formatQatarTime = (dateValue) => {
  if (!dateValue) return 'N/A';
  const qatarTime = new Date(new Date(dateValue).getTime() - 3 * 60 * 60 * 1000);
  let hours = qatarTime.getHours();
  const minutes = String(qatarTime.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${period}`;
};

export const formatMinutesAsDuration = (minutes) => {
  if (!minutes) return '0h 0m';
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

export const groupAttendanceByDate = (records) =>
  records.reduce((groups, record) => {
    const date = record.dateOnly;
    groups[date] = groups[date] ? [...groups[date], record] : [record];
    return groups;
  }, {});

export const buildAttendanceRows = (records) =>
  Object.entries(groupAttendanceByDate(records)).map(([date, dayRecords]) => {
    const sorted = [...dayRecords].sort((a, b) => new Date(a.punchDateTime) - new Date(b.punchDateTime));
    const checkIn = sorted[0];
    const checkOut = sorted.length > 1 ? sorted[sorted.length - 1] : null;
    const breakOut = sorted[1];
    const breakIn = sorted[2];

    let totalMinutes = 0;
    if (checkIn && checkOut) {
      totalMinutes = Math.floor((new Date(checkOut.punchDateTime) - new Date(checkIn.punchDateTime)) / 60000);
      if (breakOut && breakIn) {
        totalMinutes -= Math.floor((new Date(breakIn.punchDateTime) - new Date(breakOut.punchDateTime)) / 60000);
      }
    }

    return { date, checkIn, breakOut, breakIn, checkOut, totalMinutes };
  });

export const buildAttendanceQuery = (filterType, dateRange = {}) => {
  const today = new Date();

  switch (filterType) {
    case 'daily':
      return { date: today.toISOString().split('T')[0] };
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { date: yesterday.toISOString().split('T')[0] };
    }
    case 'weekly': {
      const year = today.getFullYear();
      const week = Math.ceil((today - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
      return { year, week };
    }
    case 'monthly':
      return { year: today.getFullYear(), month: String(today.getMonth() + 1).padStart(2, '0') };
    case 'yearly':
      return { year: today.getFullYear() };
    case 'date-range':
      return dateRange.start && dateRange.end
        ? { startDate: dateRange.start, endDate: dateRange.end }
        : null;
    case 'all':
      return {};
    default:
      return {};
  }
};

export const buildMechanicOverviewRows = (mechanic) => [
  { field: 'Name', value: mechanic.name },
  { field: 'User ID', value: mechanic.userId ?? mechanic._id },
  { field: 'Email', value: mechanic.email || '—' },
  { field: 'ZKTeco PIN', value: mechanic.zktecoPin ?? '—' },
  { field: 'Status', value: mechanic.isActive ? 'Active' : 'Inactive' },
  { field: 'Toolkits Assigned', value: mechanic.toolkits?.length || 0 },
];

export const buildRecentActivityRows = (records = []) =>
  records.map((record, index) => ({
    id: record._id || `${record.pin}-${record.punchDateTime}-${index}`,
    mechanicName: record.mechanicName || `Pin ${record.pin ?? '—'}`,
    date: record.dateOnly || '—',
    time: formatQatarTime(record.punchDateTime),
    punchType: record.punchType || '—',
  }));