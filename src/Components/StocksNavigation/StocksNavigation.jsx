import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../StocksNavigation/StocksNavigation.css';

const StocksNavigation = () => {
  const navigate = useNavigate();
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Sample inventory stats for demonstration
  const inventoryStats = {
    equipment: {
      total: 124,
      available: 98,
      maintenance: 15,
      critical: 11
    },
    spareParts: {
      total: 567,
      available: 432,
      lowStock: 89,
      ordered: 46
    }
  };

  return (
    <div className="inv-mgmt-container">
      <div className="inv-mgmt-header">
        <h1 className='inv-mgmt-title'>Stocks Inventory Management</h1>
        <div className="inv-mgmt-datetime">{currentDateTime}</div>
      </div>
      
      <div className="inv-mgmt-category-section">
        <button 
          className={`inv-mgmt-category-btn ${selectedCategory === 'all' ? 'inv-mgmt-category-all-active' : ''}`} 
          onClick={() => setSelectedCategory('all')}
        >
          All Categories
        </button>
        <button 
          className={`inv-mgmt-category-btn inv-mgmt-category-equipment ${selectedCategory === 'equipment' ? 'inv-mgmt-category-equipment-active' : ''}`} 
          onClick={() => setSelectedCategory('equipment')}
        >
          Equipment ({inventoryStats.equipment.total})
        </button>
        <button 
          className={`inv-mgmt-category-btn inv-mgmt-category-spareparts ${selectedCategory === 'spareParts' ? 'inv-mgmt-category-spareparts-active' : ''}`} 
          onClick={() => setSelectedCategory('spareParts')}
        >
          Spare Parts ({inventoryStats.spareParts.total})
        </button>
      </div>

      <div className="inv-mgmt-cards-wrapper">
        {/* Equipment Card - always visible or when equipment/all is selected */}
        {(selectedCategory === 'all' || selectedCategory === 'equipment') && (
          <div className="inv-mgmt-card inv-mgmt-card-equipment" onClick={() => handleNavigation('/stocks/equipment-stocks')}>
            <div className="inv-mgmt-card-header inv-mgmt-card-header-equipment">
              <h2 className="inv-mgmt-card-title">Equipment Inventory</h2>
              <div className="inv-mgmt-card-badge">{inventoryStats.equipment.total} Items</div>
            </div>
            <div className="inv-mgmt-card-content">
              <div className="inv-mgmt-stats-row">
                <div className="inv-mgmt-stat-item">
                  <span className="inv-mgmt-stat-value">{inventoryStats.equipment.available}</span>
                  <span className="inv-mgmt-stat-label">Available</span>
                </div>
                <div className="inv-mgmt-stat-item">
                  <span className="inv-mgmt-stat-value">{inventoryStats.equipment.maintenance}</span>
                  <span className="inv-mgmt-stat-label">In Maintenance</span>
                </div>
                <div className="inv-mgmt-stat-item inv-mgmt-stat-critical">
                  <span className="inv-mgmt-stat-value">{inventoryStats.equipment.critical}</span>
                  <span className="inv-mgmt-stat-label">Critical</span>
                </div>
              </div>
              
              {/* Progress bar for equipment utilization */}
              <div className="inv-mgmt-progress-section">
                <h3 className="inv-mgmt-progress-title">Equipment Utilization</h3>
                <div className="inv-mgmt-progress-container">
                  <div 
                    className="inv-mgmt-progress-bar inv-mgmt-progress-bar-equipment"
                    style={{ width: `${Math.round(((inventoryStats.equipment.total - inventoryStats.equipment.available) / inventoryStats.equipment.total) * 100)}%` }}
                  >
                    <span className="inv-mgmt-progress-text">
                      {Math.round(((inventoryStats.equipment.total - inventoryStats.equipment.available) / inventoryStats.equipment.total) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <button className="inv-mgmt-action-btn inv-mgmt-equipment-btn">
                Manage Equipment
              </button>
            </div>
          </div>
        )}

        {/* Spare Parts Card - always visible or when spareParts/all is selected */}
        {(selectedCategory === 'all' || selectedCategory === 'spareParts') && (
          <div className="inv-mgmt-card inv-mgmt-card-spareparts" onClick={() => handleNavigation('/stocks/spare-parts')}>
            <div className="inv-mgmt-card-header inv-mgmt-card-header-spareparts">
              <h2 className="inv-mgmt-card-title">Spare Parts Inventory</h2>
              <div className="inv-mgmt-card-badge">{inventoryStats.spareParts.total} Items</div>
            </div>
            <div className="inv-mgmt-card-content">
              <div className="inv-mgmt-stats-row">
                <div className="inv-mgmt-stat-item">
                  <span className="inv-mgmt-stat-value">{inventoryStats.spareParts.available}</span>
                  <span className="inv-mgmt-stat-label">Available</span>
                </div>
                <div className="inv-mgmt-stat-item inv-mgmt-stat-warning">
                  <span className="inv-mgmt-stat-value">{inventoryStats.spareParts.lowStock}</span>
                  <span className="inv-mgmt-stat-label">Low Stock</span>
                </div>
                <div className="inv-mgmt-stat-item inv-mgmt-stat-info">
                  <span className="inv-mgmt-stat-value">{inventoryStats.spareParts.ordered}</span>
                  <span className="inv-mgmt-stat-label">On Order</span>
                </div>
              </div>
              
              {/* Progress bar for spare parts stock level */}
              <div className="inv-mgmt-progress-section">
                <h3 className="inv-mgmt-progress-title">Stock Level</h3>
                <div className="inv-mgmt-progress-container">
                  <div 
                    className="inv-mgmt-progress-bar inv-mgmt-progress-bar-spareparts"
                    style={{ width: `${Math.round((inventoryStats.spareParts.available / inventoryStats.spareParts.total) * 100)}%` }}
                  >
                    <span className="inv-mgmt-progress-text">
                      {Math.round((inventoryStats.spareParts.available / inventoryStats.spareParts.total) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <button className="inv-mgmt-action-btn inv-mgmt-spareparts-btn">
                Manage Spare Parts
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StocksNavigation;