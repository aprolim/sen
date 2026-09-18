// src/app.js
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
// 🔥 LÍMITE GLOBAL: 350 MB
// ============================================
const MAX_BODY_SIZE = '350mb';

// ============================================
// TRUST PROXY
// ============================================
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
} else {
  app.set('trust proxy', true);
}

// ============================================
// CORS - Configuración
// ============================================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://10.0.0.20',
  'http://10.0.0.21',
  'http://10.0.0.22',
  'http://10.0.0.21:3000',
  'http://10.0.0.21:3001',
  'http://10.0.0.21:3002',
  'http://10.0.0.21:3003',
  'http://demopanel.senado.gob.bo',
  'http://demoap.senado.gob.bo',
  'http://demoback.senado.gob.bo',
  'https://demoap.senado.gob.bo',
  'https://demopanel.senado.gob.bo',
  'https://demoback.senado.gob.bo',
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Origen bloqueado por CORS:', origin);
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 204,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept', 'Content-Length', 'X-File-Name'],
  exposedHeaders: ['Content-Length', 'Content-Range', 'X-Total-Count'],
  maxAge: 86400 // 24 horas de cache para preflight
};

// 🔥 CORS debe ir ANTES de todo (incluso de helmet)
app.use(cors(corsOptions));

// ============================================
// HELMET
// ============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:", "*"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false, // 🔥 Deshabilitado para permitir iframes/PDFs
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// ============================================
// MANEJO DE OPTIONS (preflight)
// ============================================
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS') {
    console.log('📡 Preflight request de:', req.headers.origin);
    return res.sendStatus(204);
  }

  next();
});

// ============================================
// RATE LIMITING
// ============================================
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP. Intenta más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true }
});

const authLimiter = rateLimit({
  windowMs: 3 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Demasiados intentos de login. Intenta más tarde.'
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true }
});

app.use(generalLimiter);

// ============================================
// PROTECCIÓN CONTRA INYECCIONES
// ============================================
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// ============================================
// LOGGING
// ============================================
app.use(morgan('combined', {
  skip: (req, res) => req.path === '/api/health'
}));

// ============================================
// 🔥 BODY PARSERS - LÍMITE 350 MB
// ============================================
app.use(express.json({
  limit: MAX_BODY_SIZE,
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
  limit: MAX_BODY_SIZE
}));

// ============================================
// SERVIR ARCHIVOS ESTÁTICOS
// ============================================

// 1. Uploads (imágenes y PDFs)
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Accept-Ranges', 'bytes');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
}, express.static(path.join(__dirname, '..', 'uploads'), {
  setHeaders: (res, filepath) => {
    if (filepath.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
    if (filepath.match(/\.pdf$/)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }
}));

// 2. Senadores
app.use('/senadores', express.static(path.join(__dirname, '..', 'public', 'senadores'), {
  setHeaders: (res, filepath) => {
    if (filepath.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }
}));

// 🔥 3. NUEVO: Servir toda la carpeta public (para otros assets)
app.use('/public', express.static(path.join(__dirname, '..', 'public'), {
  setHeaders: (res, filepath) => {
    if (filepath.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }
}));

// ============================================
// HEADERS ADICIONALES
// ============================================
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // 🔥 Cambiado de DENY a SAMEORIGIN para permitir iframes internos
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  if (req.path.includes('/api/auth') || req.path.includes('/api/users')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
});

// ============================================
// SWAGGER
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
    servers: [{ url: `http://${process.env.HOST || 'localhost'}:${process.env.PORT || 3000}` }],
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
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  docExpansion: 'none',
  swaggerOptions: {
    validatorUrl: null,
    displayRequestDuration: true,
  },
}));

// ============================================
// IMPORTAR RUTAS
// ============================================
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const contentRoutes = require('./routes/content.routes');
const legisladoresRoutes = require('./routes/legisladores.routes');
const tabsRoutes = require('./routes/tabs.routes');
const iconsRoutes = require('./routes/icons.routes');
const sesionesRoutes = require('./routes/sesiones.routes');
const comunicadosRoutes = require('./routes/comunicados.routes');
const avisosRoutes = require('./routes/avisos.routes');
const auditoriaRoutes = require('./routes/auditoria.routes');

// Rate limiting específico
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/legisladores', legisladoresRoutes);
app.use('/api/tabs', tabsRoutes);
app.use('/api/icons', iconsRoutes);
app.use('/api/sesiones', sesionesRoutes);
app.use('/api/comunicados', comunicadosRoutes);
app.use('/api/avisos', avisosRoutes);
app.use('/api/auditoria', auditoriaRoutes);

// ============================================
// RUTAS DEL SISTEMA
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    maxFileSize: '350 MB'
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    name: 'Senado de Bolivia API',
    version: '1.0.0',
    documentation: '/api/docs',
    requires_auth: true,
    maxFileSize: '350 MB'
  });
});

// ============================================
// AUDITORÍA Y LOGGING
// ============================================
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

    if (req.path.includes('/api/auth') || res.statusCode >= 400) {
      console.log('🔐 AUDIT:', logData);
    }
  });

  next();
});

// ============================================
// 404
// ============================================
app.use('*', (req, res) => {
  console.warn(`⚠️  404: ${req.method} ${req.originalUrl} from ${req.ip}`);

  // Headers CORS manuales por si acaso
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  res.status(404).json({
    success: false,
    message: 'Recurso no encontrado',
  });
});

// ============================================
// 🔥 ERROR HANDLER CON CORS
// CRÍTICO: este handler DEBE incluir headers CORS
// ============================================
app.use((err, req, res, next) => {
  console.error('🔥 ERROR:', {
    message: err.message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // 🔥 SIEMPRE incluir headers CORS en errores
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');

  let statusCode = 500;
  let message = 'Error interno del servidor';
  let code = 'SERVER_ERROR';

  // 🔥 Errores de Multer
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      message = 'El archivo excede el tamaño máximo permitido (350 MB)';
      code = 'FILE_TOO_LARGE';
    } else {
      statusCode = 400;
      message = `Error al subir archivo: ${err.message}`;
      code = err.code;
    }
  }
  // Errores de validación
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
    code = 'VALIDATION_ERROR';
  }
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
    code = 'INVALID_TOKEN';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
    code = 'TOKEN_EXPIRED';
  }
  else if (err.message && err.message.includes('CORS')) {
    statusCode = 403;
    message = 'Origen no permitido por CORS';
    code = 'CORS_ERROR';
  }
  else if (err.message && err.message.includes('rate limit')) {
    statusCode = 429;
    message = 'Demasiadas peticiones';
    code = 'RATE_LIMIT';
  }
  else if (err.message && err.message.includes('JSON inválido')) {
    statusCode = 400;
    message = 'JSON inválido en el body';
    code = 'INVALID_JSON';
  }
  // 🔥 Error de body muy grande (express.json)
  else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'El body de la petición es demasiado grande (máx 350 MB)';
    code = 'PAYLOAD_TOO_LARGE';
  }

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : message,
    code: code,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// INICIALIZACIÓN
// ============================================
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    const requiredVars = ['JWT_SECRET', 'MONGODB_URI'];
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        throw new Error(`Variable ${varName} no definida en .env`);
      }
    });

    if (process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
    }

    const connectDB = require('./config/database');
    await connectDB();

    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '═'.repeat(60));
      console.log('✅ SERVIDOR SEGURO INICIADO');
      console.log('═'.repeat(60));
      console.log(`🚀 URL Local:    http://localhost:${PORT}`);
      console.log(`📚 Documentación: http://localhost:${PORT}/api/docs`);
      console.log(`🔌 Health Check:  http://localhost:${PORT}/api/health`);
      console.log('═'.repeat(60));
      console.log('\n🛡️  MEDIDAS DE SEGURIDAD ACTIVAS:');
      console.log('   • Rate Limiting (10000 req/15min)');
      console.log('   • Login Limiting (5 intentos/5min)');
      console.log('   • Helmet.js (Headers seguridad)');
      console.log('   • CORS restringido (con headers en errores)');
      console.log('   • Sanitización MongoDB');
      console.log('   • Protección XSS');
      console.log('   • Protección HPP');
      console.log('   • Auditoría de logs');
      console.log('   • Validación JWT secreto');
      console.log(`   • 🔥 LÍMITE DE ARCHIVOS: 350 MB`);
      console.log(`   • 🔥 LÍMITE DE BODY: 350 MB`);
      console.log('═'.repeat(60));
    });

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:', error.message);
    process.exit(1);
  }
};

startServer();