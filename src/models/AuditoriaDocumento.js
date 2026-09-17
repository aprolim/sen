// src/models/AuditoriaDocumento.js
const mongoose = require('mongoose');

/**
 * Documentos de auditoría (PDFs) asociados a una categoría de un módulo.
 */
const auditoriaDocumentoSchema = new mongoose.Schema({
  modulo: {
    type: String,
    required: true,
    enum: ['auditorias-ejecutadas', 'informes-actividades', 'otras-actividades'],
    index: true
  },
  categoria: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
    // FK lógica a AuditoriaCategoria.key (dentro del mismo módulo)
  },
  titulo: {
    type: String,
    required: true,
    trim: true,
    maxlength: [255, 'El título no puede exceder 255 caracteres']
  },
  descripcion: {
    type: String,
    trim: true,
    default: ''
  },
  gestion: {
    type: Number,
    required: true,
    index: true
  },
  url: {
    type: String,
    trim: true,
    default: null
  },
  estado: {
    type: String,
    enum: ['Publicado', 'En Revisión', 'Borrador'],
    default: 'Publicado'
  },
  activo: {
    type: Boolean,
    default: true,
    index: true
  },
  orden: {
    type: Number,
    default: 0
  },
  // 🔥 Marca para saber si el PDF ya fue migrado al backend
  migrado: {
    type: Boolean,
    default: false,
    index: true
  },
  // 🔥 URL original (para auditoría de migración)
  urlOriginal: {
    type: String,
    default: null
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  actualizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

auditoriaDocumentoSchema.index({ modulo: 1, categoria: 1, gestion: -1 });
auditoriaDocumentoSchema.index({ modulo: 1, activo: 1 });

module.exports = mongoose.model('AuditoriaDocumento', auditoriaDocumentoSchema);