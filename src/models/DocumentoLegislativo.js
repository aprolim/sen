// src/models/DocumentoLegislativo.js
const mongoose = require('mongoose');
const { TIPOS_DOCUMENTO, TIPOS_DESTINATARIO } = require('../config/tiposDocumento');

/**
 * Modelo único para todos los documentos legislativos (Fiscalización,
 * Gestión, Legislación). Los campos comunes van al principio; los
 * específicos por tipo son opcionales y solo se usan cuando aplica.
 *
 * Tipos activos actualmente:
 *   - peticion-informe-escrito
 *   - peticion-informe-oral
 */
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

    // 🔥 El número lo ingresa el usuario a mano y NO se puede modificar
    // después de crear el documento.
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

    // Peticionario (PIE/PIO) o Proyectista (Gestión/Legislación).
    // Es texto libre para que se pueda escribir tal como aparece en el
    // documento oficial: "Betty Canaviri Villanueva (LISTA DE SENADORES)".
    peticionario: {
      type: String,
      required: [true, 'El peticionario es requerido'],
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
    // 📤 DESTINATARIO (Fiscalización + Minutas)
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
    // 📨 RESPUESTA / REMISIÓN AL PETICIONARIO (PIE)
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
    // 📝 OBSERVACIONES (todos)
    // ============================================
    observacion: {
      type: String,
      trim: true,
      maxlength: [1000, 'La observación no puede exceder 1000 caracteres']
    },

    // ============================================
    // 📄 ARCHIVO PDF
    // ============================================
    archivo: {
      url: { type: String, default: null },
      filename: { type: String, default: '' },
      originalName: { type: String, default: '' },
      size: { type: Number, default: 0 }
    },

    // ============================================
    // 🔥 AUDITORÍA - Soft Delete
    // ============================================
    // activo: permite "pausar" un documento sin eliminarlo
    activo: {
      type: Boolean,
      default: true,
      index: true
    },

    // eliminado: soft delete. El registro NUNCA se borra físicamente.
    // Se oculta de las vistas normales pero queda para auditoría.
    eliminado: {
      type: Boolean,
      default: false,
      index: true
    },

    eliminadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    fechaEliminacion: {
      type: Date,
      default: null
    },

    motivoEliminacion: {
      type: String,
      trim: true,
      maxlength: [500, 'El motivo no puede exceder 500 caracteres'],
      default: ''
    },

    // ============================================
    // 👤 AUDITORÍA GENERAL
    // ============================================
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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

// ============================================
// ÍNDICES
// ============================================
// Búsqueda rápida por tipo + no eliminados + ordenados por número
documentoLegislativoSchema.index({ tipo: 1, eliminado: 1, numero: 1 });

// Búsqueda por código dentro de un tipo
documentoLegislativoSchema.index({ tipo: 1, codigo: 1, eliminado: 1 });

// Búsqueda por fecha de ingreso (para filtros por gestión)
documentoLegislativoSchema.index({ tipo: 1, fechaIngreso: -1, eliminado: 1 });

// Búsqueda de texto completo en asunto, peticionario y destinatario
documentoLegislativoSchema.index({
  asunto: 'text',
  peticionario: 'text',
  destinatario: 'text'
});

module.exports = mongoose.model('DocumentoLegislativo', documentoLegislativoSchema);