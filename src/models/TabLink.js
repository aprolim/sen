// src/models/TabLink.js
const mongoose = require('mongoose');

const tabLinkSchema = new mongoose.Schema({
  // Identificación
  tabId: {
    type: String,
    enum: ['legislacion', 'fiscalizacion', 'gestion'],
    required: [true, 'El ID de la pestaña (tabId) es requerido'],
    index: true,
  },
  areaTitulo: {
    type: String,
    required: [true, 'El título del área es requerido'],
  },
  areaDescripcion: {
    type: String,
    required: [true, 'La descripción del área es requerida'],
  },

  // Información del Link
  linkId: {
    type: String,
    required: [true, 'El ID único del link es requerido'],
    unique: true,
    trim: true,
  },
  titulo: {
    type: String,
    required: [true, 'El título del link es requerido'],
    trim: true,
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción del link es requerida'],
    trim: true,
  },
  icono: {
    type: String,
    required: [true, 'El SVG del icono es requerido'],
  },
  path: {
    type: String,
    required: [true, 'La ruta (path) del link es requerida'],
    trim: true,
  },

  // Orden para la UI
  orden: {
    type: Number,
    default: 0,
  },

  // Metadata del sistema
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Índices para búsquedas eficientes
tabLinkSchema.index({ tabId: 1, isActive: 1 });
tabLinkSchema.index({ tabId: 1, orden: 1 });

const TabLink = mongoose.model('TabLink', tabLinkSchema);

module.exports = TabLink;