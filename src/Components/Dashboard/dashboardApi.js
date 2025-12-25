import { END_POINT } from '../../constants';
import { COLORS } from './utils/dasboard-utils';
import { apiRequest } from '../../utils/0auth';
let equipmentCache = null;
let cacheTime = 0;

// Fetch dashboard data from API endpoints
export const fetchDashboardData = async () => {
    // Get equipment data (use cache if recent)
    const now = Date.now();
    if (!equipmentCache || (now - cacheTime) > 30000) {
        const equipResponse = await apiRequest(`${END_POINT}/equipments/get-equipments`);
        equipmentCache = await equipResponse.json();
        cacheTime = now;
    }

    // Create brand lookup map
    const brandMap = new Map();
    equipmentCache.data.forEach(equip => {
        brandMap.set(equip.regNo.toString(), equip.brand);
    });

    // Fetch dashboard data
    const endpoints = [
        `${END_POINT}/dashboard/get-daily-updates`,
        `${END_POINT}/dashboard/get-weekly-updates`,
        `${END_POINT}/dashboard/get-monthly-updates`,
        `${END_POINT}/dashboard/get-yearly-updates`
    ];

    const responses = await Promise.all(
        endpoints.map(url =>
            apiRequest(url, 'GET').then(res => res.json())
        )
    );

    const [dailyData, weeklyData, monthlyData, yearlyData] = responses;

    // Add brand to maintenance history and tyre history in each dataset
    [dailyData, weeklyData, monthlyData, yearlyData].forEach(dataset => {
        if (dataset.data?.maintenanceHistory) {
            dataset.data.maintenanceHistory.forEach(maintenance => {
                maintenance.brand = brandMap.get(maintenance.regNo.toString()) || 'Unknown';
            });
        }

        if (dataset.data?.tyreHistory) {
            dataset.data.tyreHistory.forEach(tyre => {
                tyre.brand = brandMap.get(tyre.equipmentNo.toString()) || 'Unknown';
            });
        }
    });

    const realTimeData = await generateRealTimeAnalytics({
        daily: dailyData.data,
        weekly: weeklyData.data,
        monthly: monthlyData.data,
        yearly: yearlyData.data
    });

    return {
        daily: dailyData.data,
        weekly: weeklyData.data,
        monthly: monthlyData.data,
        yearly: yearlyData.data,
        realTime: realTimeData
    };
};

// Generate real-time analytics
export const generateRealTimeAnalytics = async (data) => {
    const analytics = {
        totalServices: 0,
        activeServices: 0,
        pendingMaintenance: 0,
        criticalAlerts: 0,
        stockItems: 0,
        toolkitItems: 0,
        efficiency: 0,
        totalEquipment: 0,
        activeEquipment: 0,
        idleEquipment: 0,
        pendingApplications: 0,
        trends: [],
        stockHealth: [],
        toolkitStatus: [],
        performanceMetrics: []
    };

    const complaintRes = await apiRequest(`${END_POINT}/complaints/get-all-complaints`);
    const equipmentRes = await apiRequest(`${END_POINT}/equipments/get-equipments`, 'GET');
    const applicationRes = await apiRequest(`${END_POINT}/applications/get-all-requests`);
    const stockRes = await apiRequest(`${END_POINT}/stocks/get-all-stocks`);

    const complaints = await complaintRes.json();
    const equipData = await equipmentRes.json();
    const application = await applicationRes.json();
    const allStocks = await stockRes.json();

    const allEquipments = equipData.data
    const allApplication = application.data
    const stocks = allStocks.data


    // Filter to get only pending complaints
    const pendingComplaints = complaints.filter(complaint => complaint.status === 'pending');
    analytics.pendingComplaints = pendingComplaints
    analytics.pendingMaintenance = pendingComplaints.length || 0;

    // Filter to get only pending complaints
    const pendingApplications = allApplication.filter(application => application.status === 'pending');
    analytics.pendingApplications = pendingApplications.length || 0;

    // Filter to get all equipments
    analytics.totalEquipment = allEquipments.length || 0;

    // Filter to get only active equipments
    const activeEquipment = allEquipments.filter(equipment => equipment.status === 'active');
    analytics.activeEquipment = activeEquipment.length || 0;

    // Filter to get only active equipments
    const idleEquipment = allEquipments.filter(equipment => equipment.status === 'idle');
    analytics.idleEquipment = idleEquipment.length || 0;

    // Filter to get only low_stock equipments
    const lowStocks = stocks.filter(stock => stock.status === 'low_stock');

    // Calculate metrics from all periods
    Object.values(data).forEach(periodData => {
        if (periodData) {
            analytics.totalServices += periodData.serviceHistory?.length || 0;
            analytics.stockItems += periodData.stocks?.length || 0;
            analytics.toolkitItems += periodData.toolkit?.length || 0;
        }
    });

    // Generate trends data
    analytics.trends = [
        {
            period: 'Daily',
            services: data.daily?.serviceReports?.length || 0,
            maintenance: data.daily?.maintenanceHistory?.length || 0,
            battery: data.daily?.batteryHistory?.length || 0,
            tyre: data.daily?.tyreHistory?.length || 0,
            stocks: data.daily?.stocks?.length || 0,
            toolkit: data.daily?.toolkit?.length || 0,
            complaints: data.daily?.complaints?.length || 0
        },
        {
            period: 'Weekly',
            services: data.weekly?.serviceReports?.length || 0,
            maintenance: data.weekly?.maintenanceHistory?.length || 0,
            battery: data.weekly?.batteryHistory?.length || 0,
            tyre: data.weekly?.tyreHistory?.length || 0,
            stocks: data.weekly?.stocks?.length || 0,
            toolkit: data.weekly?.toolkit?.length || 0,
            complaints: data.weekly?.complaints?.length || 0
        },
        {
            period: 'Monthly',
            services: data.monthly?.serviceReports?.length || 0,
            maintenance: data.monthly?.maintenanceHistory?.length || 0,
            battery: data.monthly?.batteryHistory?.length || 0,
            tyre: data.monthly?.tyreHistory?.length || 0,
            stocks: data.monthly?.stocks?.length || 0,
            toolkit: data.monthly?.toolkit?.length || 0,
            complaints: data.monthly?.complaints?.length || 0
        },
        {
            period: 'Yearly',
            services: data.yearly?.serviceReports?.length || 0,
            maintenance: data.yearly?.maintenanceHistory?.length || 0,
            battery: data.yearly?.batteryHistory?.length || 0,
            tyre: data.yearly?.tyreHistory?.length || 0,
            stocks: data.yearly?.stocks?.length || 0,
            toolkit: data.yearly?.toolkit?.length || 0,
            complaints: data.yearly?.complaints?.length || 0
        }
    ];

    // Generate stock health data
    if (data.daily?.stocks) {
        analytics.stockHealth = data.daily.stocks.slice(0, 10).map(stock => ({
            name: stock.product || 'Unknown Stock',
            serialNumber: stock.serialNumber || 'Unknown Stock',
            health: stock.stockCount > stock.minThreshold ? 85 : stock.stockCount > 0 ? 45 : 15,
            status: stock.status || 'unknown',
            currentStock: stock.stockCount || 0,
            minThreshold: stock.minThreshold || 0
        }));
    }

    // Generate toolkit status data
    if (data.daily?.toolkit) {
        analytics.toolkitStatus = data.daily.toolkit.slice(0, 10).map(toolkit => ({
            name: toolkit.name || 'Unknown Toolkit',
            totalStock: toolkit.totalStock || 0,
            status: toolkit.overallStatus || 'unknown',
            variants: toolkit.variants?.length || 0
        }));
    }

    // Calculate efficiency
    const totalOperations = analytics.totalServices + analytics.stockItems + analytics.toolkitItems;
    analytics.efficiency = totalOperations > 0 ? Math.round(((totalOperations - analytics.pendingMaintenance) / totalOperations) * 100) : 95;
    analytics.activeServices = Math.round(analytics.totalServices * 0.85);
    analytics.criticalAlerts = Math.round(analytics.pendingMaintenance * 0.3);

    // Stock metrics
    analytics.stockMetrics = {
        totalStockItems: stocks.length,
        lowStockAlerts: lowStocks.length,
        totalStockValue: data.daily?.stocks?.reduce((total, stock) =>
            total + (stock.totalValue || 0), 0
        ) || 0
    };

    // Toolkit metrics
    analytics.toolkitMetrics = {
        totalToolkitItems: analytics.toolkitItems,
        lowToolkitAlerts: data.daily?.toolkit?.filter(toolkit =>
            toolkit.overallStatus === 'low' || toolkit.overallStatus === 'out'
        ).length || 0,
        totalVariants: data.daily?.toolkit?.reduce((total, toolkit) =>
            total + (toolkit.variants?.length || 0), 0
        ) || 0
    };

    // Add performance metrics that include pending maintenance for better visibility
    analytics.performanceMetrics = [
        {
            name: 'Total Services',
            value: analytics.totalServices,
            color: COLORS.primary
        },
        {
            name: 'Active Services',
            value: analytics.activeServices,
            color: COLORS.success
        },
        {
            name: 'Pending Maintenance',
            value: analytics.pendingMaintenance,
            color: COLORS.warning
        },
        {
            name: 'Critical Alerts',
            value: analytics.criticalAlerts,
            color: COLORS.danger
        },
        {
            name: 'Stock Items',
            value: analytics.stockItems,
            color: COLORS.info
        },
        {
            name: 'Toolkit Items',
            value: analytics.toolkitItems,
            color: COLORS.secondary
        }
    ];

    return analytics;
};

// Get comprehensive statistics
export const getComprehensiveStats = (data) => {
    if (!data) return { total: 0, collections: {}, trends: {} };

    const collections = {
        'Service History': data.serviceHistory?.length || 0,
        'Service Reports': data.serviceReports?.length || 0,
        'Maintenance History': data.maintenanceHistory?.length || 0,
        'Tyre History': data.tyreHistory?.length || 0,
        'Battery History': data.batteryHistory?.length || 0,
        'Stock Items': data.stocks?.length || 0,
        'Toolkit Items': data.toolkit?.length || 0,
        'Equipment': data.equipment?.length || 0,
        'Compliants': data.complaints?.length || 0,
    };

    const total = Object.values(collections).reduce((sum, count) => sum + count, 0);

    return {
        total,
        collections,
        trends: {
            maintenance: collections['Maintenance History'],
            services: collections['Service History'],
            stocks: collections['Stock Items'],
            toolkit: collections['Toolkit Items'],
            equipment: collections['Equipment'],
            complaints: collections['Compliants'],
        }
    };
};

// Prepare detailed analytics data
export const prepareAnalyticsData = (data) => {
    if (!data) return [];

    const categories = [
        { key: 'maintenanceHistory', label: 'Maintenance', icon: 'tool', color: COLORS.infoLight },
        { key: 'serviceReports', label: 'Service Reports', icon: 'clipboard', color: COLORS.accent },
        { key: 'tyreHistory', label: 'Tyre Changes', icon: 'circle', color: COLORS.info },
        { key: 'batteryHistory', label: 'Battery Changes', icon: 'battery', color: COLORS.success },
        { key: 'stocks', label: 'Stock Items', icon: 'package', color: COLORS.warning },
        { key: 'toolkit', label: 'Toolkit Items', icon: 'hard-hat', color: COLORS.danger },
        { key: 'complaints', label: 'Compliants', icon: 'hard-hat', color: COLORS.infoDark }
    ];

    return categories.map(category => ({
        name: category.label,
        value: data[category.key]?.length || 0,
        color: category.color,
        icon: category.icon
    })).filter(item => item.value > 0);
};

// Prepare stock performance data
export const prepareStockPerformance = (data) => {
    if (!data?.stocks) return [];

    return data.stocks.slice(0, 15).map(stock => ({
        name: stock.product || 'Unknown',
        currentStock: stock.stockCount || 0,
        minThreshold: stock.minThreshold || 0,
        utilization: stock.stockCount > 0 ? Math.min((stock.stockCount / (stock.maxThreshold || stock.minThreshold * 2)) * 100, 100) : 0,
        value: stock.totalValue || 0
    }));
};

// Prepare toolkit performance data
export const prepareToolkitPerformance = (data) => {
    if (!data?.toolkit) return [];

    return data.toolkit.slice(0, 15).map(toolkit => ({
        name: toolkit.name || 'Unknown',
        totalStock: toolkit.totalStock || 0,
        variants: toolkit.variants?.length || 0,
        availability: toolkit.overallStatus === 'available' ? 100 :
            toolkit.overallStatus === 'low' ? 50 : 10
    }));
};

// Prepare bar chart data
export const prepareBarChartData = (data) => {
    if (!data) return [];

    const collections = [
        { key: 'serviceHistory', label: 'Service History' },
        { key: 'serviceReports', label: 'Service Reports' },
        { key: 'maintenanceHistory', label: 'Maintenance' },
        { key: 'tyreHistory', label: 'Tyre History' },
        { key: 'batteryHistory', label: 'Battery History' },
        { key: 'stocks', label: 'Stock Items' },
        { key: 'toolkit', label: 'Toolkit Items' },
        { key: 'complaints', label: 'Complaints' },
    ];

    return collections.map(collection => ({
        name: collection.label,
        count: data[collection.key]?.length || 0
    })).filter(item => item.count > 0);
};


// Get activity content
export const getActivityContent = (update) => {
    const contentMap = {
        'tyre-history': `Tyre Replacement: ${update.tyreModel} (${update.tyreNumber}) - ${update.equipment} #${update.equipmentNo}`,
        'battery-history': `Battery Replacement: ${update.batteryModel} - ${update.equipment} #${update.equipmentNo}`,
        'service-history': `Service Completed: Reg #${update.regNo} at ${update.serviceHrs} hours`,
        'maintanance-history': `Maintenance: Reg #${update.regNo} - ${update.workRemarks?.substring(0, 60)}...`,
        'service-report': `<strong style="font-size: 1.2rem; font-weight: bold; color: #91b7ff">${update.machine} - ${update.regNo}</strong><br/>${update.remarks?.replace(/\\n/g, '<br/>')}`,
        'stocks': `Stock Update: ${update.product} - Current: ${update.stockCount} units (${update.status})`,
        'toolkit': `Toolkit Update: ${update.name} - Status: ${update.overallStatus} (${update.totalStock} total items)`
    };

    return contentMap[update.content] || `System Update: ${update.content}`;
};

export const fetchBrand = async (regNo) => {
    const response = await apiRequest(`${END_POINT}/equipments/get-equipments`);
    const data = await response.json();

    // Find the equipment that matches the regNo
    const equipment = data.find(item => item.equipmentNo === regNo);

    // Return the brand if found, otherwise return a fallback value
    return equipment ? equipment.brand : 'N/A';
}


/**
 * Fetch last 5 days comparison data
 */
export const fetchLast5DaysComparison = async () => {
    try {
        const response = await apiRequest(`${END_POINT}/dashboard/get-last-5-days-comparison`);
        if (!response.ok) {
            throw new Error('Failed to fetch last 5 days comparison');
        }
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error fetching last 5 days comparison:', error);
        throw error;
    }
};

/**
 * Fetch last 5 months comparison data
 */
export const fetchLast5MonthsComparison = async () => {
    try {
        const response = await apiRequest(`${END_POINT}/dashboard/get-last-5-months-comparison`);
        if (!response.ok) {
            throw new Error('Failed to fetch last 5 months comparison');
        }
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error fetching last 5 months comparison:', error);
        throw error;
    }
};

/**
 * Fetch last 5 years comparison data
 */
export const fetchLast5YearsComparison = async () => {
    try {
        const response = await apiRequest(`${END_POINT}/dashboard/get-last-5-years-comparison`);
        if (!response.ok) {
            throw new Error('Failed to fetch last 5 years comparison');
        }
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error fetching last 5 years comparison:', error);
        throw error;
    }
};

/**
 * Prepare comparison chart data for visualization
 */
export const prepareComparisonChartData = (comparisonData, period) => {
    if (!comparisonData || !comparisonData.comparison) {
        return [];
    }

    return comparisonData.comparison.map(item => {
        const label = period === 'last-5-days'
            ? item.date
            : period === 'last-5-months'
                ? item.month
                : item.year;

        return {
            label,
            'Service History': item.collections['service-history'] || 0,
            'Service Reports': item.collections['service-report'] || 0,
            'Maintenance': item.collections['maintanance-history'] || 0,
            'Tyre History': item.collections['tyre-history'] || 0,
            'Battery History': item.collections['battery-history'] || 0,
            'Equipment': item.collections['equipment'] || 0,
            'Stocks': item.collections['stocks'] || 0,
            'Toolkit': item.collections['toolkit'] || 0,
            'Complaints': item.collections['complaints'] || 0,
            'Total': item.total
        };
    });
};
