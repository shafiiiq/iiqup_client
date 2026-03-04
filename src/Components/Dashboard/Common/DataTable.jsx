const DataTable = ({ currentData, formatDate }) => {
  if (!currentData?.tyreHistory?.length && !currentData?.maintenanceHistory?.length) {
    return null;
  }

  return (
    <div className='chart-card-container'>
      {/* Recent Tyre Replacements */}
      {currentData?.tyreHistory?.length > 0 && (
        <div className="dashboard-equipment-card">
          <div className="table-header">
            <h3>Recent Tyre Replacements</h3>
            <p>Latest tyre replacement records and maintenance</p>
          </div>
          <div className="maintenance-table-container">
            <table className="maintenance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Equipment</th>
                  <th>Reg No</th>
                  <th>Brand</th>
                  <th>Tyre Model</th>
                  <th>Size</th>
                  <th>Location</th>
                  <th>Running Hours</th>
                </tr>
              </thead>
              <tbody>
                {currentData.tyreHistory.slice(0, 100).reverse().map((item) => (
                  <tr key={item._id}>
                    <td>{formatDate(item.date)}</td>
                    <td>{item.equipment}</td>
                    <td className="reg-no">{item.equipmentNo}</td>
                    <td className="reg-no">{item.brand}</td>
                    <td>{item.tyreModel}</td>
                    <td>{item.tyreNumber}</td>
                    <td>{item.location}</td>
                    <td>{item.runningHours} hrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Maintenance Tasks */}
      {currentData?.maintenanceHistory?.length > 0 && (
        <div className="dashboard-maintenance-card">
          <div className="table-header">
            <h3>Recent Maintenance Tasks</h3>
            <p>Latest maintenance activities and work completed</p>
          </div>
          <div className="maintenance-table-container">
            <table className="maintenance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reg No</th>
                  <th>Equipment</th>
                  <th>Brand</th>
                  <th>Mechanics</th>
                  <th>Work Done</th>
                </tr>
              </thead>
              <tbody>
                {currentData.maintenanceHistory.slice(0, 100).reverse().map((item) => (
                  <tr key={item._id}>
                    <td>{formatDate(item.date)}</td>
                    <td className="reg-no">{item.regNo}</td>
                    <td>{item.equipment}</td>
                    <td>{item.brand}</td>
                    <td>{item.mechanics}</td>
                    <td className="work-remarks">
                      {item.workRemarks.length > 100
                        ? `${item.workRemarks.substring(0, 100)}...`
                        : item.workRemarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;