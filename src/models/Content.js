// src/models/Content.js
const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
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
  },
  content: {
    type: String,
    required: [true, 'El contenido es requerido'],
  },
  blocks: {
    type: [{
      type: {
        type: String,
        enum: ['paragraph', 'quote', 'video', 'image', 'heading'],
        default: 'paragraph'
      },
      content: { type: String, default: '' },
      author: { type: String, default: '' },
      role: { type: String, default: '' },
      url: { type: String, default: '' },
      title: { type: String, default: '' },
      caption: { type: String, default: '' },
      level: { type: Number, min: 1, max: 6, default: 2 },
      order: { type: Number, default: 0 }
    }],
    default: []
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: [300, 'El extracto no puede exceder 300 caracteres'],
  },
  type: {
    type: String,
    enum: ['page', 'news', 'article', 'announcement'],
    default: 'news',
  },
  category: {
    type: String,
    enum: ['noticia', 'importante'],
    default: 'noticia',
  },
  originalCategory: {
    type: String,
    enum: ['institucional', 'historia', 'directiva', 'noticias', 'eventos', 'transparencia', 'participacion', 'legislacion'],
  },
  tags: [{ type: String, trim: true, lowercase: true }],
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
  featuredImage: {
    url: String,
    alt: String,
    caption: String,
    credit: String,
    name: String,
  },
  gallery: [{
    url: String,
    alt: String,
    caption: String,
    order: Number,
    name: String,
  }],
  attachments: [{
    name: String,
    url: String,
    size: Number,
    type: String,
  }],
  // 🔥 NUEVO CAMPO: IDs de los senadores participantes
  participantes: [{
    type: Number,
    index: true
  }],
  seo: {
    title: String,
    description: String,
    keywords: [String],
    canonicalUrl: String,
  },
  publishedAt: {
    type: Date,
  },
  scheduledFor: {
    type: Date,
  },
  expiresAt: {
    type: Date,
  },
  views: {
    type: Number,
    default: 0,
  },
  relatedContent: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
  }],
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
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiedAt: Date,
    revision: Number,
    comment: String,
  }],
}, {
  timestamps: true,
});

// Índices
contentSchema.index({ slug: 1 }, { unique: true });
contentSchema.index({ title: 'text', content: 'text', excerpt: 'text' });
contentSchema.index({ type: 1, status: 1, publishedAt: -1 });
contentSchema.index({ category: 1, tags: 1 });
contentSchema.index({ status: 1, scheduledFor: 1 });
contentSchema.index({ originalCategory: 1 });
contentSchema.index({ participantes: 1 }); // 🔥 Índice para búsquedas por senador

// Middleware para generar slug automáticamente
contentSchema.pre('validate', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
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
  if (this.status === 'scheduled' && this.scheduledFor && this.scheduledFor <= new Date()) {
    this.status = 'published';
    this.publishedAt = new Date();
    this.scheduledFor = null;
  }
  next();
});

// Método para incrementar vistas
contentSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
};

const Content = mongoose.model('Content', contentSchema);
module.exports = Content;