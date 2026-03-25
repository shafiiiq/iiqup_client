export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    }),
  };
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

export const formatCurrency = (value) =>
  (value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export const capitalize = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1);