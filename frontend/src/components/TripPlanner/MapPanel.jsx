import React from 'react';
import TripMapDisplay from './TripMapDisplay';

const MapPanel = () => {
  return (
    <div className="w-full h-full bg-gray-300"> {/* Basic styling for visibility */}
      <TripMapDisplay />
    </div>
  );
};

export default MapPanel;
