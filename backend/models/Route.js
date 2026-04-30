const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  node: { type: String },
  distance: { type: Number },
}, { _id: false });

const routeSchema = new mongoose.Schema({
  startLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    label: { type: String }
  },
  destinationLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    label: { type: String }
  },
  stops: [{
    lat: { type: Number },
    lng: { type: Number },
    label: { type: String }
  }],
  distance: { type: Number, required: true },
  nodesExplored: { type: Number },
  path: [{
    lat: { type: Number },
    lng: { type: Number }
  }],
  algorithmSteps: [stepSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Route', routeSchema);
