// src/models/Senador.js
const mongoose = require('mongoose');

const senadorSchema = new mongoose.Schema({
  // ============================================
  // DATOS PRINCIPALES (igual que senadores.js)
  // ============================================
  id: {
    type: Number,
    unique: true,
    required: true
  },
  seatNumber: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  tipo: {
    type: String,
    enum: ['titular', 'suplente'],
    default: 'titular'
  },
  titular: {
    type: String,
    trim: true
  },
  
  // ============================================
  // INFORMACIÓN POLÍTICA
  // ============================================
  party: {
    type: String,
    required: true,
    trim: true
  },
  partyShort: {
    type: String,
    trim: true
  },
  partyColor: {
    type: String,
    default: '#2E7078'
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  foto: {
    type: String,
    default: ''
  },
  
  // ============================================
  // COMISIONES Y COMITÉS
  // ============================================
  comision: {
    type: String,
    trim: true
  },
  comite: {
    type: String,
    trim: true
  },
  cargo: {
    type: String,
    trim: true
  },
  
  // ============================================
  // INFORMACIÓN PERSONAL
  // ============================================
  fechaNacimiento: {
    type: String,
    trim: true
  },
  nacidoEn: {
    type: String,
    trim: true
  },
  ocupacion: {
    type: String,
    trim: true
  },
  distritos: {
    type: [String],
    default: []
  },
  
  // ============================================
  // REDES SOCIALES (TITULAR)
  // ============================================
  facebook: {
    type: String,
    trim: true
  },
  twitter: {
    type: String,
    trim: true
  },
  instagram: {
    type: String,
    trim: true
  },
  youtube: {
    type: String,
    trim: true
  },
  tiktok: {
    type: String,
    trim: true
  },
  
  // ============================================
  // SUPLENTE
  // ============================================
  suplente: {
    type: String,
    trim: true
  },
  slugSuplente: {
    type: String,
    trim: true
  },
  fotoSuplente: {
    type: String,
    default: ''
  },
  fechaNacimientoSuplente: {
    type: String,
    trim: true
  },
  nacidoEnSuplente: {
    type: String,
    trim: true
  },
  ocupacionSuplente: {
    type: String,
    trim: true
  },
  comiteSuplente: {
    type: String,
    trim: true
  },
  cargoSuplente: {
    type: String,
    trim: true
  },
  
  // ============================================
  // REDES SOCIALES (SUPLENTE)
  // ============================================
  facebookSuplente: {
    type: String,
    trim: true
  },
  twitterSuplente: {
    type: String,
    trim: true
  },
  instagramSuplente: {
    type: String,
    trim: true
  },
  youtubeSuplente: {
    type: String,
    trim: true
  },
  tiktokSuplente: {
    type: String,
    trim: true
  },
  
  // ============================================
  // ESTADO
  // ============================================
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'suspendido', 'licencia'],
    default: 'activo'
  }
}, {
  timestamps: true
});

// ============================================
// ÍNDICES
// ============================================
senadorSchema.index({ id: 1 }, { unique: true });
senadorSchema.index({ slug: 1 }, { unique: true });
senadorSchema.index({ name: 'text' });
senadorSchema.index({ party: 1, department: 1 });
senadorSchema.index({ tipo: 1 });

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================
senadorSchema.statics.findByIdNumber = function(id) {
  return this.findOne({ id: id });
};

senadorSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug: slug });
};

senadorSchema.statics.getTitulares = function() {
  return this.find({ tipo: 'titular' }).sort({ seatNumber: 1 });
};

senadorSchema.statics.getSuplentes = function() {
  return this.find({ tipo: 'suplente' }).sort({ seatNumber: 1 });
};

senadorSchema.statics.getByDepartment = function(department) {
  return this.find({ department: department });
};

// ============================================
// MÉTODOS DE INSTANCIA
// ============================================
senadorSchema.methods.getFullName = function() {
  return this.name;
};

senadorSchema.methods.getPartyInfo = function() {
  return {
    name: this.party,
    short: this.partyShort,
    color: this.partyColor
  };
};

const Senador = mongoose.model('Senador', senadorSchema);

module.exports = Senador;
