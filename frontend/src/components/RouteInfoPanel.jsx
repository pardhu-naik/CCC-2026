import React from 'react';
import { Activity, Map, Milestone } from 'lucide-react';

const RouteInfoPanel = ({ routeData, showAnimation, setShowAnimation, animationSpeed, setAnimationSpeed }) => {
  if (!routeData) return null;

  return (
    <div className="route-info-panel glass-panel">
      <div className="info-item">
        <span className="info-label">
          <Milestone size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Total Distance
        </span>
        <span className="info-value">{routeData.distance}</span>
      </div>
      
      <div className="info-item">
        <span className="info-label">
          <Activity size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Nodes Explored
        </span>
        <span className="info-value">{routeData.nodesExplored}</span>
      </div>

      <div className="info-item">
        <span className="info-label">
          <Map size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Algorithm Steps
        </span>
        <span className="info-value">{routeData.totalSteps}</span>
      </div>

      <div className="info-item" style={{ borderLeft: '1px solid var(--panel-border)', paddingLeft: '24px', marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <label className="toggle-container" style={{ whiteSpace: 'nowrap' }}>
          <input 
            type="checkbox" 
            checked={showAnimation}
            onChange={(e) => setShowAnimation(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
          />
          Show Algorithm Steps
        </label>

        {showAnimation && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="info-label" style={{ fontSize: '11px' }}>Speed</span>
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={animationSpeed} 
              onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
              style={{ width: '80px', accentColor: 'var(--accent)' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteInfoPanel;
