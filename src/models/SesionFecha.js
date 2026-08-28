// src/models/SesionFecha.js
const mongoose = require('mongoose');

const sesionFechaSchema = new mongoose.Schema({
  fecha: {
    type: Date,
    required: true,
    index: true,
    unique: true
  },
  titulo: {
    type: String,
    trim: true,
    default: 'Sesión del Senado'
  },
  descripcion: {
    type: String,
    trim: true
  },
  tipo: {
    type: String,
    enum: ['ordinaria', 'extraordinaria', 'especial'],
    default: 'ordinaria'
  },
  esActivo: {
    type: Boolean,
    default: true
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

// Índices para búsquedas rápidas
sesionFechaSchema.index({ fecha: 1 });
sesionFechaSchema.index({ esActivo: 1 });
sesionFechaSchema.index({ fecha: 1, esActivo: 1 });

module.exports = mongoose.model('SesionFecha', sesionFechaSchema);