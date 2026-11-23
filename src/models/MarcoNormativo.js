// src/models/MarcoNormativo.js
const mongoose = require('mongoose');

/**
 * Modelo independiente para el módulo "Marco Normativo".
 *
 * ¿Por qué un modelo aparte y no DocumentoLegislativo?
 * ----------------------------------------------------
 * El Marco Normativo venía cargado dentro de `DocumentoLegislativo` usando
 * el tipo `proyecto-ley-aprobados`, el mismo tipo que los proyectos de ley
 * reales. Eso hacía que el acordeón mostrara proyectos de ley y el listado
 * se mezclara con contenido que no correspondía.
 *
 * Este modelo guarda SOLO normativa interna de la Cámara (reglamentos,
 * manuales, códigos, etc.) y no interfiere con DocumentoLegislativo.
 *
 * Estructura de presentación (la vista pública del módulo):
 *   - `destacado: true`  → tarjetas superiores (máx. 6, requieren imagen)
 *   - `categoria`        → agrupación del acordeón (p. ej. "Normativa Administrativa")
 */
const marcoNormativoSchema = new mongoose.Schema(
  {
    // ============================================
    // 📄 CONTENIDO
    // ============================================
    nombre: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
      maxlength: [300, 'El nombre no puede exceder 300 caracteres']
    },
    codigo: {
      type: String,
      trim: true,
      maxlength: [200, 'El código no puede exceder 200 caracteres'],
      default: ''
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [2000, 'La descripción no puede exceder 2000 caracteres'],
      default: ''
    },
    gestion: {
      type: Number,
      default: null
    },
    fechaDocumento: {
      type: Date,
      default: null
    },

    // ============================================
    // 🗂️ CLASIFICACIÓN
    // ============================================
    // Nombre de la categoría del acordeón.
    // Null = no aparece en el acordeón.
    categoria: {
      type: String,
      trim: true,
      maxlength: [150, 'La categoría no puede exceder 150 caracteres'],
      default: null,
      index: true
    },
    // Si true, se muestra en las tarjetas destacadas superiores.
    destacado: {
      type: Boolean,
      default: false,
      index: true
    },
    orden: {
      type: Number,
      default: 0
    },

    // ============================================
    // 📎 ARCHIVOS
    // ============================================
    archivo: {
      url: { type: String, default: null },
      filename: { type: String, default: '' },
      originalName: { type: String, default: '' },
      size: { type: Number, default: 0 }
    },
    imagen: {
      type: String,
      trim: true,
      default: null
    },

    // ============================================
    // 🔥 AUDITORÍA
    // ============================================
    activo: { type: Boolean, default: true, index: true },
    eliminado: { type: Boolean, default: false, index: true },
    eliminadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fechaEliminacion: { type: Date, default: null },
    motivoEliminacion: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    actualizadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// ============================================
// ÍNDICES
// ============================================
marcoNormativoSchema.index({ activo: 1, eliminado: 1, destacado: 1, orden: 1 });
marcoNormativoSchema.index({ activo: 1, eliminado: 1, categoria: 1, orden: 1 });

module.exports = mongoose.model('MarcoNormativo', marcoNormativoSchema);
