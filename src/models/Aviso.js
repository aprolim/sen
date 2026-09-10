// src/models/Aviso.js
const mongoose = require('mongoose');

const avisoSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxlength: [200, 'El título no puede exceder 200 caracteres']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true
  },
  tipo: {
    type: String,
    enum: ['Urgente', 'Importante', 'Informativo', 'Normal'],
    default: 'Normal'
  },
  fecha: {
    type: String,
    default: () => new Date().toLocaleDateString('es-ES')
  },
  tags: {
    type: [String],
    default: []
  },
  imagen: {
    type: String,
    default: null
  },
  pdf: {
    url: {
      type: String,
      default: null
    },
    name: {
      type: String,
      default: ''
    },
    size: {
      type: Number,
      default: 0
    }
  },
  // 🔥 ORIGEN: manual | comunicado
  origen: {
    type: String,
    enum: ['manual', 'comunicado'],
    default: 'manual'
  },
  // 🔥 Si viene de un comunicado, guardar su ID
  comunicadoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comunicado',
    default: null
  },
  // 🔥 Fecha de lanzamiento del comunicado original
  fechaLanzamiento: {
    type: Date,
    default: null
  },
  activo: {
    type: Boolean,
    default: true
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actualizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Índices
avisoSchema.index({ activo: 1 });
avisoSchema.index({ origen: 1 });
avisoSchema.index({ tipo: 1 });
avisoSchema.index({ createdAt: -1 });

const Aviso = mongoose.model('Aviso', avisoSchema);

module.exports = Aviso;