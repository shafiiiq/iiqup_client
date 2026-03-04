import { END_POINT } from '../../constants';
import { COLORS } from './utils/dasboard-utils';
import { apiRequest } from '../../utils/api';

let equipmentCache = null;
let cacheTime = 0;
const EQUIPMENT_CACHE_TTL = 30000;

const tabDataCache = {
    daily: null,
    weekly: null,
    monthly: null,
    yearly: null,
    timestamps: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0
    }
};

const TAB_CACHE_TTL = 60000;

export const fetchDashboardCounts = async (period = 'daily') => {
    try {
        const response = await apiRequest(`${END_POINT}/dashboard/get-${period}-counts`, 'GET');
        const result = await response.json();
        
        return result.data;
    } catch (error) {
        console.error(`Error fetching ${period} counts:`, error);
        return null;
    }
};

export const fetchTabData = async (period = 'daily', forceRefresh = false) => {
    const now = Date.now();

    if (!forceRefresh &&
        tabDataCache[period] &&
        (now - tabDataCache.timestamps[period]) < TAB_CACHE_TTL) {
        return tabDataCache[period];
    }

    try {
        const response = await apiRequest(`${END_POINT}/dashboard/get-${period}-updates`, 'GET');
        const result = await response.json();
        tabDataCache[period] = result.data;
        tabDataCache.timestamps[period] = now;

        return result.data;
    } catch (error) {
        console.error(`Error fetching ${period} data:`, error);
        return null;
    }
};

export const fetchInitialDashboardData = async () => {
    await getEquipmentData();

    const dailyCounts = await fetchDashboardCounts('daily');
    const dailyData = await fetchTabData('daily');
    const realTimeData = await generateRealTimeAnalytics({
        daily: dailyData
    });

    return {
        daily: dailyData,
        weekly: null,  
        monthly: null, 
        yearly: null,  
        realTime: realTimeData,
        counts: {
            daily: dailyCounts,
            weekly: null,
            monthly: null,
            yearly: null
        }
    };
};

export const loadTabDataOnDemand = async (period, currentData) => {
    if (currentData[period]) {
        return currentData;
    }

    const tabData = await fetchTabData(period);
    const brandMap = await getBrandMap();
    if (tabData) {
        addBrandToData(tabData, brandMap);
    }

    return {
        ...currentData,
        [period]: tabData
    };
};

const getEquipmentData = async () => {
    const now = Date.now();

    if (!equipmentCache || (now - cacheTime) > EQUIPMENT_CACHE_TTL) {
        const equipResponse = await apiRequest(`${END_POINT}/equipments/get-equipments`);
        equipmentCache = await equipResponse.json();
        cacheTime = now;
    }

    return equipmentCache;
};

export const getBrandMap = async () => {
    const equipData = await getEquipmentData();
    const brandMap = new Map();

    equipData.data.forEach(equip => {
        brandMap.set(equip.regNo.toString(), equip.brand);
    });

    return brandMap;
};

export const addBrandToData = (dataset, brandMap) => {
    if (dataset.maintenanceHistory) {
        dataset.maintenanceHistory.forEach(maintenance => {
            maintenance.brand = brandMap.get(maintenance.regNo.toString()) || 'Unknown';
        });
    }

    if (dataset.tyreHistory) {
        dataset.tyreHistory.forEach(tyre => {
            tyre.brand = brandMap.get(tyre.equipmentNo.toString()) || 'Unknown';
        });
    }
};

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

    const [complaints, equipData, application, allStocks] = await Promise.all([
        apiRequest(`${END_POINT}/complaints/get-all-complaints`).then(res => res.json()),
        getEquipmentData(),
        apiRequest(`${END_POINT}/applications/get-all-requests`).then(res => res.json()),
        apiRequest(`${END_POINT}/stocks/get-all-stocks`).then(res => res.json())
    ]);

    const allEquipments = equipData.data;
    const allApplication = application.data;
    const stocks = allStocks.data;
    const pendingComplaints = complaints.data.filter(c => c.status === 'pending');
    analytics.pendingComplaints = pendingComplaints;
    analytics.pendingMaintenance = pendingComplaints.length || 0;
    const pendingApplications = allApplication.filter(app => app.status === 'pending');
    analytics.pendingApplications = pendingApplications.length || 0;
    analytics.totalEquipment = allEquipments.length || 0;
    analytics.activeEquipment = allEquipments.filter(eq => eq.status === 'active').length || 0;
    analytics.idleEquipment = allEquipments.filter(eq => eq.status === 'idle').length || 0;
    const lowStocks = stocks.filter(stock => stock.status === 'low_stock');

    Object.values(data).forEach(periodData => {
        if (periodData) {
            analytics.totalServices += periodData.serviceHistory?.length || 0;
            analytics.stockItems += periodData.stocks?.length || 0;
            analytics.toolkitItems += periodData.toolkit?.length || 0;
        }
    });

    analytics.trends = generateTrendsData(data);

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

    if (data.daily?.toolkit) {
        analytics.toolkitStatus = data.daily.toolkit.slice(0, 10).map(toolkit => ({
            name: toolkit.name || 'Unknown Toolkit',
            totalStock: toolkit.totalStock || 0,
            status: toolkit.overallStatus || 'unknown',
            variants: toolkit.variants?.length || 0
        }));
    }

    const totalOperations = analytics.totalServices + analytics.stockItems + analytics.toolkitItems;
    analytics.efficiency = totalOperations > 0
        ? Math.round(((totalOperations - analytics.pendingMaintenance) / totalOperations) * 100)
        : 95;
    analytics.activeServices = Math.round(analytics.totalServices * 0.85);
    analytics.criticalAlerts = Math.round(analytics.pendingMaintenance * 0.3);

    analytics.stockMetrics = {
        totalStockItems: stocks.length,
        lowStockAlerts: lowStocks.length,
        totalStockValue: data.daily?.stocks?.reduce((total, stock) =>
            total + (stock.totalValue || 0), 0
        ) || 0
    };

    analytics.toolkitMetrics = {
        totalToolkitItems: analytics.toolkitItems,
        lowToolkitAlerts: data.daily?.toolkit?.filter(toolkit =>
            toolkit.overallStatus === 'low' || toolkit.overallStatus === 'out'
        ).length || 0,
        totalVariants: data.daily?.toolkit?.reduce((total, toolkit) =>
            total + (toolkit.variants?.length || 0), 0
        ) || 0
    };

    analytics.performanceMetrics = [
        { name: 'Total Services', value: analytics.totalServices, color: COLORS.primary },
        { name: 'Active Services', value: analytics.activeServices, color: COLORS.success },
        { name: 'Pending Maintenance', value: analytics.pendingMaintenance, color: COLORS.warning },
        { name: 'Critical Alerts', value: analytics.criticalAlerts, color: COLORS.danger },
        { name: 'Stock Items', value: analytics.stockItems, color: COLORS.info },
        { name: 'Toolkit Items', value: analytics.toolkitItems, color: COLORS.secondary }
    ];

    return analytics;
};

const generateTrendsData = (data) => {
    const periods = ['daily', 'weekly', 'monthly', 'yearly'];
    const labels = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

    return periods.map((period, index) => ({
        period: labels[index],
        services: data[period]?.serviceReports?.length || 0,
        maintenance: data[period]?.maintenanceHistory?.length || 0,
        battery: data[period]?.batteryHistory?.length || 0,
        tyre: data[period]?.tyreHistory?.length || 0,
        stocks: data[period]?.stocks?.length || 0,
        toolkit: data[period]?.toolkit?.length || 0,
        complaints: data[period]?.complaints?.length || 0
    }));
};

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

export const prepareStockPerformance = (data) => {
    if (!data?.stocks) return [];

    return data.stocks.slice(0, 15).map(stock => ({
        name: stock.product || 'Unknown',
        currentStock: stock.stockCount || 0,
        minThreshold: stock.minThreshold || 0,
        utilization: stock.stockCount > 0
            ? Math.min((stock.stockCount / (stock.maxThreshold || stock.minThreshold * 2)) * 100, 100)
            : 0,
        value: stock.totalValue || 0
    }));
};

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

export const getActivityContent = (update) => {
    const contentMap = {
        'tyre-history': `Tyre Replacement: ${update.tyreModel} (${update.tyreNumber}) - ${update.equipment} #${update.equipmentNo}`,
        'battery-history': `Battery Replacement: ${update.batteryModel} - ${update.equipment} #${update.equipmentNo}`,
        'service-history': `Service Completed: Reg #${update.regNo} at ${update.serviceHrs} hours`,
        'maintenance-history': `Maintenance: Reg #${update.regNo} - ${update.workRemarks?.substring(0, 60)}...`,
        'service-report': `<strong style="font-size: 1.2rem; font-weight: bold; color: #91b7ff">${update.machine} - ${update.regNo}</strong><br/>${update.remarks?.replace(/\\n/g, '<br/>')}`,
        'stocks': `Stock Update: ${update.product} - Current: ${update.stockCount} units (${update.status})`,
        'toolkit': `Toolkit Update: ${update.name} - Status: ${update.overallStatus} (${update.totalStock} total items)`
    };

    return contentMap[update.content] || `System Update: ${update.content}`;
};

const comparisonCache = {
    last5Days: null,
    last5Months: null,
    last5Years: null,
    timestamps: {
        last5Days: 0,
        last5Months: 0,
        last5Years: 0
    }
};

const COMPARISON_CACHE_TTL = 300000;

export const fetchLast5DaysComparison = async () => {
    const now = Date.now();

    if (comparisonCache.last5Days && (now - comparisonCache.timestamps.last5Days) < COMPARISON_CACHE_TTL) {
        return comparisonCache.last5Days;
    }

    try {
        const response = await apiRequest(`${END_POINT}/dashboard/get-last-5-days-comparison`);
        if (!response.ok) throw new Error('Failed to fetch last 5 days comparison');

        const result = await response.json();
        comparisonCache.last5Days = result.data;
        comparisonCache.timestamps.last5Days = now;

        return result.data;
    } catch (error) {
        console.error('Error fetching last 5 days comparison:', error);
        throw error;
    }
};

export const fetchLast5MonthsComparison = async () => {
    const now = Date.now();

    if (comparisonCache.last5Months && (now - comparisonCache.timestamps.last5Months) < COMPARISON_CACHE_TTL) {
        return comparisonCache.last5Months;
    }

    try {
        const response = await apiRequest(`${END_POINT}/dashboard/get-last-5-months-comparison`);
        if (!response.ok) throw new Error('Failed to fetch last 5 months comparison');

        const result = await response.json();
        comparisonCache.last5Months = result.data;
        comparisonCache.timestamps.last5Months = now;

        return result.data;
    } catch (error) {
        console.error('Error fetching last 5 months comparison:', error);
        throw error;
    }
};

export const fetchLast5YearsComparison = async () => {
    const now = Date.now();

    if (comparisonCache.last5Years && (now - comparisonCache.timestamps.last5Years) < COMPARISON_CACHE_TTL) {
        return comparisonCache.last5Years;
    }

    try {
        const response = await apiRequest(`${END_POINT}/dashboard/get-last-5-years-comparison`);
        if (!response.ok) throw new Error('Failed to fetch last 5 years comparison');

        const result = await response.json();
        comparisonCache.last5Years = result.data;
        comparisonCache.timestamps.last5Years = now;

        return result.data;
    } catch (error) {
        console.error('Error fetching last 5 years comparison:', error);
        throw error;
    }
};

export const prepareComparisonChartData = (comparisonData, period) => {
    if (!comparisonData || !comparisonData.comparison) return [];

    return comparisonData.comparison.map(item => {
        const label = period === 'last-5-days' ? item.date
            : period === 'last-5-months' ? item.month
                : item.year;

        return {
            label,
            'Service History': item.collections['service-history'] || 0,
            'Service Reports': item.collections['service-report'] || 0,
            'Maintenance': item.collections['maintenance-history'] || 0,
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

export const fetchInitialTabData = async (period = 'daily') => {
    await getEquipmentData();

    const tabData = await fetchTabData(period);
    const brandMap = await getBrandMap();
    if (tabData) {
        addBrandToData(tabData, brandMap);
    }
    const realTimeData = await generateRealTimeAnalytics({
        [period]: tabData
    });

    return {
        daily: period === 'daily' ? tabData : null,
        weekly: period === 'weekly' ? tabData : null,
        monthly: period === 'monthly' ? tabData : null,
        yearly: period === 'yearly' ? tabData : null,
        realTime: realTimeData,
        counts: {
            [period]: await fetchDashboardCounts(period)
        }
    };
};

export const clearAllCaches = () => {
    equipmentCache = null;
    cacheTime = 0;

    Object.keys(tabDataCache).forEach(key => {
        if (key !== 'timestamps') {
            tabDataCache[key] = null;
        }
    });

    Object.keys(tabDataCache.timestamps).forEach(key => {
        tabDataCache.timestamps[key] = 0;
    });

    Object.keys(comparisonCache).forEach(key => {
        if (key !== 'timestamps') {
            comparisonCache[key] = null;
        }
    });

    Object.keys(comparisonCache.timestamps).forEach(key => {
        comparisonCache.timestamps[key] = 0;
    });
};
