const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Cargar variables de entorno
dotenv.config();

const app = express();

// ============================================
// 1. SEGURIDAD: CONFIGURACIÓN COMPLETA
// ============================================

// A. HELMET - Headers de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// B. CORS - Control de orígenes
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://10.0.0.20',
      'http://10.0.0.22',
      'http://10.0.0.21',
      'http://demopanel.senado.gob.bo',
      'http://demoap.senado.gob.bo',
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 204, // ✅ CAMBIADO: 204 en lugar de 200 para OPTIONS
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));

// ✅ NUEVO: Middleware para Private Network Access y manejo de OPTIONS
app.use((req, res, next) => {
  // Cabecera crítica para Private Network Access
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  
  // Manejo explícito de OPTIONS (por si acaso)
  if (req.method === 'OPTIONS') {
    console.log('📡 Preflight request de:', req.headers.origin);
    return res.sendStatus(204); // No content, con todas las cabeceras ya aplicadas por cors()
  }
  
  next();
});

// C. RATE LIMITING - Protección DDoS/Brute Force
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 peticiones por IP
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 5 minutos
  max: 5, // Solo 5 intentos de login
  message: {
    success: false,
    message: 'Demasiados intentos de login. Intenta más tarde.'
  },
  skipSuccessfulRequests: true
});

app.use(generalLimiter);

// D. PROTECCIÓN CONTRA INYECCIONES
app.use(mongoSanitize()); // Previene NoSQL injection
app.use(xss()); // Previene XSS attacks
app.use(hpp()); // Previene HTTP Parameter Pollution

// E. MIDDLEWARES BÁSICOS CON SEGURIDAD
app.use(morgan('combined', {
  skip: (req, res) => req.path === '/api/health'
}));

// Limitar tamaño de requests
app.use(express.json({
  limit: '10kb', // Máximo 10kb por request
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new Error('JSON inválido');
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10kb' 
}));

// F. HEADERS ADICIONALES
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // No cache para endpoints sensibles
  if (req.path.includes('/api/auth') || req.path.includes('/api/users')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
});

// ============================================
// 2. SWAGGER (SIN BUSCADOR)
// ============================================
console.log('\n🔧 Configurando Swagger...');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Senado de Bolivia API',
      version: '1.0.0',
      description: 'API Segura para el portal del Senado de Bolivia',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 3000}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [path.join(__dirname, 'controllers/*.js')],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  docExpansion: 'none',
  swaggerOptions: {
    validatorUrl: null,
    displayRequestDuration: true,
  },
}));

// ============================================
// 3. IMPORTAR RUTAS CON SEGURIDAD
// ============================================
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const contentRoutes = require('./routes/content.routes');
const legisladoresRoutes = require('./routes/legisladores.routes');
const tabsRoutes = require('./routes/tabs.routes');
const iconsRoutes = require('./routes/icons.routes');

// Aplicar rate limiting específico a login
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/legisladores', legisladoresRoutes);
app.use('/api/tabs', tabsRoutes);
app.use('/api/icons', iconsRoutes);

// ============================================
// 4. RUTAS DEL SISTEMA
// ============================================

// Health check seguro (información limitada)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Información básica (sin detalles internos)
app.get('/api', (req, res) => {
  res.json({
    success: true,
    name: 'Senado de Bolivia API',
    version: '1.0.0',
    documentation: '/api/docs',
    requires_auth: true,
  });
});

// ============================================
// 5. AUDITORÍA Y LOGGING DE SEGURIDAD
// ============================================

// Middleware de auditoría
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
    };
    
    // Log detallado para endpoints sensibles o errores
    if (req.path.includes('/api/auth') || res.statusCode >= 400) {
      console.log('🔐 AUDIT:', logData);
    }
  });
  
  next();
});

// ============================================
// 6. MANEJO DE ERRORES SEGURO
// ============================================

// 404 - No exponer estructura interna
app.use('*', (req, res) => {
  console.warn(`⚠️  404: ${req.method} ${req.originalUrl} from ${req.ip}`);
  
  res.status(404).json({
    success: false,
    message: 'Recurso no encontrado',
  });
});

// Error handler - No exponer detalles en producción
app.use((err, req, res, next) => {
  console.error('🔥 ERROR:', {
    message: err.message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });
  
  // Clasificar errores
  let statusCode = 500;
  let message = 'Error interno del servidor';
  
  if (err.name === 'ValidationError') statusCode = 400;
  else if (err.name === 'JsonWebTokenError') statusCode = 401;
  else if (err.name === 'TokenExpiredError') statusCode = 401;
  else if (err.message.includes('CORS')) statusCode = 403;
  else if (err.message.includes('rate limit')) statusCode = 429;
  
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : message,
    code: err.code || 'SERVER_ERROR',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// 7. INICIALIZACIÓN SEGURA
// ============================================
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Validar variables críticas
    const requiredVars = ['JWT_SECRET', 'MONGODB_URI'];
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        throw new Error(`Variable ${varName} no definida en .env`);
      }
    });
    
    // Validar JWT_SECRET seguro
    if (process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
    }
    
    // Conectar DB
    const connectDB = require('./config/database');
    await connectDB();
    
    // Iniciar servidor - ✅ MODIFICADO: Escuchar en 0.0.0.0 para aceptar conexiones externas
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '═'.repeat(60));
      console.log('✅ SERVIDOR SEGURO INICIADO');
      console.log('═'.repeat(60));
      console.log(`🚀 URL Local:    http://localhost:${PORT}`);
      console.log(`🌐 URL Red:      http://10.0.0.20:${PORT}`); // Ajusta según tu IP
      console.log(`📚 Documentación: http://localhost:${PORT}/api/docs`);
      console.log(`🔍 Health Check:  http://localhost:${PORT}/api/health`);
      console.log('═'.repeat(60));
      console.log('\n🛡️  MEDIDAS DE SEGURIDAD ACTIVAS:');
      console.log('   • Rate Limiting (100 req/15min)');
      console.log('   • Login Limiting (5 intentos/5min)');
      console.log('   • Helmet.js (Headers seguridad)');
      console.log('   • CORS restringido');
      console.log('   • Private Network Access habilitado');
      console.log('   • OPTIONS responden con 204');
      console.log('   • Sanitización MongoDB');
      console.log('   • Protección XSS');
      console.log('   • Protección HPP');
      console.log('   • Auditoría de logs');
      console.log('   • Validación JWT secreto');
      console.log('═'.repeat(60));
    });
    
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:', error.message);
    process.exit(1);
  }
};

startServer();