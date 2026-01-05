import { useState, useRef, useEffect } from 'react';
import './EquipBypass.css';
import { useNavigate } from 'react-router-dom';
import { END_POINT } from '../../../constants';
import { apiRequest } from '../../../utils/0auth';
import { useSearch } from '../../../context/SearchContext';
import Button from '../../../common/Button/Button';

function EquipBypass({ equipStocks, documents, isLPO }) {
    const { searchTerm, setSearchTerm } = useSearch();
    const [equipments, setEquipments] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [pendingLpos, setPendingLpos] = useState([]);
    const [showPendingAlert, setShowPendingAlert] = useState(false);

    const navigate = useNavigate();
    const tableRef = useRef(null);

    // Get current date and time
    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();

            // Format date as DD-MM-YY
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = String(now.getFullYear()).slice(-2);
            const dateString = `${day}-${month}-${year}`;

            // Format time in AM/PM
            let hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            const timeString = `${hours}:${minutes} ${ampm}`;

            setCurrentDateTime(`${dateString}   |   ${timeString}`);
        };

        updateDateTime();
        const interval = setInterval(updateDateTime, 60000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchEquipments();
        if (isLPO) {
            fetchPendingLpos();
        }
    }, [isLPO]);


    const fetchEquipments = async () => {
        try {
            const response = await apiRequest(`${END_POINT}/equipments/get-equipments`, 'GET');
            const data = await response.json();
            setEquipments(data.data);
            setFilteredData(data.data);
        } catch (error) {
            console.error('Error fetching equipment records:', error);
        }
    };

    const fetchPendingLpos = async () => {
        try {
            const response = await apiRequest(`${END_POINT}/complaints/get-all-complaints`, 'GET');
            const data = await response.json();

            // Filter complaints where workflowStatus is "sent_to_workshop"
            const pendingItems = data.filter(item => item.workflowStatus === "sent_to_workshop");

            setPendingLpos(pendingItems);
            console.log(pendingItems);

            setShowPendingAlert(pendingItems.length > 0);
        } catch (error) {
            console.error('Error fetching pending LPOs:', error);
            setPendingLpos([]);
            setShowPendingAlert(false);
        }
    };

    useEffect(() => {
        if (equipments && equipments.length > 0) {
            const results = equipments.filter(item => {
                return Object.values(item).some(value =>
                    String(value).toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
            setFilteredData(results);
        }
    }, [searchTerm, equipments]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();

        if (!searchTerm.trim()) return;

        const foundEquipment = equipments.find(item =>
            item.regNo.toLowerCase() === searchTerm.toLowerCase()
        );

    };

    const handleRowClick = (regNo) => {
        if (equipStocks) {
            navigate(`/stocks/equipment-stocks/images/${regNo}`)
        } else if (documents) {
            navigate(`/documents/${regNo}`)
        } else if (isLPO) {
            navigate(`/lpo-list/${regNo}`)
        }
    };

    const handleLpo = (type) => {
        if (type == 'for-stock') {
            navigate(`/lpo-form/for-stock`);
        } else if (type == 'for-all-equipments') {
            navigate(`/lpo-form/for-all-equipments`);
        } else if (type == 'view-for-all-equipments') {
            navigate(`/lpo-list/of-all-equipments`);
        } else if (type == 'view-for-stock') {
            navigate(`/lpo-list/of-stocks`);
        } else if (type == 'view-all-lpo') {
            navigate(`/lpo-list/all-list`);
        }
    };

    const handleCreateLpoFromComplaint = (lpoItem) => {
        navigate(`/lpo-form/${lpoItem.regNo}/${lpoItem._id}`);
    };

    const handleClosePendingAlert = () => {
        setShowPendingAlert(false);
    };

    return (
        <div className="equipment-container">
            {/* Pending LPO Alert - Show only when isLPO is true */}
            {isLPO && showPendingAlert && pendingLpos.length > 0 && (
                <div className="pending-lpo-alert">
                    <div className="alert-header">
                        <h3 className="alert-title">⚠️ Pending LPO Requests ({pendingLpos.length})</h3>
                        <button className="alert-close-btn" onClick={handleClosePendingAlert}>
                            <span class="material-symbols-rounded">
                                close
                            </span>
                        </button>
                    </div>
                    <div className="pending-lpo-list">
                        {pendingLpos.map((lpoItem) => (
                            <div key={lpoItem._id} className="pending-lpo-item">
                                <div className="pending-lpo-info">
                                    <div className="info-row">
                                        <span className="info-label">Operator:</span>
                                        <span className="info-value">{lpoItem.name}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Equipment:</span>
                                        <span className="info-value">{lpoItem.regNo || 'N/A'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Comments:</span>
                                        <span className="info-value">{lpoItem.approvalTrail[1].comments || 'N/A'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Requested By:</span>
                                        <span className="info-value">{lpoItem.approvalTrail[1].role || 'N/A'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Registered Time:</span>
                                        <span className="info-value">{lpoItem.createdAt || 'N/A'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Requsted Time:</span>
                                        <span className="info-value">{lpoItem.createdAt || 'N/A'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Assigned Mechanic:</span>
                                        <span className="info-value">{lpoItem.assignedMechanic?.mechanicName || 'N/A'}</span>
                                    </div>
                                </div>
                                <button
                                    className="action-btn create-lpo"
                                    onClick={() => handleCreateLpoFromComplaint(lpoItem)}
                                >
                                    Create LPO
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {
                isLPO ?
                    <div className='lpo-cat-btn'>
                        <div className="add-lpos">
                            <Button
                                text="Create > For All"
                                onClick={() => handleLpo('for-all-equipments')}
                                colorScheme="lime-800"
                                variant="gradient"
                                font="md"
                                animation=""
                                squircle="4xl"
                                width="160px"
                                height="38px"
                                type="submit"
                                textColor="white-200"
                                shadowPosition="to-bottom"
                                shadowColor="white-600"
                            />
                            <Button
                                text="Create > For Stock"
                                onClick={() => handleLpo('for-stock')}
                                colorScheme="lime-800"
                                variant="gradient"
                                font="md"
                                animation=""
                                squircle="4xl"
                                width="160px"
                                height="38px"
                                type="submit"
                                textColor="white-200"
                                shadowPosition="to-bottom"
                                shadowColor="white-600"
                            />
                        </div>
                        <div className="view-lpos">
                            <Button
                                text="View > Of All Equipments"
                                onClick={() => handleLpo('view-for-all-equipments')}
                                colorScheme="orange-800"
                                variant="gradient"
                                font="md"
                                animation=""
                                squircle="4xl"
                                width="220px"
                                height="38px"
                                type="submit"
                                textColor="white-200"
                                shadowPosition="to-bottom"
                                shadowColor="white-600"
                            />
                            <Button
                                text="View > Of Stock"
                                onClick={() => handleLpo('view-for-stock')}
                                colorScheme="orange-800"
                                variant="gradient"
                                font="md"
                                animation=""
                                squircle="4xl"
                                width="160px"
                                height="38px"
                                type="submit"
                                textColor="white-200"
                                shadowPosition="to-bottom"
                                shadowColor="white-600"
                            />
                            <Button
                                text="View > Of All"
                                onClick={() => handleLpo('view-all-lpo')}
                                colorScheme="orange-800"
                                variant="gradient"
                                font="md"
                                animation=""
                                squircle="4xl"
                                width="160px"
                                height="38px"
                                type="submit"
                                textColor="white-200"
                                shadowPosition="to-bottom"
                                shadowColor="white-600"
                            />
                        </div>
                    </div>
                    : ''
            }

            <div className="table-info">
                {searchTerm ? (
                    `Found ${filteredData?.length || 0} matching ${filteredData?.length === 1 ? 'entry' : 'entries'}`
                ) : (
                    `Showing all ${filteredData?.length || 0} entries`
                )}
            </div>

            <div className="equipment-table-container">
                <table className="equipment-table" ref={tableRef}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Machine</th>
                            <th>Reg No</th>
                            <th>Brand</th>
                            <th>Year</th>
                            <th>Company</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            filteredData.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={() => handleRowClick(item.regNo)}
                                    className="equipment-row"
                                >
                                    <td>{item.id}</td>
                                    <td>{item.machine}</td>
                                    <td>{item.regNo}</td>
                                    <td>{item.brand}</td>
                                    <td>{item.year}</td>
                                    <td>{item.company}</td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default EquipBypass;