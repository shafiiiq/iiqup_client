import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URI } from '../../constants';
import { apiRequest } from '../../utils/api';
import { useHeaderTitle } from '../../Context/HeaderTitleContext';
import Button from '../../Common/Button/Button';
import '../HireOrderDoc/HireOrderDoc.css';

function HireOrderSignature() {
  const navigate = useNavigate();
  const { refNo, role } = useParams();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const [hireOrder, setHireOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signedFrom, setSignedFrom] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setHeaderTitle(`Sign Hire Order - ${role?.toUpperCase() || 'Approver'}`);
    setHeaderSubtitle(refNo || 'Hire Order');
    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [refNo, role, setHeaderTitle, setHeaderSubtitle]);

  useEffect(() => {
    const fetchHireOrder = async () => {
      try {
        const response = await apiRequest(`${API_URI}/hire-order/get-hire-order-by-ref/${encodeURIComponent(refNo)}`, 'GET');
        const data = await response.json();
        if (data.success) setHireOrder(data.data);
        else setError('Failed to load hire order');
      } catch (error) {
        console.error('[HireOrderSignature] fetch error:', error);
        setError('Error loading hire order');
      } finally {
        setLoading(false);
      }
    };

    if (refNo) fetchHireOrder();
  }, [refNo]);

  const handleSign = async () => {
    if (!signedFrom.trim()) {
      setError('Please enter your name/location');
      return;
    }

    setSigning(true);
    setError('');
    try {
      const uniqueCode = localStorage.getItem('userCode') || 'SYSTEM_USER';
      const roleMap = { manager: 'MANAGER', pm: 'PURCHASE_MANAGER', accounts: 'ACCOUNTS', ceo: 'CEO', md: 'MANAGING_DIRECTOR' };
      
      const response = await apiRequest(
        `${API_URI}/hire-order/sign/${encodeURIComponent(refNo)}`,
        'POST',
        {
          uniqueCode,
          role: roleMap[role?.toLowerCase()] || 'SYSTEM',
          signedDate: new Date().toISOString(),
          signedFrom: signedFrom.trim(),
        }
      );
      
      const data = await response.json();
      if (data.success) {
        alert('Hire order signed successfully');
        navigate(`/hire-order-doc/${refNo}`);
      } else {
        setError(data.message || 'Failed to sign hire order');
      }
    } catch (error) {
      console.error('[HireOrderSignature] sign error:', error);
      setError('Error signing hire order');
    } finally {
      setSigning(false);
    }
  };

  if (loading) return <div className="hire-order-page-container">Loading...</div>;
  if (!hireOrder) return <div className="hire-order-page-container">Hire order not found.</div>;

  return (
    <div className="hire-order-page-container">
      <div className="hire-order-controls">
        <Button text="Back" onClick={() => navigate(-1)} colorScheme="slate-600" variant="outline" font="md" width="100px" height="38px" type="button" />
      </div>
      {error && <div style={{ padding: '12px', marginBottom: '12px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '4px' }}>{error}</div>}
      <div className="hire-order-document">
        <h2>HIRE ORDER - SIGNATURE</h2>
        <p><strong>Ref:</strong> {hireOrder.hireOrderRef}</p>
        <p><strong>Date:</strong> {hireOrder.date}</p>
        <p><strong>Vendor:</strong> {hireOrder.company?.vendor}</p>
        <p><strong>Status:</strong> {hireOrder.workflowStatus}</p>
        
        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>Approval Summary</h3>
          <p><strong>Manager Signed:</strong> {hireOrder.managerSigned ? '✓ Yes' : '✗ No'}</p>
          <p><strong>Purchasing Manager Signed:</strong> {hireOrder.pmSigned ? '✓ Yes' : '✗ No'}</p>
          <p><strong>Accounts Signed:</strong> {hireOrder.accountsSigned ? '✓ Yes' : '✗ No'}</p>
          <p><strong>CEO/MD Signed:</strong> {hireOrder.ceoSigned ? '✓ Yes' : '✗ No'}</p>
        </div>

        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#fffbeb', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>Sign as {role?.toUpperCase() || 'APPROVER'}</h3>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <strong>Your Name / Location:</strong>
            </label>
            <input
              type="text"
              value={signedFrom}
              onChange={(e) => setSignedFrom(e.target.value)}
              placeholder="e.g., John Doe, Dubai"
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <strong>Notes (Optional):</strong>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this approval"
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', minHeight: '80px' }}
            />
          </div>
          <Button
            text={signing ? 'Signing...' : 'Sign Now'}
            onClick={handleSign}
            colorScheme="green-600"
            variant="gradient"
            font="md"
            width="140px"
            height="40px"
            type="button"
            textColor="white-200"
            disabled={signing}
          />
        </div>
      </div>
    </div>
  );
}

export default HireOrderSignature;
