// src/models/DocumentoLegislativo.js
const mongoose = require('mongoose');
const { TIPOS_DOCUMENTO } = require('../config/tiposDocumento');

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
      maxlength: [150, 'El código no puede exceder 150 caracteres']
    },
    fechaIngreso: {
      type: Date,
      required: [true, 'La fecha de ingreso es requerida']
    },
    peticionario: {
      type: [String],
      required: [true, 'El peticionario/proyectista es requerido'],
      default: []
    },
    asunto: {
      type: String,
      required: [true, 'El asunto es requerido'],
      trim: true,
      maxlength: [5000, 'El asunto no puede exceder 5000 caracteres']
    },

    // ============================================
    // 📤 DESTINATARIO Y FECHAS (Fiscalización / Minutas)
    // ============================================
    destinatario: {
      type: String,
      trim: true,
      maxlength: [300, 'El destinatario no puede exceder 300 caracteres']
    },
    tipoDestinatario: {
      type: String,
      trim: true,
      maxlength: [150, 'El tipo de destinatario no puede exceder 150 caracteres'],
      default: null
    },
    fechaRemisionDestinatario: { type: Date, default: null },
    fechaRespuesta: { type: Date, default: null },
    fechaRemisionPeticionario: { type: Date, default: null },
    conminatoria: {
      type: String,
      trim: true,
      maxlength: [500, 'La conminatoria no puede exceder 500 caracteres']
    },

    // ============================================
    // 🎤 FECHAS DE REALIZACIÓN (PIO)
    // ============================================
    fechaRealizacion: { type: Date, default: null },
    fechaReprogramacion: { type: Date, default: null },
    fechaRealizacionFinal: { type: Date, default: null },

    // ============================================
    // 📋 APROBACIÓN Y SESIÓN (Gestión)
    // ============================================
    fechaAprobacion: { type: Date, default: null },
    sesion: {
      type: String,
      enum: ['PUBLICA', 'RESERVADA', null],
      default: null
    },

    // ============================================
    // ⚖️ PROYECTOS DE LEY
    // ============================================
    esNuevoOReReposicion: { type: String, trim: true },
    plAnterior: { type: String, trim: true },
    comisionI: {
      type: [String],
      default: []
    },
    fechaRemisionComisionI: { type: Date, default: null },
    comisionII: {
      type: [String],
      default: []
    },
    fechaRemisionComisionII: { type: Date, default: null },
    estadoLey: { type: String, trim: true },
    fechaRemisionDiputados: { type: Date, default: null },
    fechaSancion: { type: Date, default: null },
    fechaRemisionEjecutivo: { type: Date, default: null },

    fechaRechazo: { type: Date, default: null },
    numeroLey: { type: Number, default: null },

    // ============================================
    // 📎 OBSERVACIONES Y ARCHIVOS
    // ============================================
    observacion: {
      type: String,
      trim: true,
      maxlength: [1000, 'La observación no puede exceder 1000 caracteres']
    },
    archivo: {
      url: { type: String, default: null },
      filename: { type: String, default: '' },
      originalName: { type: String, default: '' },
      size: { type: Number, default: 0 }
    },
    archivoAnexo: [
      {
        url: { type: String, default: null },
        filename: { type: String, default: '' },
        originalName: { type: String, default: '' },
        size: { type: Number, default: 0 }
      }
    ],

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

// 🔥 CAMBIO: Unicidad de `numero` por tipo, PERO exceptuando `proyecto-ley-rechazados`.
// En rechazados el número puede repetirse (porque los rechazados pueden compartir
// número con otros tipos, o incluso repetirse entre sí).
documentoLegislativoSchema.index(
  { tipo: 1, numero: 1 },
  {
    unique: true,
    partialFilterExpression: {
      tipo: { $ne: 'proyecto-ley-rechazados' }
    },
    name: 'tipo_numero_unique_excepto_rechazados'
  }
);

// Unicidad de numeroLey (global, parcial: solo cuando es número)
documentoLegislativoSchema.index(
  { numeroLey: 1 },
  {
    unique: true,
    partialFilterExpression: { numeroLey: { $type: 'number' } },
    name: 'numeroLey_unique_partial'
  }
);

module.exports = mongoose.model('DocumentoLegislativo', documentoLegislativoSchema);