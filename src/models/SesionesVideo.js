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
    required: true,
    // Validación de seguridad: 
    // Si la expresión regular falla por alguna razón, esto impedirá
    // que se guarde un string vacío en la base de datos.
    validate: {
      validator: function(v) {
        return v && v.length >= 10; 
      },
      message: 'El formato de la URL de YouTube no es válido o no se pudo extraer el ID.'
    }
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