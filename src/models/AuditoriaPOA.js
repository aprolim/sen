// src/models/AuditoriaPOA.js
const mongoose = require('mongoose');

/**
 * POA-UAI: Plan Operativo Anual de la Unidad de Auditoría Interna
 * Cada POA corresponde a un año y tiene su PDF asociado.
 */
const auditoriaPOASchema = new mongoose.Schema({
  anio: {
    type: Number,
    required: [true, 'El año es requerido'],
    unique: true,
    index: true,
    min: [2000, 'El año debe ser mayor a 2000'],
    max: [2100, 'El año debe ser menor a 2100']
  },
  titulo: {
    type: String,
    required: true,
    trim: true,
    maxlength: [255, 'El título no puede exceder 255 caracteres']
  },
  fecha: {
    type: String,
    trim: true,
    default: ''
  },
  estado: {
    type: String,
    enum: ['Publicado', 'En Revisión', 'Borrador'],
    default: 'Publicado'
  },
  activo: {
    type: Boolean,
    default: false,
    index: true
  },
  pdfUrl: {
    type: String,
    trim: true,
    default: null
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  actualizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

/**
 * Solo un POA puede estar activo a la vez.
 * Al marcar uno como activo, desmarcamos los demás automáticamente.
 */
auditoriaPOASchema.pre('save', async function(next) {
  if (this.isModified('activo') && this.activo === true) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, activo: true },
      { $set: { activo: false } }
    );
  }
  next();
});

auditoriaPOASchema.index({ anio: -1 });
auditoriaPOASchema.index({ estado: 1, activo: 1 });

module.exports = mongoose.model('AuditoriaPOA', auditoriaPOASchema);