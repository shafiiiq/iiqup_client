import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URI } from '../../constants';
import { apiRequest } from '../../utils/api';
import { useHeaderTitle } from '../../Context/HeaderTitleContext';
import Button from '../../Common/Button/Button';
import './HireOrderList.css';

function HireOrderList() {
  const navigate = useNavigate();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const [hireOrders, setHireOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setHeaderTitle('Hire Order List');
    setHeaderSubtitle('All Hire Orders');
    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [setHeaderTitle, setHeaderSubtitle]);

  useEffect(() => {
    fetchHireOrders();
  }, []);

  const fetchHireOrders = async () => {
    try {
      const response = await apiRequest(`${API_URI}/hire-order/get-all-hire-orders`, 'GET');
      const data = await response.json();
      setHireOrders(data.data || []);
    } catch (error) {
      console.error('[HireOrderList] error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (ref) => navigate(`/hire-order-doc/${encodeURIComponent(ref)}`);
  const handleDelete = async (ref) => {
    try {
      await apiRequest(`${API_URI}/hire-order/delete-hire-order/${encodeURIComponent(ref)}`, 'DELETE');
      fetchHireOrders();
    } catch (error) {
      console.error('[HireOrderList] delete error:', error);
    }
  };

  return (
    <div className="hire-order-container">
      <div className="hire-order-controls-container" style={{ justifyContent: 'flex-end' }}>
        <Button text="Create Hire Order" onClick={() => navigate('/hire-order-form')} colorScheme="lime-800" variant="gradient" font="md" animation="" squircle="4xl" width="180px" height="38px" type="submit" textColor="white-200" shadowPosition="to-bottom" shadowColor="white-600" />
      </div>
      {isLoading ? <div>Loading...</div> : (
        <table className="hire-order-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Date</th>
              <th>Vendor</th>
              <th>Workflow</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hireOrders.map((item) => (
              <tr key={item._id}>
                <td>{item.hireOrderRef}</td>
                <td>{item.date}</td>
                <td>{item.company?.vendor}</td>
                <td>{item.workflowStatus}</td>
                <td>
                  <Button text="View" onClick={() => handleView(item.hireOrderRef)} colorScheme="amber-800" variant="gradient" font="md" animation="" squircle="4xl" width="120px" height="38px" type="submit" textColor="white-200" shadowPosition="to-bottom" shadowColor="white-600" />
                  <Button text="Delete" onClick={() => handleDelete(item.hireOrderRef)} colorScheme="error-700" variant="gradient" font="md" animation="" squircle="4xl" width="120px" height="38px" type="submit" textColor="white-200" shadowPosition="to-bottom" shadowColor="white-600" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default HireOrderList;
