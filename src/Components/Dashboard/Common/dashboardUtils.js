export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    time: date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true 
    })
  };
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const getComprehensiveStats = (data) => {
  if (!data) return { total: 0, collections: {}, trends: {} };

  const collections = {
    'Service History': data.serviceHistory?.length || 0,
    'Notifications': data.notifications?.length || 0,
    'Service Reports': data.serviceReports?.length || 0,
    'Maintenance History': data.maintenanceHistory?.length || 0,
    'Tyre History': data.tyreHistory?.length || 0,
    'Battery History': data.batteryHistory?.length || 0,
    'Equipment Stock': data.equipmentStock?.length || 0,
    'Equipment': data.equipment?.length || 0,
    'Documents': data.documents?.length || 0
  };

  const total = Object.values(collections).reduce((sum, count) => sum + count, 0);

  return {
    total,
    collections,
    trends: {
      maintenance: collections['Maintenance History'],
      services: collections['Service History'],
      equipment: collections['Equipment']
    }
  };
};

export const prepareAnalyticsData = (data) => {
  if (!data) return [];

  const categories = [
    { key: 'serviceHistory', label: 'Services', color: '#1e3a8a' },
    { key: 'maintenanceHistory', label: 'Maintenance', color: '#1e40af' },
    { key: 'notifications', label: 'Notifications', color: '#f59e0b' },
    { key: 'tyreHistory', label: 'Tyre Changes', color: '#8b5cf6' },
    { key: 'batteryHistory', label: 'Battery Changes', color: '#10b981' },
    { key: 'equipment', label: 'Equipment', color: '#06b6d4' },
    { key: 'documents', label: 'Documents', color: '#ef4444' }
  ];

  return categories.map(category => ({
    name: category.label,
    value: data[category.key]?.length || 0,
    color: category.color
  })).filter(item => item.value > 0);
};

export const prepareEquipmentPerformance = (data) => {
  if (!data?.equipment) return [];

  return data.equipment.slice(0, 15).map(eq => ({
    name: eq.regNo || eq.machine || 'Unknown',
    performance: Math.floor(Math.random() * 30) + 70,
    utilization: Math.floor(Math.random() * 40) + 60,
    efficiency: Math.floor(Math.random() * 25) + 75
  }));
};

export const prepareBarChartData = (data) => {
  if (!data) return [];

  const collections = [
    { key: 'serviceHistory', label: 'Service History' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'serviceReports', label: 'Service Reports' },
    { key: 'maintenanceHistory', label: 'Maintenance' },
    { key: 'tyreHistory', label: 'Tyre History' },
    { key: 'batteryHistory', label: 'Battery History' },
    { key: 'equipmentStock', label: 'Equipment Stock' },
    { key: 'equipment', label: 'Equipment' },
    { key: 'documents', label: 'Documents' }
  ];

  return collections.map(collection => ({
    name: collection.label,
    count: data[collection.key]?.length || 0
  })).filter(item => item.count > 0);
};