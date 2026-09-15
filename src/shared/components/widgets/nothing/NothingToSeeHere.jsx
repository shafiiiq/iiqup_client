import React from 'react';
import NothingToSeeHereImage from '@assets/images/nothing-to-see-here.png';
import './NothingToSeeHere.css';

const NothingToSeeHere = ({
  width = '100%',
  height = '100%',
  title = "We couldn't find what you're looking for",
  subtitle = 'Try searching for something else or adjusting your filters',
  className = '',
}) => {
  return (
    <div
      className={`shared components widgets nothing-to-see-here container ${className}`.trim()}
      style={{ width, height }}
    >
      <img
        className="shared components widgets nothing-to-see-here image"
        src={NothingToSeeHereImage}
        alt="Nothing To See Here"
      />

      <h2 className="shared components widgets nothing-to-see-here main-title">
        Nothing To See Here
      </h2>

      <h3 className="shared components widgets nothing-to-see-here title">
        {title}
      </h3>

      <p className="shared components widgets nothing-to-see-here subtitle">
        {subtitle}
      </p>
    </div>
  );
};

export default NothingToSeeHere;