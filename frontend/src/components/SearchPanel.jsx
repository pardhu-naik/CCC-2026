import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, ArrowUpDown, Plus } from 'lucide-react';
import axios from 'axios';

const SearchPanel = ({ startPoint, setStartPoint, destPoint, setDestPoint, setMapCenter, onSearch, isCalculating }) => {
  const [startQuery, setStartQuery] = useState(startPoint?.label || '');
  const [destQuery, setDestQuery] = useState(destPoint?.label || '');
  const [activeInput, setActiveInput] = useState(null); // 'start', 'dest', or `stop-${idx}`
  const [suggestions, setSuggestions] = useState([]);
  
  const timeoutRef = useRef(null);

  // Sync inputs if points change via map click
  useEffect(() => { if (startPoint?.label) setTimeout(() => setStartQuery(startPoint.label), 0); }, [startPoint]);
  useEffect(() => { if (destPoint?.label) setTimeout(() => setDestQuery(destPoint.label), 0); }, [destPoint]);

  const searchNominatim = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5`);
      setSuggestions(res.data);
    } catch (err) {
      console.error('Error fetching locations', err);
    }
  };

  const onInputChange = (e, type) => {
    const val = e.target.value;
    if (type === 'start') setStartQuery(val);
    else if (type === 'dest') setDestQuery(val);
    
    setActiveInput(type);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => searchNominatim(val), 500);
  };

  const handleSelect = (item) => {
    const pt = { lat: parseFloat(item.lat), lng: parseFloat(item.lon), label: item.display_name };
    if (activeInput === 'start') {
      setStartPoint(pt);
      setStartQuery(item.display_name);
    } else if (activeInput === 'dest') {
      setDestPoint(pt);
      setDestQuery(item.display_name);
    }
    setMapCenter([pt.lat, pt.lng]);
    setSuggestions([]);
    setActiveInput(null);
  };

  const handleSwap = () => {
    const tempPt = startPoint;
    const tempQuery = startQuery;
    
    setStartPoint(destPoint);
    setStartQuery(destQuery);
    
    setDestPoint(tempPt);
    setDestQuery(tempQuery);
  };

  return (
    <div className="search-panel-container glass-panel">
      <div style={{ position: 'relative' }}>
        <div className="input-group">
          <Navigation className="input-icon" size={18} />
          <input 
            className="input-field"
            placeholder="Choose starting point..."
            value={startQuery}
            onChange={(e) => onInputChange(e, 'start')}
            onFocus={() => setActiveInput('start')}
          />
        </div>

        <button className="swap-btn" onClick={handleSwap} aria-label="Swap locations">
          <ArrowUpDown size={14} />
        </button>

        <div className="input-group" style={{ marginTop: '12px' }}>
          <MapPin className="input-icon" size={18} style={{ color: 'var(--error)' }} />
          <input 
            className="input-field"
            placeholder="Choose destination..."
            value={destQuery}
            onChange={(e) => onInputChange(e, 'dest')}
            onFocus={() => setActiveInput('dest')}
          />
        </div>

        {/* Floating Suggestions */}
        {suggestions.length > 0 && activeInput && (
          <ul className="suggestions-dropdown glass-panel">
            {suggestions.map(s => (
              <li key={s.place_id} className="suggestion-item" onClick={() => handleSelect(s)}>
                {s.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="action-row">
        <button className="btn btn-secondary" onClick={() => {}} disabled title="Adding stops feature in progress">
          <Plus size={16} /> Add Stop
        </button>
        <button 
          className="btn btn-primary" 
          onClick={onSearch}
          disabled={!startPoint || !destPoint || isCalculating}
        >
          <Search size={16} /> {isCalculating ? 'Searching...' : 'Find Route'}
        </button>
      </div>
    </div>
  );
};

export default SearchPanel;
