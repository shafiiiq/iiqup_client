import React from 'react';

const DeviceInfoPanel = ({ deviceInfo }) => (
  <div className="shared widget modal device-info">
    <div className="shared widget modal device-info-item">
      <span className="shared widget modal device-info-label">Device:</span>
      <span className="shared widget modal device-info-value">{deviceInfo.browserInfo}</span>
    </div>
    <div className="shared widget modal device-info-item">
      <span className="shared widget modal device-info-label">Location:</span>
      <span className="shared widget modal device-info-value">{deviceInfo.location}</span>
    </div>
    <div className="shared widget modal device-info-item">
      <span className="shared widget modal device-info-label">IP:</span>
      <span className="shared widget modal device-info-value">{deviceInfo.ipAddress}</span>
    </div>
  </div>
);

export default DeviceInfoPanel;
