// src/models/AuditoriaCategoria.js
const mongoose = require('mongoose');

/**
 * Categorías/tabs de cada módulo de auditoría.
 * Cada módulo tiene SUS PROPIAS categorías (aisladas por campo `modulo`).
 */
const auditoriaCategoriaSchema = new mongoose.Schema({
  modulo: {
    type: String,
    required: true,
    enum: ['auditorias-ejecutadas', 'informes-actividades', 'otras-actividades'],
    index: true
  },
  key: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Key inválido. Use solo letras minúsculas, números y guiones']
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  icono: {
    type: String,
    default: 'mdi:file-document',
    trim: true
  },
  orden: {
    type: Number,
    default: 0
  },
  activo: {
    type: Boolean,
    default: true,
    index: true
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

// Un mismo `key` no puede repetirse dentro del MISMO módulo
// pero SÍ puede existir en módulos diferentes
auditoriaCategoriaSchema.index({ modulo: 1, key: 1 }, { unique: true });
auditoriaCategoriaSchema.index({ modulo: 1, orden: 1 });

module.exports = mongoose.model('AuditoriaCategoria', auditoriaCategoriaSchema);