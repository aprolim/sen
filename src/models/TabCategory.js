// ============================================
// src/models/TabCategory.js
// ============================================
const mongoose = require('mongoose');

const tabCategorySchema = new mongoose.Schema({
  categoryId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'ID inválido. Use solo letras, números y guiones']
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  order: {
    type: Number,
    default: 0
  },
  
  color: {
    type: String,
    default: '#e03735',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color debe ser hexadecimal']
  },
  
  icon: {
    type: String
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

tabCategorySchema.index({ categoryId: 1 });
tabCategorySchema.index({ order: 1 });
tabCategorySchema.index({ isActive: 1 });

module.exports = mongoose.model('TabCategory', tabCategorySchema);