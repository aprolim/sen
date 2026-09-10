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
    default: 'inactivo'
  },
  // 🔥 FECHAS DE PROGRAMACIÓN
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

// Índices
comunicadoSchema.index({ estado: 1 });
comunicadoSchema.index({ fechaActivacion: 1, fechaDesactivacion: 1 });
comunicadoSchema.index({ prioridad: -1 });
comunicadoSchema.index({ fechaLanzamiento: -1 });

// Middleware para validar fechas
comunicadoSchema.pre('save', function(next) {
  // Si tiene fecha de activación y desactivación, validar que activación sea antes
  if (this.fechaActivacion && this.fechaDesactivacion) {
    if (this.fechaActivacion > this.fechaDesactivacion) {
      return next(new Error('La fecha de activación debe ser anterior a la fecha de desactivación'));
    }
  }
  
  // Si se está activando, guardar fecha
  if (this.estado === 'activo' && !this.activadoEn) {
    this.activadoEn = new Date();
  }
  
  // Si se está desactivando, guardar fecha
  if (this.estado === 'inactivo' && !this.desactivadoEn) {
    this.desactivadoEn = new Date();
  }
  
  next();
});

// 🔥 MÉTODO: Actualizar estado automáticamente
comunicadoSchema.methods.actualizarEstado = function() {
  const ahora = new Date();
  let cambio = false;
  
  // Si está programado y ya pasó la fecha de activación → activar
  if (this.estado === 'programado' && this.fechaActivacion && this.fechaActivacion <= ahora) {
    this.estado = 'activo';
    this.activadoEn = ahora;
    cambio = true;
  }
  
  // Si está activo y pasó la fecha de desactivación → inactivar
  if (this.estado === 'activo' && this.fechaDesactivacion && this.fechaDesactivacion <= ahora) {
    this.estado = 'inactivo';
    this.desactivadoEn = ahora;
    cambio = true;
  }
  
  return cambio;
};

// 🔥 MÉTODO: Verificar si está activo actualmente
comunicadoSchema.methods.estaActivo = function() {
  if (this.estado !== 'activo') return false;
  
  const ahora = new Date();
  
  if (this.fechaActivacion && this.fechaActivacion > ahora) return false;
  if (this.fechaDesactivacion && this.fechaDesactivacion < ahora) return false;
  
  return true;
};

// 🔥 MÉTODO: Verificar si es un comunicado expirado (para pasar a avisos)
comunicadoSchema.methods.estaExpirado = function() {
  if (this.estado !== 'inactivo') return false;
  if (!this.fechaDesactivacion) return false;
  return this.fechaDesactivacion <= new Date();
};

const Comunicado = mongoose.model('Comunicado', comunicadoSchema);

module.exports = Comunicado;