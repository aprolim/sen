// src/models/Comunicado.js
const mongoose = require('mongoose');

const comunicadoSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxlength: [200, 'El título no puede exceder 200 caracteres']
  },
  contenido: {
    type: String,
    required: [true, 'El contenido es requerido'],
    trim: true
  },
  imagen: {
    url: {
      type: String,
      required: [true, 'La imagen es requerida']
    },
    alt: {
      type: String,
      default: 'Comunicado oficial'
    },
    name: {
      type: String,
      default: ''
    }
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
  // 🔥 ESTADOS: programado | activo | inactivo
  estado: {
    type: String,
    enum: ['programado', 'activo', 'inactivo'],
    default: 'programado'
  },
  // 🔥 FECHAS DE PROGRAMACIÓN
  // - Programado: ambas requeridas, activación futura
  // - Activo: activación = ahora o pasada, desactivación OPCIONAL
  // - Inactivo: sin fechas requeridas
  fechaActivacion: {
    type: Date,
    default: null
  },
  fechaDesactivacion: {
    type: Date,
    default: null
  },
  // 🔥 FECHAS DE REGISTRO
  activadoEn: {
    type: Date,
    default: null
  },
  desactivadoEn: {
    type: Date,
    default: null
  },
  // 🔥 FECHA DE LANZAMIENTO (para mostrar en avisos)
  fechaLanzamiento: {
    type: Date,
    default: Date.now
  },
  prioridad: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
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

// ============================================
// Índices
// ============================================
comunicadoSchema.index({ estado: 1 });
comunicadoSchema.index({ fechaActivacion: 1, fechaDesactivacion: 1 });
comunicadoSchema.index({ prioridad: -1 });
comunicadoSchema.index({ fechaLanzamiento: -1 });

// ============================================
// Middleware pre-save: Validaciones de negocio
// ============================================
comunicadoSchema.pre('save', function(next) {
  const ahora = new Date();

  // 1. Validar coherencia de fechas si ambas existen
  if (this.fechaActivacion && this.fechaDesactivacion) {
    if (this.fechaActivacion >= this.fechaDesactivacion) {
      return next(new Error('La fecha de activación debe ser anterior a la fecha de desactivación'));
    }
  }

  // 2. Validaciones según estado
  if (this.estado === 'programado') {
    if (!this.fechaActivacion || !this.fechaDesactivacion) {
      return next(new Error('Un comunicado programado requiere ambas fechas'));
    }
  }

  // 3. Auto-registrar fecha de activación
  if (this.estado === 'activo' && !this.activadoEn) {
    this.activadoEn = ahora;
  }

  // 4. Auto-registrar fecha de desactivación
  if (this.estado === 'inactivo' && !this.desactivadoEn) {
    this.desactivadoEn = ahora;
  }

  next();
});

// ============================================
// Método: Actualizar estado automáticamente
// ============================================
comunicadoSchema.methods.actualizarEstado = function() {
  const ahora = new Date();
  let cambio = false;

  // Programado → Activo (cuando llega la fecha de activación)
  if (this.estado === 'programado' && this.fechaActivacion && this.fechaActivacion <= ahora) {
    this.estado = 'activo';
    this.activadoEn = ahora;
    cambio = true;
  }

  // Activo → Inactivo (SOLO si tiene fecha de desactivación)
  if (this.estado === 'activo' && this.fechaDesactivacion && this.fechaDesactivacion <= ahora) {
    this.estado = 'inactivo';
    this.desactivadoEn = ahora;
    cambio = true;
  }

  return cambio;
};

// ============================================
// Método: Verificar si está activo actualmente
// ============================================
comunicadoSchema.methods.estaActivo = function() {
  if (this.estado !== 'activo') return false;

  const ahora = new Date();

  if (this.fechaActivacion && this.fechaActivacion > ahora) return false;
  if (this.fechaDesactivacion && this.fechaDesactivacion < ahora) return false;

  return true;
};

// ============================================
// Método: Verificar si es un comunicado expirado
// ============================================
comunicadoSchema.methods.estaExpirado = function() {
  if (this.estado !== 'inactivo') return false;
  if (!this.fechaDesactivacion) return false;
  return this.fechaDesactivacion <= new Date();
};

const Comunicado = mongoose.model('Comunicado', comunicadoSchema);

module.exports = Comunicado;