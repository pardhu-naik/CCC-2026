# Smart Route Finder (CCC-2026)

A real-time pathfinding visualizer built with the MERN stack and Dijkstra's algorithm.

## Overview
Smart Route Finder is an interactive web application that visualizes how Dijkstra's algorithm finds the shortest path between two points on a real-world map. It uses road network data from the Open Source Routing Machine (OSRM) and renders it using Leaflet.

## Features
- **Interactive Map:** Pick start and destination points anywhere on the map.
- **Algorithm Visualization:** Watch as the algorithm explores nodes and edges in real-time.
- **Customizable Speed:** Adjust the animation speed to see the search process clearly.
- **Route Persistence:** Saves calculated routes to a MongoDB database for history.
- **Modern UI:** Built with React 19, Framer Motion, and Lucide React.

## Tech Stack
- **Frontend:** React, Leaflet, Framer Motion, Axios, Lucide
- **Backend:** Node.js, Express
- **Database:** MongoDB (with in-memory fallback)
- **Routing Engine:** OSRM (Open Source Routing Machine)

## Getting Started
1. **Backend:**
   ```bash
   cd backend
   npm install
   node server.js
   ```
2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Team
- B. Pardhu Naik
- B. Praveen Kumar
- L. Suryateja
- I. Bhavani Shankar
