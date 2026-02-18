const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  // Información básica
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxlength: [200, 'El título no puede exceder 200 caracteres'],
  },
  slug: {
    type: String,
    required: [true, 'El slug es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido. Use solo letras, números y guiones.'],
  },
  content: {
    type: String,
    required: [true, 'El contenido es requerido'],
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: [300, 'El extracto no puede exceder 300 caracteres'],
  },
  
  // Categorización
  type: {
    type: String,
    enum: ['page', 'news', 'article', 'announcement'],
    default: 'page',
    required: true,
  },
  category: {
    type: String,
    enum: [
      'institucional', 
      'historia', 
      'directiva', 
      'noticias', 
      'eventos', 
      'transparencia',
      'participacion',
      'legislacion'
    ],
    default: 'noticias',
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  
  // Metadatos
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'scheduled'],
    default: 'draft',
  },
  language: {
    type: String,
    enum: ['es', 'qu', 'ay'],
    default: 'es',
  },
  
  // Imágenes y multimedia
  featuredImage: {
    url: String,
    alt: String,
    caption: String,
    credit: String,
  },
  gallery: [{
    url: String,
    alt: String,
    caption: String,
    order: Number,
  }],
  attachments: [{
    name: String,
    url: String,
    size: Number,
    type: String,
  }],
  
  // SEO
  seo: {
    title: {
      type: String,
      trim: true,
      maxlength: [60, 'El título SEO no puede exceder 60 caracteres'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [160, 'La descripción SEO no puede exceder 160 caracteres'],
    },
    keywords: [String],
    canonicalUrl: String,
  },
  
  // Fechas
  publishedAt: {
    type: Date,
  },
  scheduledFor: {
    type: Date,
  },
  expiresAt: {
    type: Date,
  },
  
  // Estadísticas
  views: {
    type: Number,
    default: 0,
  },
  
  // Relaciones
  relatedContent: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
  }],
  
  // Metadata del sistema
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  revision: {
    type: Number,
    default: 1,
  },
  versionHistory: [{
    content: String,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    modifiedAt: Date,
    revision: Number,
    comment: String,
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Índices para búsqueda eficiente
contentSchema.index({ slug: 1 }, { unique: true });
contentSchema.index({ title: 'text', content: 'text', excerpt: 'text' });
contentSchema.index({ type: 1, status: 1, publishedAt: -1 });
contentSchema.index({ category: 1, tags: 1 });
contentSchema.index({ scheduledFor: 1 });
contentSchema.index({ author: 1 });

// Middleware para generar slug automáticamente
contentSchema.pre('validate', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Middleware para manejar fechas de publicación
contentSchema.pre('save', function(next) {
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  if (this.status === 'scheduled' && !this.scheduledFor) {
    this.scheduledFor = new Date();
  }
  
  next();
});

// Virtual para URL amigable
contentSchema.virtual('url').get(function() {
  const baseUrl = '/contenido';
  const typePaths = {
    page: '/paginas',
    news: '/noticias',
    article: '/articulos',
    announcement: '/anuncios',
  };
  
  return `${baseUrl}${typePaths[this.type] || ''}/${this.slug}`;
});

// Método para incrementar vistas
contentSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
};

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;