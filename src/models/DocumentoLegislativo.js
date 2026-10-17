// src/models/DocumentoLegislativo.js
const mongoose = require('mongoose');
const { TIPOS_DOCUMENTO, TIPOS_DESTINATARIO } = require('../config/tiposDocumento');

const documentoLegislativoSchema = new mongoose.Schema(
  {
    // ============================================
    // 🔑 CAMPOS COMUNES A TODOS
    // ============================================
    tipo: {
      type: String,
      required: [true, 'El tipo es requerido'],
      enum: Object.keys(TIPOS_DOCUMENTO),
      index: true
    },
    numero: {
      type: Number,
      required: [true, 'El número es requerido'],
      min: [1, 'El número debe ser mayor a 0']
    },
    codigo: {
      type: String,
      required: [true, 'El código es requerido'],
      trim: true,
      maxlength: [100, 'El código no puede exceder 100 caracteres']
    },
    fechaIngreso: {
      type: Date,
      required: [true, 'La fecha de ingreso es requerida']
    },
    peticionario: {
      type: String,
      required: [true, 'El peticionario/proyectista es requerido'],
      trim: true,
      maxlength: [300, 'El peticionario no puede exceder 300 caracteres']
    },
    asunto: {
      type: String,
      required: [true, 'El asunto es requerido'],
      trim: true,
      maxlength: [5000, 'El asunto no puede exceder 5000 caracteres']
    },

    // ============================================
    // 📤 DESTINATARIO Y FECHAS
    // ============================================
    destinatario: {
      type: String,
      trim: true,
      maxlength: [300, 'El destinatario no puede exceder 300 caracteres']
    },
    tipoDestinatario: {
      type: String,
      enum: [...TIPOS_DESTINATARIO, null]
    },
    fechaRemisionDestinatario: {
      type: Date,
      default: null
    },

    // ============================================
    // 📨 RESPUESTA (PIE / Minutas)
    // ============================================
    fechaRespuesta: {
      type: Date,
      default: null
    },
    fechaRemisionPeticionario: {
      type: Date,
      default: null
    },

    // ============================================
    // ⚠️ CONMINATORIA (solo PIE)
    // ============================================
    conminatoria: {
      type: String,
      trim: true,
      maxlength: [500, 'La conminatoria no puede exceder 500 caracteres']
    },

    // ============================================
    // 🎤 FECHAS DE REALIZACIÓN (solo PIO)
    // ============================================
    fechaRealizacion: {
      type: Date,
      default: null
    },
    fechaReprogramacion: {
      type: Date,
      default: null
    },
    fechaRealizacionFinal: {
      type: Date,
      default: null
    },

    // ============================================
    // 📝 APROBACIÓN Y SESIÓN (Gestión)
    // ============================================
    fechaAprobacion: {
      type: Date,
      default: null
    },
    sesion: {
      type: String,
      enum: ['PUBLICA', 'RESERVADA', null],
      default: null
    },

    // ============================================
    // 📝 OBSERVACIONES
    // ============================================
    observacion: {
      type: String,
      trim: true,
      maxlength: [1000, 'La observación no puede exceder 1000 caracteres']
    },

    // ============================================
    // 📄 ARCHIVO
    // ============================================
    archivo: {
      url: { type: String, default: null },
      filename: { type: String, default: '' },
      originalName: { type: String, default: '' },
      size: { type: Number, default: 0 }
    },

    // ============================================
    // 🔥 AUDITORÍA
    // ============================================
    activo: { type: Boolean, default: true, index: true },
    eliminado: { type: Boolean, default: false, index: true },
    eliminadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fechaEliminacion: { type: Date, default: null },
    motivoEliminacion: { type: String, trim: true, maxlength: 500, default: '' },
    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actualizadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

// ============================================
// ÍNDICES
// ============================================
documentoLegislativoSchema.index({ tipo: 1, eliminado: 1, numero: 1 });
documentoLegislativoSchema.index({ tipo: 1, codigo: 1, eliminado: 1 });
documentoLegislativoSchema.index({ tipo: 1, fechaIngreso: -1, eliminado: 1 });
documentoLegislativoSchema.index({
  asunto: 'text',
  peticionario: 'text',
  destinatario: 'text'
});

module.exports = mongoose.model('DocumentoLegislativo', documentoLegislativoSchema);