// src/models/Comision.js
const mongoose = require('mongoose');

const comisionSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  presidenteId: {
    type: Number,
    required: true
  },
  comites: [{
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    secretarioId: {
      type: Number,
      required: true
    }
  }]
}, {
  timestamps: true
});

comisionSchema.index({ nombre: 'text' });
comisionSchema.index({ 'comites.nombre': 'text' });

const Comision = mongoose.model('Comision', comisionSchema);

module.exports = Comision;