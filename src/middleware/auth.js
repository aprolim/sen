// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware para verificar token JWT
 * MODIFICADO: Permite peticiones OPTIONS (preflight CORS) sin autenticación
 */
const authenticate = async (req, res, next) => {
  console.log('\n🔐 ========== AUTH MIDDLEWARE INICIADO ==========');
  
  // ✅ NUEVO: Permitir peticiones OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    console.log('📡 OPTIONS request - permitiendo sin autenticación');
    return next();
  }
  
  try {
    // Obtener token del header
    const authHeader = req.header('Authorization');
    
    console.log('📌 Headers completos:', req.headers);
    console.log('📌 Authorization header:', authHeader);
    
    if (!authHeader) {
      console.log('❌ No hay header Authorization');
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. No se proporcionó token.',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Token extraído (primeros 50 chars):', token.substring(0, 50) + '...');
    
    if (!token) {
      console.log('❌ Token vacío después de replace');
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Token vacío.',
      });
    }
    
    // Verificar token
    console.log('🔐 JWT_SECRET usado:', process.env.JWT_SECRET.substring(0, 20) + '...');
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verificado. Payload:', decoded);
    } catch (jwtError) {
      console.log('❌ Error verificando token:', jwtError.message);
      console.log('🔍 Tipo de error:', jwtError.name);
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token inválido.',
        });
      }
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado.',
        });
      }
      throw jwtError;
    }
    
    // Buscar usuario
    console.log('🔍 Buscando usuario con ID:', decoded.userId);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado.',
      });
    }

    console.log('✅ Usuario encontrado:', user.email, 'Rol:', user.role);

    if (user.status !== 'ACTIVE') {
      console.log('❌ Usuario inactivo:', user.status);
      return res.status(403).json({
        success: false,
        message: 'Usuario inactivo o suspendido.',
      });
    }
    
    // Adjuntar usuario a la request
    req.user = user;
    req.token = token;
    console.log('✅ Usuario autenticado correctamente. req.user asignado:', !!req.user);
    console.log('🔚 ========== AUTH MIDDLEWARE FINALIZADO ==========\n');
    
    next();
  } catch (error) {
    console.error('🔥 Error en authenticate:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la autenticación.',
    });
  }
};

/**
 * Middleware para verificar roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('🔐 Verificando roles...');
    console.log('📌 Roles requeridos:', roles);
    
    if (!req.user) {
      console.log('❌ req.user es undefined en authorize');
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado.',
      });
    }
    
    console.log('📌 Rol del usuario:', req.user.role);
    
    if (!roles.includes(req.user.role)) {
      console.log('❌ Rol no autorizado');
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para realizar esta acción.',
      });
    }
    
    console.log('✅ Rol autorizado');
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};