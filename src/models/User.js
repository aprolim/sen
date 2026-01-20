// models/User.js - Versión segura
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false // No devolver en queries por defecto
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'MODERATOR', 'VIEWER', 'CITIZEN'],
    default: 'CITIZEN',
    index: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'LOCKED'],
    default: 'PENDING'
  },
  profile: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    ci: { type: String, trim: true },
    phone: { type: String, trim: true },
    position: { type: String, trim: true },
    department: { type: String, trim: true },
    avatar: { type: String }
  },
  // SEGURIDAD
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  lastLogin: { type: Date },
  lastPasswordChange: { type: Date, default: Date.now },
  passwordHistory: [{ type: String }], // Últimas contraseñas
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, select: false },
  refreshToken: { type: String, select: false }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices compuestos
userSchema.index({ email: 1, status: 1 });
userSchema.index({ role: 1, status: 1 });

// Virtual para verificar si está bloqueado
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Middleware pre-save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Verificar que no sea una contraseña anterior
    if (this.passwordHistory && this.passwordHistory.length > 0) {
      const isPrevious = await Promise.any(
        this.passwordHistory.map(oldHash => 
          bcrypt.compare(this.password, oldHash)
        )
      ).catch(() => false);
      
      if (isPrevious) {
        throw new Error('No puedes usar una contraseña anterior');
      }
    }
    
    // Encriptar
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Guardar en historial (máximo 5)
    if (!this.passwordHistory) this.passwordHistory = [];
    this.passwordHistory.push(this.password);
    if (this.passwordHistory.length > 5) {
      this.passwordHistory.shift();
    }
    
    this.lastPasswordChange = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Métodos de seguridad
userSchema.methods = {
  comparePassword: async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  },
  
  incrementLoginAttempts: async function() {
    this.loginAttempts += 1;
    
    if (this.loginAttempts >= 5) {
      this.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutos
    }
    
    return await this.save();
  },
  
  resetLoginAttempts: async function() {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    this.lastLogin = Date.now();
    return await this.save();
  },
  
  isPasswordExpired: function() {
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    return Date.now() - this.lastPasswordChange > ninetyDays;
  }
};

module.exports = mongoose.model('User', userSchema);