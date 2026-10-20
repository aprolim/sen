// src/models/LegislativoComision.js
const mongoose = require('mongoose');

/**
 * Comisiones que se usan SOLO en el módulo de Legislación
 * (para los campos `comisionI` y `comisionII` de DocumentoLegislativo).
 *
 * Es una lista independiente del catálogo global `Comision`.
 * Incluye las comisiones especiales que van rotando y solo se usan
 * en esta parte del sistema.
 */
const legislativoComisionSchema = new mongoose.Schema(
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

legislativoComisionSchema.index({ nombre: 1 });
legislativoComisionSchema.index({ activo: 1, orden: 1 });

module.exports = mongoose.model('LegislativoComision', legislativoComisionSchema);