// ============================================
// src/models/TabLink.js (MODIFICADO)
// ============================================
const mongoose = require('mongoose');

const tabLinkSchema = new mongoose.Schema({
  // CAMBIADO: tabId eliminado, ahora usamos categoryId
  categoryId: {
    type: String,
    ref: 'TabCategory',
    required: [true, 'El ID de la categoría es requerido'],
    index: true,
  },
  
  // Estos campos se mantienen igual
  areaTitulo: {
    type: String,
    required: [true, 'El título del área es requerido'],
  },
  areaDescripcion: {
    type: String,
    required: [true, 'La descripción del área es requerida'],
  },

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
  orden: {
    type: Number,
    default: 0,
  },
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

// Índices actualizados
tabLinkSchema.index({ categoryId: 1, isActive: 1 });
tabLinkSchema.index({ categoryId: 1, orden: 1 });

const TabLink = mongoose.model('TabLink', tabLinkSchema);

module.exports = TabLink;