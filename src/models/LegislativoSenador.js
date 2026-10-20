// src/models/LegislativoSenador.js
const mongoose = require('mongoose');

/**
 * Senadores que se usan SOLO en el módulo de Legislación
 * (para los campos `peticionario` / `proyectista` de DocumentoLegislativo).
 *
 * Es una lista independiente del catálogo global `Senador`.
 * Solo guarda el nombre; puede haber comisiones especiales, senadores
 * reemplazados, etc. y no debe afectar al resto del portal.
 */
const legislativoSenadorSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
      maxlength: [300, 'El nombre no puede exceder 300 caracteres'],
      unique: true
    },
    activo: {
      type: Boolean,
      default: true,
      index: true
    },
    orden: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Índice para búsquedas por nombre
legislativoSenadorSchema.index({ nombre: 1 });
legislativoSenadorSchema.index({ activo: 1, orden: 1 });

module.exports = mongoose.model('LegislativoSenador', legislativoSenadorSchema);