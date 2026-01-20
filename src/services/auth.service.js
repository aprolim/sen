// services/auth.service.js - Versión segura
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

class AuthService {
  generateAccessToken(userId) {
    return jwt.sign(
      { 
        userId,
        jti: crypto.randomBytes(16).toString('hex') // JWT ID para revocación
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        issuer: 'senado-api',
        audience: 'senado-client'
      }
    );
  }
  
  generateRefreshToken(userId) {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );
  }
  
  async login(email, password) {
    try {
      // Buscar usuario (incluyendo password)
      const user = await User.findOne({ email: email.toLowerCase() })
        .select('+password +loginAttempts +lockUntil');
      
      if (!user) {
        throw new Error('Credenciales inválidas');
      }
      
      // Verificar bloqueo
      if (user.isLocked) {
        throw new Error('Cuenta bloqueada. Intenta más tarde.');
      }
      
      if (user.status !== 'ACTIVE') {
        throw new Error('Cuenta inactiva o suspendida');
      }
      
      // Verificar contraseña
      const isValid = await user.comparePassword(password);
      
      if (!isValid) {
        await user.incrementLoginAttempts();
        throw new Error('Credenciales inválidas');
      }
      
      // Resetear intentos
      await user.resetLoginAttempts();
      
      // Generar tokens
      const accessToken = this.generateAccessToken(user._id);
      const refreshToken = this.generateRefreshToken(user._id);
      
      // Guardar refresh token (hasheado)
      const hashedRefreshToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');
      
      user.refreshToken = hashedRefreshToken;
      await user.save();
      
      return {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          status: user.status,
          requiresPasswordChange: user.isPasswordExpired()
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 15 * 60 // 15 minutos en segundos
        }
      };
      
    } catch (error) {
      throw error;
    }
  }
  
  async refreshAccessToken(refreshToken) {
    try {
      // Verificar refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Token inválido');
      }
      
      // Buscar usuario con refresh token
      const hashedToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');
      
      const user = await User.findOne({
        _id: decoded.userId,
        refreshToken: hashedToken,
        status: 'ACTIVE'
      });
      
      if (!user) {
        throw new Error('Token inválido o usuario no encontrado');
      }
      
      // Generar nuevo access token
      const newAccessToken = this.generateAccessToken(user._id);
      
      return {
        accessToken: newAccessToken,
        expiresIn: 15 * 60
      };
      
    } catch (error) {
      throw new Error('Token de refresco inválido');
    }
  }
  
  async logout(userId, refreshToken) {
    try {
      if (refreshToken) {
        const hashedToken = crypto
          .createHash('sha256')
          .update(refreshToken)
          .digest('hex');
        
        await User.updateOne(
          { _id: userId, refreshToken: hashedToken },
          { $unset: { refreshToken: "" } }
        );
      }
      
      // Aquí podrías agregar el token a una blacklist
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();