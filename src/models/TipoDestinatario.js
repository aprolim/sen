// src/models/TipoDestinatario.js
const mongoose = require('mongoose');

/**
 * Catálogo editable de Tipos de Destinatario.
 * Se usa en los formularios de documentos legislativos
 * (Peticiones de Informe Escrito/Oral, Minutas de Comunicación, etc.).
 *
 * A diferencia de `TIPOS_DESTINATARIO` (hardcodeado en config), este catálogo
 * vive en la BD y puede crecer/editarse desde el CMS sin tocar código.
 */
const tipoDestinatarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
      maxlength: [150, 'El nombre no puede exceder 150 caracteres'],
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

tipoDestinatarioSchema.index({ nombre: 1 });
tipoDestinatarioSchema.index({ activo: 1, orden: 1 });

module.exports = mongoose.model('TipoDestinatario', tipoDestinatarioSchema);