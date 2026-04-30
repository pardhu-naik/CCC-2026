import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';

// Create custom pulse icons
const createIcon = (type) => L.divIcon({
  className: 'custom-marker-icon',
  html: `<div class="pulse-marker ${type}"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const startIcon = createIcon('start');
const destIcon = createIcon('dest');
const stopIcon = createIcon('stop');

// Component to handle clicks on map
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: onMapClick,
  });
  return null;
}

// Component to dynamically pan map when center changes
function MapCenterer({ center }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom(), {
        animate: true,
        duration: 1.5
      });
    }
  }, [center, map]);
  return null;
}

const MapView = ({ center, zoom, onMapClick, startPoint, destPoint, stops, children }) => {
  return (
    <div className="map-container">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false} // Disable default to place our own
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // Modern looking tile theme
        />
        <ZoomControl position="topright" />
        
        <MapClickHandler onMapClick={onMapClick} />
        <MapCenterer center={center} zoom={zoom} />

        {startPoint && (
          <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon}>
            <Popup>{startPoint.label}</Popup>
          </Marker>
        )}
        
        {destPoint && (
          <Marker position={[destPoint.lat, destPoint.lng]} icon={destIcon}>
            <Popup>{destPoint.label}</Popup>
          </Marker>
        )}

        {stops && stops.map((stop, idx) => (
          <Marker key={idx} position={[stop.lat, stop.lng]} icon={stopIcon}>
            <Popup>{stop.label}</Popup>
          </Marker>
        ))}

        {children}
      </MapContainer>
    </div>
  );
};

export default MapView;
