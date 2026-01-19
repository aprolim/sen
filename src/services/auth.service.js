const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  /**
   * Genera token JWT
   */
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }
  
  /**
   * Login de usuario
   */
  async login(email, password) {
    try {
      // Buscar usuario
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        throw new Error('Credenciales inválidas');
      }
      
      if (user.status !== 'ACTIVE') {
        throw new Error('Usuario inactivo o suspendido');
      }
      
      // Verificar contraseña
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        throw new Error('Credenciales inválidas');
      }
      
      // Generar token
      const token = this.generateToken(user._id);
      
      // Actualizar último login
      await user.updateLastLogin();
      
      return {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          status: user.status,
        },
        token,
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Registro de usuario
   */
  async register(userData) {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
      
      if (existingUser) {
        throw new Error('El email ya está registrado');
      }
      
      // Crear usuario
      const user = new User({
        ...userData,
        email: userData.email.toLowerCase(),
        status: 'ACTIVE', // Por defecto activo
      });
      
      await user.save();
      
      // Generar token
      const token = this.generateToken(user._id);
      
      return {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          status: user.status,
        },
        token,
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Obtener usuario actual
   */
  async getCurrentUser(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      return {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();