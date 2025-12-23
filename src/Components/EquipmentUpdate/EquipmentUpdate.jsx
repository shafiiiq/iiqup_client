import React, { useState, useEffect } from 'react';
import '../EquipmentUpdate/EquipmentUpdate.css';

const EquipmentUpdate = () => {
  const [equipmentData, setEquipmentData] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Temporary API URLs - replace these with your actual endpoints
  const API_URLS = {
    fetchEquipment: 'https://api.example.com/equipment',
    updateStatus: 'https://api.example.com/equipment/status'
  };

  // Get current date in DD-MM-YY format and time in AM/PM format
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
      hours = hours ? hours : 12; // Convert 0 to 12
      const timeString = `${hours}:${minutes} ${ampm}`;

      setCurrentDateTime(`${dateString}   |   ${timeString}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Fetch equipment data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // For now, use the sample data
        setTimeout(() => {
          setEquipmentData([
            {
              "id": "1",
              "machine": "80 Ton Mobile Crane",
              "brand": "ZOOMLION",
              "regNo": "78862",
              "status": "committed"
            },
            {
              "id": "2",
              "machine": "80 Ton Mobile Crane",
              "brand": "ZOOMLION",
              "regNo": "78863",
              "status": "committed"
            },
            {
              "id": "3",
              "machine": "Dumptruck",
              "brand": "SINOTRUK",
              "regNo": "281998",
              "status": "committed"
            },
            {
              "id": "4",
              "machine": "3 Ton Boom Truck",
              "brand": "MISTUBISHI",
              "regNo": "239500",
              "status": "idle"
            },
            {
              "id": "5",
              "machine": "Mini Dumptruck",
              "brand": "ISUZU",
              "regNo": "198331",
              "status": "idle"
            },
            {
              "id": "6",
              "machine": "3 Ton Roller",
              "brand": "BOMAG",
              "regNo": "70770",
              "status": "maintenance"
            },
            {
              "id": "7",
              "machine": "3 Ton Roller",
              "brand": "BOMAG",
              "regNo": "70760",
              "status": "maintenance"
            },
            {
              "id": "8",
              "machine": "3 Ton Forklift",
              "brand": "LONKING",
              "regNo": "72870",
              "status": "idle"
            },
            {
              "id": "9",
              "machine": "3 Ton Forklift",
              "brand": "LONKING",
              "regNo": "72871",
              "status": "idle"
            },
            {
              "id": "10",
              "machine": "3 Ton Forklift",
              "brand": "HELI",
              "regNo": "43097",
              "status": "maintenance"
            },
            {
              "id": "11",
              "machine": "3 Ton Forklift",
              "brand": "HELI",
              "regNo": "70579",
              "status": "maintenance"
            },
            {
              "id": "12",
              "machine": "5 Ton Forklift",
              "brand": "ZOOMLION",
              "regNo": "72484",
              "status": "maintenance"
            },
            {
              "id": "13",
              "machine": "5 Ton Forklift",
              "brand": "TCM",
              "regNo": "15050",
              "status": "idle"
            },
            {
              "id": "14",
              "machine": "7 Ton Forklift",
              "brand": "HELI",
              "regNo": "36707",
              "status": "idle"
            },
            {
              "id": "15",
              "machine": "Skid Loader",
              "brand": "JCB",
              "regNo": "54470",
              "status": "idle"
            },
            {
              "id": "16",
              "machine": "Backhoe Loader",
              "brand": "CASE",
              "regNo": "67823",
              "status": "idle"
            },
            {
              "id": "17",
              "machine": "Wheel Loader",
              "brand": "LUIGONG",
              "regNo": "71056",
              "status": "maintenance"
            },
            {
              "id": "18",
              "machine": "Wheel Loader",
              "brand": "LUIGONG",
              "regNo": "70126",
              "status": "idle"
            },
            {
              "id": "19",
              "machine": "20 Ton Wheel Excavator",
              "brand": "HYUNDAI",
              "regNo": "68978",
              "status": "maintenance"
            },
            {
              "id": "20",
              "machine": "20 Ton Wheel Excavator",
              "brand": "HYUNDAI",
              "regNo": "46941",
              "status": "idle"
            },
            {
              "id": "21",
              "machine": "30 Ton Mobile Crane",
              "brand": "SANY",
              "regNo": "68154",
              "status": "idle"
            },
            {
              "id": "22",
              "machine": "10 Ton Roller",
              "brand": "BOMAG",
              "regNo": "43711",
              "status": "idle"
            }
          ]);
          setLoading(false);
        }, 500); // Simulate network delay
      } catch (err) {
        setError('Failed to fetch equipment data');
        setLoading(false);
        console.error('Error fetching equipment data:', err);
      }
    };

    fetchData();
  }, []);

  // Count equipment by status
  const statusCounts = {
    all: equipmentData.length,
    idle: equipmentData.filter(item => item.status === 'idle').length,
    committed: equipmentData.filter(item => item.status === 'committed').length,
    maintenance: equipmentData.filter(item => item.status === 'maintenance').length
  };

  // Filter data based on selected filter
  const filteredData = filter === 'all'
    ? equipmentData
    : equipmentData.filter(item => item.status === filter);

  // Update equipment status
  const updateStatus = async (equipmentId, newStatus) => {
    try {

      // For now, update the local state directly
      const updatedData = equipmentData.map(item =>
        item.id === equipmentId ? { ...item, status: newStatus } : item
      );

      setEquipmentData(updatedData);
      setSelectedEquipment(null); // Close details panel after update

      alert(`Equipment ID ${equipmentId} status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating equipment status:', err);
      alert('Failed to update equipment status');
    }
  };

  // Show equipment details
  const showDetails = (equipment) => {
    setSelectedEquipment(equipment);
  };

  return (
    <div className="equipment-update-container">
      <div className="equipment-header">
        <h1 className='equip-updates'>Equipment Updates</h1>
        <div className="date-time">{currentDateTime}</div>
      </div>

      <div className="filter-buttons">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({statusCounts.all})
        </button>
        <button
          className={`filter-btn idle ${filter === 'idle' ? 'active' : ''}`}
          onClick={() => setFilter('idle')}
        >
          Idle ({statusCounts.idle})
        </button>
        <button
          className={`filter-btn committed ${filter === 'committed' ? 'active' : ''}`}
          onClick={() => setFilter('committed')}
        >
          Committed ({statusCounts.committed})
        </button>
        <button
          className={`filter-btn maintenance ${filter === 'maintenance' ? 'active' : ''}`}
          onClick={() => setFilter('maintenance')}
        >
          Maintenance ({statusCounts.maintenance})
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading equipment data...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="equipment-table-container">
          <table className="equipment-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Machine</th>
                <th>Brand</th>
                <th>Reg No</th>
                <th>Site</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.machine}</td>
                  <td>{item.brand}</td>
                  <td>{item.regNo}</td>
                  {item.status === 'committed' ? <td>Raslaffan</td> : <td> </td>}
                  <td>
                    <span className={`status-badge ${item.status}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="action-btn details"
                      onClick={() => showDetails(item)}
                    >
                      Status change
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedEquipment && (
        <div className="equipment-details">
          <div className="details-header">
            <h2>Equipment Details</h2>
            <button className="close-btn" onClick={() => setSelectedEquipment(null)}>
              <span class="material-symbols-rounded">
                close
              </span>
            </button>
          </div>
          <div className="details-content">
            <div className="detail-item">
              <span className="label">ID:</span>
              <span className="value">{selectedEquipment.id}</span>
            </div>
            <div className="detail-item">
              <span className="label">Machine:</span>
              <span className="value">{selectedEquipment.machine}</span>
            </div>
            <div className="detail-item">
              <span className="label">Brand:</span>
              <span className="value">{selectedEquipment.brand}</span>
            </div>
            <div className="detail-item">
              <span className="label">Registration Number:</span>
              <span className="value">{selectedEquipment.regNo}</span>
            </div>
            <div className="detail-item">
              <span className="label">Current Status:</span>
              <span className={`value status-badge ${selectedEquipment.status}`}>
                {selectedEquipment.status.charAt(0).toUpperCase() + selectedEquipment.status.slice(1)}
              </span>
            </div>

            <div className="status-update-buttons">
              <h3>Update Status</h3>
              <div className="status-btn-group">
                <button
                  className="status-btn idle"
                  onClick={() => updateStatus(selectedEquipment.id, 'idle')}
                  disabled={selectedEquipment.status === 'idle'}
                >
                  Set to Idle
                </button>
                <button
                  className="status-btn committed"
                  onClick={() => updateStatus(selectedEquipment.id, 'committed')}
                  disabled={selectedEquipment.status === 'committed'}
                >
                  Set to Committed
                </button>
                <button
                  className="status-btn maintenance"
                  onClick={() => updateStatus(selectedEquipment.id, 'maintenance')}
                  disabled={selectedEquipment.status === 'maintenance'}
                >
                  Set to Maintenance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentUpdate;