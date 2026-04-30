const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Route = require('./models/Route');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// We'll use an in-memory fallback if Mongo isn't running so the app doesn't crash
let memoryRoutes = [];

mongoose.connect('mongodb://127.0.0.1:27017/smart-routes')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error. Falling back to memory storage.'));

app.post('/api/routes/save', async (req, res) => {
  try {
    const routeData = req.body;
    
    // Attempt to save to Mongo
    if (mongoose.connection.readyState === 1) {
      const newRoute = new Route(routeData);
      await newRoute.save();
      return res.status(201).json({ success: true, data: newRoute });
    } else {
      // Memory fallback
      routeData.id = Date.now();
      memoryRoutes.push(routeData);
      return res.status(201).json({ success: true, data: routeData, memory: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

app.get('/api/routes', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const routes = await Route.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: routes });
    } else {
      return res.status(200).json({ success: true, data: memoryRoutes, memory: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
