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
    const [isLoadingEquipments, setIsLoadingEquipments] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

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

    // Infinite scroll for loading more equipment
    useEffect(() => {
        if (!hasMore || isLoadingMore || isLoadingEquipments) return;

        let scrollTimeout = null;

        const handleInfiniteScroll = () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);

            scrollTimeout = setTimeout(() => {
                const scrollTop = window.scrollY + window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;

                // Load more when 80% scrolled
                if (scrollTop > documentHeight * 0.8) {
                    console.log('Loading more equipment...');
                    fetchEquipments(currentPage + 1, true);
                }
            }, 200);
        };

        window.addEventListener('scroll', handleInfiniteScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleInfiniteScroll);
            if (scrollTimeout) clearTimeout(scrollTimeout);
        };
    }, [hasMore, isLoadingMore, isLoadingEquipments, currentPage]);

    const fetchEquipments = async (page = 1, append = false) => {
        if (page === 1) {
            setIsLoadingEquipments(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            // Fetch equipment list with pagination
            const response = await apiRequest(
                `${END_POINT}/equipments/get-equipments?page=${page}&limit=20`,
                'GET'
            );
            const data = await response.json();

            if (!data.ok) {
                throw new Error(data.message || 'Failed to fetch equipments');
            }

            const equipmentList = data.data;
            setCurrentPage(data.pagination.currentPage);
            setTotalPages(data.pagination.totalPages);
            setTotalCount(data.pagination.totalCount);
            setHasMore(data.pagination.hasMore);

            if (append) {
                // Add to existing equipment
                setEquipments(prev => [...prev, ...equipmentList]);
                setFilteredData(prev => [...prev, ...equipmentList]);
            } else {
                // Replace all equipment
                setEquipments(equipmentList);
                setFilteredData(equipmentList);
            }

            setIsLoadingEquipments(false);
            setIsLoadingMore(false);
        } catch (error) {
            console.error('Error fetching equipment records:', error);
            setIsLoadingEquipments(false);
            setIsLoadingMore(false);
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

    // Search functionality with debounce
    useEffect(() => {
        const searchEquipments = async () => {
            if (!searchTerm || searchTerm.trim() === '') {
                // Search cleared - reload original equipment data
                fetchEquipments(1, false); // Reset to page 1, don't append
                return;
            }

            try {
                const response = await apiRequest(
                    `${END_POINT}/equipments/search-equipments`,
                    'POST',
                    {
                        searchTerm: searchTerm.trim(),
                        page: 1,
                        limit: 100,
                        searchField: 'all'
                    }
                );

                const data = await response.json();

                if (data.ok) {
                    setFilteredData(data.data);
                }
            } catch (error) {
                console.error('Search error:', error);
            }
        };

        const debounceTimer = setTimeout(() => {
            searchEquipments();
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

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
                            <span className="material-symbols-rounded">
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
                                        <span className="info-label">Requested Time:</span>
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
                                text="View > All"
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
                    `Showing ${filteredData?.length || 0} of ${totalCount || 0} entries`
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
                        {filteredData.map((item, index) => (
                            <tr
                                key={item.id || index}
                                onClick={() => handleRowClick(item.regNo)}
                                className="equipment-row"
                            >
                                <td>{index + 1}</td>
                                <td>{item.machine}</td>
                                <td>{item.regNo}</td>
                                <td>{item.brand}</td>
                                <td>{item.year}</td>
                                <td>{item.company}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {/* Loading indicator */}
                {isLoadingMore && (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '20px',
                        color: '#666'
                    }}>
                        Loading more equipment...
                    </div>
                )}

                {/* No more data indicator */}
                {!hasMore && !isLoadingEquipments && filteredData.length > 0 && (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '20px',
                        color: '#999'
                    }}>
                        All equipment loaded
                    </div>
                )}
            </div>
        </div>
    );
}

export default EquipBypass;