import React from 'react';

const UpdatesList = ({ items }) => (
  <div className="shared widget modal updates-list">
    {items.map((item, index) => (
      <div key={index} className="shared widget modal updates-item">
        <div className="shared widget modal updates-bullet" />
        <span className="shared widget modal updates-text">{item}</span>
      </div>
    ))}
  </div>
);

export default UpdatesList;
