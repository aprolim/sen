const mongoose = require('mongoose');

const legisladorSchema = new mongoose.Schema({
  // Información personal
  nombres: {
    type: String,
    required: [true, 'Los nombres son requeridos'],
    trim: true,
  },
  apellidos: {
    type: String,
    required: [true, 'Los apellidos son requeridos'],
    trim: true,
  },
  nombreCompleto: {
    type: String,
    trim: true,
  },
  ci: {
    type: String,
    required: [true, 'La cédula de identidad es requerida'],
    unique: true,
    trim: true,
  },
  fechaNacimiento: {
    type: Date,
  },
  lugarNacimiento: {
    ciudad: String,
    departamento: String,
    provincia: String,
  },
  
  // Información profesional
  tituloAcademico: [{
    titulo: String,
    institucion: String,
    año: Number,
  }],
  profesion: String,
  experienciaLaboral: [{
    cargo: String,
    institucion: String,
    periodo: String,
    descripcion: String,
  }],
  
  // Información política
  partidoPolitico: {
    type: String,
    required: [true, 'El partido político es requerido'],
  },
  bancada: String,
  cargoActual: {
    type: String,
    enum: [
      'Presidente',
      'Vicepresidente', 
      'Senador',
      'Senadora',
      'Secretario',
      'Pro-Secretario'
    ],
    default: 'Senador',
  },
  distrito: {
    departamento: String,
    provincia: String,
    municipio: String,
    circunscripcion: String,
  },
  
  // Periodo legislativo
  periodo: {
    inicio: {
      type: Date,
      required: true,
    },
    fin: {
      type: Date,
      required: true,
    },
  },
  reelecciones: {
    type: Number,
    default: 0,
  },
  
  // Comisiones y comités
  comisiones: [{
    nombre: String,
    cargo: {
      type: String,
      enum: ['Presidente', 'Vicepresidente', 'Secretario', 'Miembro'],
      default: 'Miembro',
    },
    periodo: String,
  }],
  comites: [{
    nombre: String,
    cargo: String,
    periodo: String,
  }],
  brigadasParlamentarias: [String],
  
  // Contacto
  contacto: {
    email: {
      type: String,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Por favor ingrese un email válido'],
    },
    telefono: {
      oficina: String,
      celular: String,
    },
    direccionOficina: {
      edificio: String,
      oficina: String,
      piso: String,
    },
    redesSociales: {
      twitter: String,
      facebook: String,
      instagram: String,
      linkedin: String,
    },
  },
  
  // Biografía y declaraciones
  biografia: String,
  declaracionJurada: {
    url: String,
    fecha: Date,
    vigente: Boolean,
  },
  principios: [String],
  
  // Multimedia
  fotoPerfil: {
    url: String,
    alt: String,
  },
  galeria: [{
    url: String,
    descripcion: String,
    fecha: Date,
    tipo: {
      type: String,
      enum: ['actividad', 'sesion', 'evento', 'personal'],
    },
  }],
  videos: [{
    titulo: String,
    url: String,
    plataforma: {
      type: String,
      enum: ['youtube', 'vimeo', 'facebook'],
    },
    descripcion: String,
  }],
  
  // Proyectos y participación
  proyectosPresentados: {
    type: Number,
    default: 0,
  },
  proyectosAprobados: {
    type: Number,
    default: 0,
  },
  asistenciaSesiones: {
    type: Number,
    default: 0,
  },
  porcentajeAsistencia: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  
  // Estado
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'suspendido', 'licencia'],
    default: 'activo',
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // Campos calculados
  edad: {
    type: Number,
    min: 25,
  },
  añosServicio: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Índices
legisladorSchema.index({ ci: 1 }, { unique: true });
legisladorSchema.index({ nombres: 'text', apellidos: 'text', nombreCompleto: 'text' });
legisladorSchema.index({ partidoPolitico: 1, bancada: 1 });
legisladorSchema.index({ 'distrito.departamento': 1, 'distrito.provincia': 1 });
legisladorSchema.index({ estado: 1, cargoActual: 1 });
legisladorSchema.index({ periodo: 1 });

// Middleware para generar nombre completo
legisladorSchema.pre('save', function(next) {
  this.nombreCompleto = `${this.nombres} ${this.apellidos}`.trim();
  
  // Calcular edad si hay fecha de nacimiento
  if (this.fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(this.fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    this.edad = edad;
  }
  
  // Calcular años de servicio
  if (this.periodo && this.periodo.inicio) {
    const inicio = new Date(this.periodo.inicio);
    const hoy = new Date();
    const años = hoy.getFullYear() - inicio.getFullYear();
    this.añosServicio = años > 0 ? años : 0;
  }
  
  next();
});

// Virtual para nombre en formato inverso
legisladorSchema.virtual('nombreFormal').get(function() {
  return `${this.apellidos}, ${this.nombres}`;
});

// Virtual para URL del perfil
legisladorSchema.virtual('perfilUrl').get(function() {
  const slug = this.nombreCompleto
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return `/legisladores/${slug}`;
});

// Método para calcular estadísticas
legisladorSchema.methods.calcularEstadisticas = async function() {
  // Aquí se podrían agregar cálculos más complejos
  const asistenciaTotal = 100; // Esto sería dinámico
  this.porcentajeAsistencia = (this.asistenciaSesiones / asistenciaTotal) * 100;
  await this.save();
};

const Legislador = mongoose.model('Legislador', legisladorSchema);

module.exports = Legislador;