// src/models/SesionesVideo.js
const mongoose = require('mongoose');

const sesionesVideoSchema = new mongoose.Schema({
  position: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4],
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  youtubeId: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isLive: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SesionesVideo', sesionesVideoSchema);