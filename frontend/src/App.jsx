import React, { useState } from 'react';
import MapView from './components/MapView';
import SearchPanel from './components/SearchPanel';
import RouteInfoPanel from './components/RouteInfoPanel';
import DijkstraVisualizer from './components/DijkstraVisualizer';
import './index.css';

function App() {
  const [startPoint, setStartPoint] = useState(null);
  const [destPoint, setDestPoint] = useState(null);
  const [stops, setStops] = useState([]);
  
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]);
  const [mapZoom] = useState(13);
  
  const [routeData, setRouteData] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(10);
  const [isCalculating, setIsCalculating] = useState(false);
  // Keeps the visualizer mounted even after calculation finishes
  const [routeActive, setRouteActive] = useState(false);
  // Key to force-remount the visualizer on each new search
  const [routeKey, setRouteKey] = useState(0);

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    if (!startPoint) {
      setStartPoint({ lat, lng, label: 'Selected Start' });
    } else if (!destPoint) {
      setDestPoint({ lat, lng, label: 'Selected Destination' });
    } else {
      setStops([...stops, { lat, lng, label: `Stop ${stops.length + 1}` }]);
    }
  };

  const calculateRoute = () => {
    if (!startPoint || !destPoint) return;
    setIsCalculating(true);
    setRouteActive(true);
    setRouteKey(prev => prev + 1);
    setRouteData(null);
  };

  return (
    <div className="app-container">
      <SearchPanel 
        startPoint={startPoint} setStartPoint={setStartPoint}
        destPoint={destPoint} setDestPoint={setDestPoint}
        stops={stops} setStops={setStops}
        setMapCenter={setMapCenter}
        onSearch={calculateRoute}
        isCalculating={isCalculating}
      />
      
      <MapView 
        center={mapCenter} 
        zoom={mapZoom} 
        onMapClick={handleMapClick}
        startPoint={startPoint}
        destPoint={destPoint}
        stops={stops}
      >
        {(startPoint && destPoint && routeActive) && (
          <DijkstraVisualizer 
            key={routeKey}
            startPoint={startPoint} 
            destPoint={destPoint} 
            stops={stops}
            showAnimation={showAnimation}
            animationSpeed={animationSpeed}
            onComplete={(data) => {
              setRouteData(data);
              setIsCalculating(false);
            }}
          />
        )}
      </MapView>

      {routeData && (
        <RouteInfoPanel 
          routeData={routeData} 
          showAnimation={showAnimation}
          setShowAnimation={setShowAnimation}
          animationSpeed={animationSpeed}
          setAnimationSpeed={setAnimationSpeed}
        />
      )}
    </div>
  );
}

export default App;
