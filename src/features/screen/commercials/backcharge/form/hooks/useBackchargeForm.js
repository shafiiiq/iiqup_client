import { useEffect, useState } from 'react';
import logoImage from '@assets/images/al-ansari-color.png';
import alAnsariText from '@assets/images/al-ansari-text.png';
import { useHeaderTitle } from '@/shared/context/TitleContext';
import { fetchBackchargeReports, checkLatestBackchargeRef, addBackcharge } from '../api/backcharge.form.api';
import { getTodayDateInput, generateBackchargeRef } from '../helper/backcharge.form.helper';

const useBackchargeForm = () => {
    const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [equipmentSuggestions, setEquipmentSuggestions] = useState([]);
    const [supplierSuggestions, setSupplierSuggestions] = useState([]);
    const [siteSuggestions, setSiteSuggestions] = useState([]);
    const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [showSiteDropdown, setShowSiteDropdown] = useState(false);
    const [allBackchargeData, setAllBackchargeData] = useState([]);
    const [isGeneratingRef, setIsGeneratingRef] = useState(false);
    const [ceoMode, setCeoMode] = useState('CEO');
    const toggleCeoMode = () => setCeoMode(prev => prev === 'CEO' ? 'MANAGING DIRECTOR' : 'CEO');
    const getSignatoryName = () => ceoMode === 'CEO' ? 'Ahammed Kamal' : 'Mohammed Shaheen';

    const [formData, setFormData] = useState({
        refNo: '',
        equipmentType: '',
        plateNo: '',
        model: '',
        supplierName: '',
        contactPerson: '',
        siteLocation: '',
        date: getTodayDateInput(),
        workDate: getTodayDateInput(),
        scopeOfWork: '',
        scopeLine2Text: '',
        workshopComments: '',
        workSummaryLine2: '',
        workSummaryLine3: '',
        workSummaryLine4: '',
        sparePartsCost: '',
        labourCharges: '',
        totalCost: '',
        approvedDeduction: '',
        tableRows: Array(3).fill().map(() => ({
            description: '',
            qty: '',
            cost: '',
            total: ''
        }))
    });

    useEffect(() => {
        if (formData.refNo) {
            const title = `Ref No: ${formData.refNo}`
            const subtitle = `Backcharge For: ${formData.supplierName}`;
            setHeaderTitle(title);
            setHeaderSubtitle(subtitle);
        } else {
            setHeaderTitle(null);
            setHeaderSubtitle(null);
        }

        return () => {
            setHeaderTitle(null);
            setHeaderSubtitle(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.refNo, formData.supplierName]);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const data = await fetchBackchargeReports();
                if (data.success && data.data) {
                    setAllBackchargeData(data.data);
                }

                const refNumber = await generateRefNumber();
                setFormData(prev => ({
                    ...prev,
                    refNo: refNumber,
                    date: prev.date || getTodayDateInput(),
                    workDate: prev.workDate || getTodayDateInput(),
                }));
            } catch (error) {
                console.error('Error loading initial data:', error);
            } finally {
                return;
            }
        };

        loadInitialData();
    }, []);

    useEffect(() => {
        const loadImages = async () => {
            try {
                const logoPromise = new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = logoImage;
                });

                const textPromise = new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = alAnsariText;
                });

                await Promise.all([logoPromise, textPromise]);
            } catch (error) {
                console.error('Error loading images:', error);
            }
        };

        loadImages();
    }, []);

    const generateRefNumber = async () => {
        setIsGeneratingRef(true);
        try {
            const data = await checkLatestBackchargeRef();
            const latestNumber = data.success && data.data ? (data.data.latestNumber || 140) : 140;
            return generateBackchargeRef(latestNumber + 1);
        } catch (error) {
            console.error('Error generating ref number:', error);
            return generateBackchargeRef(141);
        } finally {
            setIsGeneratingRef(false);
        }
    };

    const searchEquipmentByPlate = (plateNo) => {
        if (!plateNo || plateNo.length < 1) {
            setShowEquipmentDropdown(false);
            return;
        }

        const filteredEquipment = allBackchargeData
            .filter(item => item.plateNo && item.plateNo.toLowerCase().includes(plateNo.toLowerCase()))
            .reduce((acc, current) => {
                const existing = acc.find(item => item.plateNo.toLowerCase() === current.plateNo.toLowerCase());
                if (!existing) {
                    acc.push({
                        plateNo: current.plateNo,
                        equipmentType: current.equipmentType,
                        model: current.model,
                        supplierName: current.supplierName,
                        contactPerson: current.contactPerson
                    });
                }
                return acc;
            }, [])
            .slice(0, 10);

        if (filteredEquipment.length > 0) {
            setEquipmentSuggestions(filteredEquipment);
            setShowEquipmentDropdown(true);
        } else {
            setShowEquipmentDropdown(false);
        }
    };

    const searchSuppliers = (supplierName) => {
        if (!supplierName || supplierName.length < 1) {
            setShowSupplierDropdown(false);
            return;
        }

        const filteredSuppliers = allBackchargeData
            .filter(item => item.supplierName && item.supplierName.toLowerCase().includes(supplierName.toLowerCase()))
            .reduce((acc, current) => {
                const existing = acc.find(item => item.name.toLowerCase() === current.supplierName.toLowerCase());
                if (!existing) {
                    acc.push({
                        name: current.supplierName,
                        contactPerson: current.contactPerson
                    });
                }
                return acc;
            }, [])
            .slice(0, 10);

        if (filteredSuppliers.length > 0) {
            setSupplierSuggestions(filteredSuppliers);
            setShowSupplierDropdown(true);
        } else {
            setShowSupplierDropdown(false);
        }
    };

    const searchSites = (siteLocation) => {
        if (!siteLocation || siteLocation.length < 1) {
            setShowSiteDropdown(false);
            return;
        }

        const filteredSites = allBackchargeData
            .filter(item => item.siteLocation && item.siteLocation.toLowerCase().includes(siteLocation.toLowerCase()))
            .reduce((acc, current) => {
                const existing = acc.find(item => item.location.toLowerCase() === current.siteLocation.toLowerCase());
                if (!existing) {
                    acc.push({
                        location: current.siteLocation
                    });
                }
                return acc;
            }, [])
            .slice(0, 10);

        if (filteredSites.length > 0) {
            setSiteSuggestions(filteredSites);
            setShowSiteDropdown(true);
        } else {
            setShowSiteDropdown(false);
        }
    };

    const handleEquipmentSelect = (equipment) => {
        setFormData(prev => ({
            ...prev,
            plateNo: equipment.plateNo,
            equipmentType: equipment.equipmentType,
            model: equipment.model,
            supplierName: equipment.supplierName,
            contactPerson: equipment.contactPerson
        }));
        setShowEquipmentDropdown(false);
        setEquipmentSuggestions([]);
    };

    const handleSupplierSelect = (supplier) => {
        setFormData(prev => ({
            ...prev,
            supplierName: supplier.name,
            contactPerson: supplier.contactPerson
        }));
        setShowSupplierDropdown(false);
        setSupplierSuggestions([]);
    };

    const handleSiteSelect = (site) => {
        setFormData(prev => ({
            ...prev,
            siteLocation: site.location
        }));
        setShowSiteDropdown(false);
        setSiteSuggestions([]);
    };

    const handleInputChangeWithSearch = (field, value) => {
        handleInputChange(field, value);

        if (field === 'plateNo') {
            clearTimeout(window.plateNoTimeout);
            window.plateNoTimeout = setTimeout(() => searchEquipmentByPlate(value), 300);
        } else if (field === 'supplierName') {
            clearTimeout(window.supplierTimeout);
            window.supplierTimeout = setTimeout(() => searchSuppliers(value), 300);
        } else if (field === 'siteLocation') {
            clearTimeout(window.siteTimeout);
            window.siteTimeout = setTimeout(() => searchSites(value), 300);
        }

        if (!value) {
            if (field === 'plateNo') setShowEquipmentDropdown(false);
            if (field === 'supplierName') setShowSupplierDropdown(false);
            if (field === 'siteLocation') setShowSiteDropdown(false);
        }
    };

    const saveBackchargeData = async () => {
        setIsLoading(true);
        setSaveStatus('');

        try {
            const backchargeData = {
                refNo: formData.refNo,
                equipmentType: formData.equipmentType,
                plateNo: formData.plateNo,
                model: formData.model,
                supplierName: formData.supplierName,
                contactPerson: formData.contactPerson,
                siteLocation: formData.siteLocation,
                date: formData.date,
                workDate: formData.workDate,
                scopeOfWork: formData.scopeOfWork,
                scopeLine2Text: '',
                workshopComments: formData.workshopComments,
                workSummaryLine2: formData.workSummaryLine2,
                workSummaryLine3: formData.workSummaryLine3,
                workSummaryLine4: formData.workSummaryLine4,
                sparePartsCost: formData.sparePartsCost,
                labourCharges: formData.labourCharges,
                totalCost: formData.totalCost,
                approvedDeduction: formData.approvedDeduction,
                authorizedSignatoryMode: ceoMode,
                authorizedSignatoryName: getSignatoryName(),
                tableRows: formData.tableRows.filter(row =>
                    row.description || row.qty || row.cost || row.total
                )
            };

            const response = await addBackcharge(backchargeData);

            if (response.ok) {
                setSaveStatus('success');
                setTimeout(() => setSaveStatus(''), 3000);
            } else {
                setSaveStatus('error');
                console.error('Failed to save backcharge data:', response.message);
            }

        } catch (error) {
            setSaveStatus('error');
            console.error('Error saving backcharge data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleScopeOverflow = (value) => {
        setFormData(prev => ({
            ...prev,
            scopeOfWork: value,
            scopeLine2Text: ''
        }));
    };

    const handleWorkSummaryOverflow = (value) => {
        setFormData(prev => ({
            ...prev,
            workshopComments: value,
            workSummaryLine2: '',
            workSummaryLine3: '',
            workSummaryLine4: ''
        }));
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleTableChange = (index, field, value) => {
        setFormData(prev => {
            const newTableRows = prev.tableRows.map((row, i) => {
                if (i === index) {
                    const updatedRow = { ...row, [field]: value };
                    if (field === 'qty' || field === 'cost') {
                        const qty = parseFloat(field === 'qty' ? value : row.qty) || 0;
                        const cost = parseFloat(field === 'cost' ? value : row.cost) || 0;
                        updatedRow.total = (qty * cost).toFixed(2);
                    }

                    return updatedRow;
                }
                return row;
            });

            const grandTotal = newTableRows.reduce((sum, row) => {
                return sum + (parseFloat(row.total) || 0);
            }, 0);

            const labourCharges = parseFloat(prev.labourCharges) || 0;
            const totalCost = grandTotal + labourCharges;

            return {
                ...prev,
                tableRows: newTableRows,
                sparePartsCost: grandTotal.toFixed(2),
                totalCost: totalCost.toFixed(2)
            };
        });
    };

    const handleLabourChargeChange = (value) => {
        setFormData(prev => {
            const labourCharges = parseFloat(value) || 0;
            const sparePartsCost = parseFloat(prev.sparePartsCost) || 0;
            const totalCost = sparePartsCost + labourCharges;

            return {
                ...prev,
                labourCharges: value,
                totalCost: totalCost.toFixed(2)
            };
        });
    };

    const grandPartsTotal = formData.tableRows.reduce((sum, row) => sum + (parseFloat(row.total) || 0), 0).toFixed(2);

    return {
        isLoading,
        saveStatus,
        equipmentSuggestions,
        supplierSuggestions,
        siteSuggestions,
        showEquipmentDropdown,
        showSupplierDropdown,
        showSiteDropdown,
        isGeneratingRef,
        ceoMode,
        toggleCeoMode,
        getSignatoryName,
        formData,
        saveBackchargeData,
        handleScopeOverflow,
        handleWorkSummaryOverflow,
        handleInputChange,
        handleInputChangeWithSearch,
        handleTableChange,
        handleLabourChargeChange,
        handleEquipmentSelect,
        handleSupplierSelect,
        handleSiteSelect,
        grandPartsTotal
    };
};

export default useBackchargeForm;