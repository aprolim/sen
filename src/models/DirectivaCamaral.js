// src/models/DirectivaCamaral.js
const mongoose = require('mongoose');

/**
 * Directiva Camaral del Senado.
 * Solo puede haber UNA directiva activa a la vez.
 *
 * Los 6 IDs referencian a senadores del modelo `Senador`
 * donde `tipo === 'titular'`. No se pueden seleccionar
 * senadores suplentes ni IDs inventados.
 */
const directivaCamaralSchema = new mongoose.Schema(
  {
    gestion: {
      type: String,
      required: [true, 'La gestión es requerida'],
      trim: true,
      default: '2025-2026'
    },

    // ============================================
    // 🔥 IDs DE LOS SENADORES (todos titulares)
    // ============================================
    presidenteId: {
      type: Number,
      required: [true, 'El presidente es requerido']
    },
    primeraViceId: {
      type: Number,
      required: [true, 'La primera vicepresidencia es requerida']
    },
    segundaViceId: {
      type: Number,
      required: [true, 'La segunda vicepresidencia es requerida']
    },
    primeraSecretariaId: {
      type: Number,
      required: [true, 'La primera secretaría es requerida']
    },
    segundaSecretariaId: {
      type: Number,
      required: [true, 'La segunda secretaría es requerida']
    },
    terceraSecretariaId: {
      type: Number,
      required: [true, 'La tercera secretaría es requerida']
    },

    // ============================================
    // CONTROL
    // ============================================
    activa: {
      type: Boolean,
      default: true,
      index: true
    },

    // ============================================
    // AUDITORÍA
    // ============================================
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    actualizadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Una sola directiva por gestión
directivaCamaralSchema.index({ gestion: 1 }, { unique: true });

// Solo una directiva activa a la vez
directivaCamaralSchema.pre('save', async function (next) {
  if (this.activa === true) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, activa: true },
      { $set: { activa: false } }
    );
  }
  next();
});

module.exports = mongoose.model('DirectivaCamaral', directivaCamaralSchema);