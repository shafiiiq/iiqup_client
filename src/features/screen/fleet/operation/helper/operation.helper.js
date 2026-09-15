export const formatDateFull = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return `${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}`;
};

export const formatTime = (timeString) => timeString || 'N/A';

export const formatDateForAPI = (date) => {
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
};

export const getActivityMeta = (item) => {
    const rentRateOf = (rentRate) => rentRate
        ? `${rentRate.basis || '—'} — ${rentRate.rate ?? '—'} ${rentRate.currency || 'QAR'}`
        : '—';

    if (item.activityType === 'mobilization') {
        const eq = item.equipmentDetails || {};
        const machine = eq.machine || item.machine;
        const regNo = eq.regNo || item.regNo;

        const previousOperators = (item.previousOperators || []).filter((op) => op.operatorName);
        const previousOperatorSummary = previousOperators.length
            ? previousOperators[0].operatorName + (previousOperators.length > 1 ? ` (+${previousOperators.length - 1} more)` : '')
            : '—';

        const rentRate = rentRateOf(item.rentRate);

        if (item.action === 'status_changed') {
            return {
                badgeLabel: 'STATUS',
                badgeType: 'status',
                machine,
                regNo,
                details: `${item.previousStatus?.toUpperCase() || '?'} → ${item.newStatus?.toUpperCase() || '?'}`,
                operatorSummary: '—',
                remarks: item.remarks || '—',
                location: item.location || '—',
                lastMobilizedDate: '',
                lastMobilizedTime: '',
                previousOperatorSummary,
                hiredLabel: item.hired ? 'Yes' : 'No',
                hiredFrom: item.hiredFrom || '—',
                rentRate,
                outgoingOperator: '—',
                incomingOperator: '—',
                replacedByLabel: '—',
                shiftInfo: '—',
                remainingShiftsSummary: '—',
                newSiteForReplaced: '—',
            };
        }

        const isDemob = item.action === 'demobilized';
        const isOneDayMob = item.isOneDayMob;
        const operators = (item.operators || []).filter((op) => op.operatorName);
        const operatorSummary = operators.length
            ? operators[0].operatorName + (operators.length > 1 ? ` (+${operators.length - 1} more)` : '')
            : (item.operator || '—');

        return {
            badgeLabel: isDemob ? 'DEMOB' : isOneDayMob ? '1-DAY MOB' : 'MOB',
            badgeType: isDemob ? 'demob' : isOneDayMob ? 'oneday' : 'mob',
            machine,
            regNo,
            details: item.deployType === 'company'
                ? `Leased to: ${item.clientCompany || '—'}`
                : `${isDemob ? 'Removed from' : 'Deployed to'}: ${item.site || '—'}`,
            operatorSummary,
            remarks: item.remarks || '—',
            location: item.location || '—',
            lastMobilizedDate: item.lastMobilizedDate || '—',
            lastMobilizedTime: item.lastMobilizedTime || '—',
            previousOperatorSummary,
            hiredLabel: item.hired ? 'Yes' : 'No',
            hiredFrom: item.hiredFrom || '—',
            rentRate,
            outgoingOperator: '—',
            incomingOperator: '—',
            replacedByLabel: '—',
            shiftInfo: '—',
            remainingShiftsSummary: '—',
            newSiteForReplaced: '—',
        };
    }

    const previousOperators = (item.previousOperators || []).filter((op) => op.operatorName);
    const previousOperatorSummary = previousOperators.length
        ? previousOperators[0].operatorName + (previousOperators.length > 1 ? ` (+${previousOperators.length - 1} more)` : '')
        : '—';

    const commonReplacementFields = {
        remarks: item.remarks || '—',
        location: item.location || '—',
        lastMobilizedDate: '—',
        lastMobilizedTime: '—',
        previousOperatorSummary,
        hiredLabel: item.hired ? 'Yes' : 'No',
        hiredFrom: item.hiredFrom || '—',
        rentRate: rentRateOf(item.rentRate),
    };

    if (item.type === 'operator') {
        const eq = item.currentEquipmentDetails || {};

        const remainingShifts = (item.remainingShifts || []).filter((s) => s.operatorName);
        const remainingShiftsSummary = remainingShifts.length
            ? remainingShifts.map((s) => `${s.operatorName}${s.shiftName ? ` (${s.shiftName})` : ''}`).join(', ')
            : '—';

        const shiftLabel = item.shiftName || item.targetShiftName || '—';
        const shiftInfo = shiftLabel === '—'
            ? '—'
            : `${shiftLabel}${item.shiftStart ? ` (${item.shiftStart}${item.shiftEnd ? ' - ' + item.shiftEnd : ''})` : ''}`;

        return {
            badgeLabel: item.replaceAll ? 'ALL OPS REPLACED' : 'OP REPLACEMENT',
            badgeType: 'oprep',
            machine: eq.machine || item.machine,
            regNo: eq.regNo || item.regNo,
            details: item.replaceAll ? `All operators replaced (${previousOperators.length})` : 'Shift replacement',
            operatorSummary: '—',
            outgoingOperator: item.replaceAll ? 'All' : (item.currentOperator || '—'),
            incomingOperator: item.replacedOperator || '—',
            replacedByLabel: '—',
            shiftInfo,
            remainingShiftsSummary,
            newSiteForReplaced: '—',
            ...commonReplacementFields,
        };
    }

    if (item.type === 'equipment') {
        const cur = item.currentEquipmentDetails || {};
        const rep = item.replacedEquipmentDetails || {};

        return {
            badgeLabel: 'EQ REPLACEMENT',
            badgeType: 'eqrep',
            machine: cur.machine || item.machine,
            regNo: cur.regNo || item.regNo,
            details: 'Equipment replacement',
            operatorSummary: '—',
            outgoingOperator: item.outgoingOperator || item.currentOperator || '—',
            incomingOperator: item.incomingOperator || '—',
            replacedByLabel: `${rep.machine || item.replacedEquipmentMachine || '—'} (${rep.regNo || item.replacedEquipmentRegNo || '—'})`,
            shiftInfo: '—',
            remainingShiftsSummary: '—',
            newSiteForReplaced: item.newSiteForReplaced || '—',
            ...commonReplacementFields,
        };
    }

    if (item.type === 'site') {
        const eq = item.currentEquipmentDetails || {};
        return {
            badgeLabel: 'SITE REPLACEMENT',
            badgeType: 'site',
            machine: eq.machine || item.machine,
            regNo: eq.regNo || item.regNo,
            details: `${item.currentSite || '—'} → ${item.replacedSite || '—'}`,
            operatorSummary: '—',
            outgoingOperator: '—',
            incomingOperator: '—',
            replacedByLabel: item.replacedSite || '—',
            shiftInfo: '—',
            remainingShiftsSummary: '—',
            newSiteForReplaced: '—',
            ...commonReplacementFields,
        };
    }

    return {
        badgeLabel: '—',
        badgeType: 'unknown',
        machine: item.machine || '—',
        regNo: item.regNo || '—',
        details: '—',
        operatorSummary: '—',
        remarks: '—',
        location: '—',
        lastMobilizedDate: '—',
        lastMobilizedTime: '—',
        previousOperatorSummary: '—',
        hiredLabel: '—',
        hiredFrom: '—',
        rentRate: '—',
        outgoingOperator: '—',
        incomingOperator: '—',
        replacedByLabel: '—',
        shiftInfo: '—',
        remainingShiftsSummary: '—',
        newSiteForReplaced: '—',
    };
};

export const getExpandRows = (item) => {
    if (item.activityType === 'mobilization') {
        if (item.action === 'demobilized') {
            const previousOperators = (item.previousOperators || []).filter((op) => op.operatorName);
            return previousOperators.length > 1 ? previousOperators.slice(1) : [];
        }
        if (item.action !== 'status_changed') {
            const operators = (item.operators || []).filter((op) => op.operatorName);
            return operators.length > 1 ? operators.slice(1) : [];
        }
        return [];
    }
    if (item.type === 'operator' && item.replaceAll) {
        return (item.previousOperators || []).filter((op) => op.operatorName);
    }
    return [];
};