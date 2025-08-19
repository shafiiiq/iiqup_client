import { useState, useRef, useEffect } from 'react';
import './EquipBypass.css';
import { useNavigate } from 'react-router-dom';
import { END_POINT } from '../../../constants';
import { apiRequest } from '../../../utils/0auth';

function EquipBypass({ equipStocks, documents, isLPO }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [equipments, setEquipments] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [currentDateTime, setCurrentDateTime] = useState('');

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
    }, []);


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

    const handleAddLpo = (type) => {
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

    return (
        <div className="equipment-container">
            <div className="equipment-header">
                <h1 className='equip-title'>Select the equipment</h1>
                <div className="date-time">{currentDateTime}</div>
            </div>

            <div className="controls-container">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search equipment..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="search-input"
                    />
                    {searchTerm && (
                        <button onClick={handleClearSearch} className="clear-button">
                            ×
                        </button>
                    )}
                    <button onClick={handleSearchSubmit} className="search-button">
                        Search
                    </button>
                </div>
            </div>

            {
                isLPO ?
                    <div className='lpo-cat-btn'>
                        <div className="add-lpos">
                            <button onClick={() => handleAddLpo('for-all-equipments')} className="action-btn add">
                                Add LPO For All Equipments
                            </button>
                            <button onClick={() => handleAddLpo('for-stock')} className="action-btn add">
                                Add LPO For Stock
                            </button>
                        </div>
                        <div className="view-lpos">
                            <button onClick={() => handleAddLpo('view-for-all-equipments')} className="action-btn">
                                View LPO Of All Equipment
                            </button>
                            <button onClick={() => handleAddLpo('view-for-stock')} className="action-btn">
                                View LPO Of Stocks
                            </button>
                            <button onClick={() => handleAddLpo('view-all-lpo')} className="action-btn">
                                View All LPO
                            </button>
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