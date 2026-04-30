import React, { useEffect, useState, useRef } from 'react';
import { Polyline } from 'react-leaflet';
import axios from 'axios';

/**
 * Fetches routing data from OSRM and converts it into a graph structure for Dijkstra.
 */
const fetchOSRMData = async (start, dest) => {
  const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${dest.lng},${dest.lat}?alternatives=true&geometries=geojson&overview=full`;
  
  const res = await axios.get(url);
  if (res.data.code !== 'Ok') throw new Error('OSRM Route not found');

  const nodes = {};
  const adjacency = {};
  const edges = [];
  const unvisitedNodes = [];

  const getOrCreateNode = (lng, lat) => {
    const id = `${lng.toFixed(6)},${lat.toFixed(6)}`;
    if (!nodes[id]) {
      nodes[id] = { 
        id, 
        lat, 
        lng, 
        distance: Infinity, 
        visited: false, 
        previousNode: null 
      };
      adjacency[id] = [];
      unvisitedNodes.push(nodes[id]);
    }
    return nodes[id];
  };

  res.data.routes.forEach(route => {
    const coords = route.geometry.coordinates;
    for (let i = 0; i < coords.length - 1; i++) {
        const n1 = getOrCreateNode(coords[i][0], coords[i][1]);
        const n2 = getOrCreateNode(coords[i+1][0], coords[i+1][1]);
        const dist = Math.hypot(n1.lat - n2.lat, n1.lng - n2.lng);
        if (!adjacency[n1.id].find(e => e.id === n2.id)) {
            adjacency[n1.id].push({ id: n2.id, distance: dist });
            adjacency[n2.id].push({ id: n1.id, distance: dist });
            // Store the edge as a line segment for visualization
            edges.push({
              from: n1.id,
              to: n2.id,
              positions: [[n1.lat, n1.lng], [n2.lat, n2.lng]]
            });
        }
    }
  });

  const firstRouteCoords = res.data.routes[0].geometry.coordinates;
  const startNodeId = `${firstRouteCoords[0][0].toFixed(6)},${firstRouteCoords[0][1].toFixed(6)}`;
  const destNodeId = `${firstRouteCoords[firstRouteCoords.length-1][0].toFixed(6)},${firstRouteCoords[firstRouteCoords.length-1][1].toFixed(6)}`;

  return { nodes, adjacency, edges, startNodeId, destNodeId, unvisitedNodes };
};

const DijkstraVisualizer = ({ startPoint, destPoint, showAnimation, animationSpeed = 10, onComplete }) => {
  // Explored edges shown during algorithm traversal
  const [exploredEdges, setExploredEdges] = useState([]);
  // The final shortest path
  const [finalPath, setFinalPath] = useState([]);
  // Animated drawing of the final shortest path (red line growing)
  const [animatingFinalPath, setAnimatingFinalPath] = useState([]);
  const [graphError, setGraphError] = useState(null);
  
  const activeAlgorithm = useRef(false);
  const speedRef = useRef(animationSpeed);
  const showAnimationRef = useRef(showAnimation);
  // Internal tracking refs (not rendered, so no state needed)
  const phaseRef = useRef('idle');

  useEffect(() => { speedRef.current = animationSpeed; }, [animationSpeed]);
  useEffect(() => { showAnimationRef.current = showAnimation; }, [showAnimation]);

  // Reset helper — called before the effect runs its async work
  const resetState = () => {
    setExploredEdges([]);
    setFinalPath([]);
    setAnimatingFinalPath([]);
    setGraphError(null);
    phaseRef.current = 'idle';
  };

  useEffect(() => {
    if (!startPoint || !destPoint) return;
    
    const runAlgorithm = async () => {
      resetState(); // Reset states before starting the async work
      activeAlgorithm.current = true;
      phaseRef.current = 'exploring';

      try {
        const { nodes, adjacency, edges, startNodeId, destNodeId, unvisitedNodes } = await fetchOSRMData(startPoint, destPoint);

        if (!nodes[startNodeId] || !nodes[destNodeId]) {
          throw new Error("Could not map points to road network.");
        }

        nodes[startNodeId].distance = 0;

        // Build a lookup: for any node pair, find the edge index
        const edgeLookup = {};
        edges.forEach((edge, idx) => {
          edgeLookup[`${edge.from}->${edge.to}`] = idx;
          edgeLookup[`${edge.to}->${edge.from}`] = idx;
        });
        
        const getDelay = () => Math.max(1, 101 - speedRef.current);

        // Track which edges have been explored (by index)
        const exploredEdgeIndices = new Set();
        const exploredEdgesAccum = [];

        const step = () => {
          if (!unvisitedNodes.length || !activeAlgorithm.current) return false;

          let minIndex = -1;
          let minDistance = Infinity;
          for (let i = 0; i < unvisitedNodes.length; i++) {
            if (unvisitedNodes[i].distance < minDistance) {
              minDistance = unvisitedNodes[i].distance;
              minIndex = i;
            }
          }

          if (minIndex === -1 || minDistance === Infinity) return false;
          const closestNode = unvisitedNodes.splice(minIndex, 1)[0];
          closestNode.visited = true;

          // When a node is visited, mark edges from it to all its neighbors as "explored"
          const neighbors = adjacency[closestNode.id];
          for (const neighbor of neighbors) {
            const key = `${closestNode.id}->${neighbor.id}`;
            const edgeIdx = edgeLookup[key];
            if (edgeIdx !== undefined && !exploredEdgeIndices.has(edgeIdx)) {
              exploredEdgeIndices.add(edgeIdx);
              exploredEdgesAccum.push(edges[edgeIdx].positions);
            }

            const nextNode = nodes[neighbor.id];
            if (!nextNode || nextNode.visited) continue;
            
            const alt = closestNode.distance + neighbor.distance;
            if (alt < nextNode.distance) {
              nextNode.distance = alt;
              nextNode.previousNode = closestNode.id;
            }
          }

          if (closestNode.id === destNodeId) {
            // Reconstruct shortest path
            const pathCoordinates = [];
            let curr = closestNode;
            while (curr !== null) {
              pathCoordinates.unshift([curr.lat, curr.lng]);
              curr = curr.previousNode ? nodes[curr.previousNode] : null;
            }
            return { done: true, path: pathCoordinates, exploredCount: exploredEdgesAccum.length };
          }

          return { done: false };
        };

        const finalizeRoute = async (path, exploredCount) => {
          const approxDist = (path.reduce((acc, curr, idx) => {
              if (idx === 0) return 0;
              const prev = path[idx-1];
              return acc + Math.hypot(curr[0] - prev[0], curr[1] - prev[1]) * 111;
          }, 0)).toFixed(2);
          
          phaseRef.current = 'finalizing';

          try {
            await axios.post('http://localhost:5000/api/routes/save', {
              startLocation: startPoint,
              destinationLocation: destPoint,
              distance: approxDist,
              nodesExplored: exploredCount,
              path: path.map(p => ({ lat: p[0], lng: p[1] }))
            });
          } catch (e) {
            console.warn("Persistence failed", e);
          }

          onComplete({
            distance: approxDist + ' km',
            nodesExplored: exploredCount,
            totalSteps: exploredCount,
          });
          activeAlgorithm.current = false;
        };

        // --- Animated mode ---
        if (showAnimationRef.current) {
          const runAnimatedLoop = () => {
            if (!activeAlgorithm.current) return;

            const result = step();
            if (!result) return;

            // Batch state updates every 10 steps for performance
            if (exploredEdgesAccum.length % 10 === 0 || result.done) {
              setExploredEdges([...exploredEdgesAccum]);
            }

            if (result.done) {
              // Phase 2: fade out explored edges and draw shortest path
              phaseRef.current = 'revealing';
              
              // Small delay before revealing
              setTimeout(() => {
                if (!activeAlgorithm.current) return;
                // NOT clearing explored edges so they stay visible

                // Animate the shortest path drawing
                const pathCoords = result.path;
                let currentStep = 0;
                const pathInterval = setInterval(() => {
                  if (!activeAlgorithm.current) {
                    clearInterval(pathInterval);
                    return;
                  }
                  if (currentStep <= pathCoords.length) {
                    setAnimatingFinalPath(pathCoords.slice(0, currentStep));
                    currentStep++;
                  } else {
                    clearInterval(pathInterval);
                    setAnimatingFinalPath([]);
                    setFinalPath(pathCoords);
                    phaseRef.current = 'done';
                    finalizeRoute(pathCoords, result.exploredCount);
                  }
                }, Math.max(5, getDelay() / 2));
              }, 600);
            } else {
              setTimeout(runAnimatedLoop, getDelay());
            }
          };
          runAnimatedLoop();
        } else {
          // --- Instant mode (no animation) ---
          let result;
          while (true) {
            result = step();
            if (!result || result.done) break;
          }
          if (result && result.done) {
            setExploredEdges([...exploredEdgesAccum]);
            setFinalPath(result.path);
            phaseRef.current = 'done';
            finalizeRoute(result.path, result.exploredCount);
          }
        }


      } catch (err) {
        console.error("OSRM Fetch Failed", err);
        phaseRef.current = 'error';
        setGraphError("Routing API failed or timed out. Please check your connection.");
      }
    };

    runAlgorithm();
    
    return () => { 
      activeAlgorithm.current = false; 
    };
  }, [startPoint, destPoint, onComplete]);

  return (
    <>
      {graphError && (
        <div style={{ position: 'absolute', top: 120, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'rgba(239,68,68,0.9)', color: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '14px', fontWeight: 600 }}>
          {graphError}
        </div>
      )}

      {/* Explored edges during algorithm traversal — shown as thin red lines */}
      {exploredEdges.length > 0 && (
        <Polyline 
          positions={exploredEdges} 
          pathOptions={{ color: '#ef4444', weight: 3, opacity: 0.5 }}
        />
      )}

      {/* Animated drawing of the final shortest path */}
      {animatingFinalPath.length > 1 && (
        <Polyline 
          positions={animatingFinalPath} 
          pathOptions={{ color: '#ef4444', weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }}
        />
      )}

      {/* Final shortest path — persists on map */}
      {finalPath.length > 0 && (
        <Polyline 
          positions={finalPath} 
          pathOptions={{ color: '#ef4444', weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }}
        />
      )}
    </>
  );
};

export default DijkstraVisualizer;
