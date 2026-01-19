const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');

// Importar y ejecutar configuración de base de datos
const connectDB = require('./config/database');

const app = express();

// ============================================
// CONFIGURACIÓN DE SWAGGER - CORREGIDA
// ============================================
console.log('\n🔧 CONFIGURANDO SWAGGER...');
console.log('Buscando archivos en:', path.join(__dirname, 'routes/*.js'));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Senado de Bolivia API',
      version: '1.0.0',
      description: 'API para el portal del Senado de Bolivia',
      contact: {
        name: 'Soporte API',
        email: 'soporte@senado.bo'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor de desarrollo',
      },
      {
        url: 'https://api.senado.bo',
        description: 'Servidor de producción',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingrese el token JWT con el prefijo Bearer',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único del usuario',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            role: {
              type: 'string',
              enum: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'MODERATOR', 'VIEWER', 'CITIZEN'],
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'],
            },
            profile: {
              type: 'object',
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                ci: { type: 'string' },
                phone: { type: 'string' },
                position: { type: 'string' },
                department: { type: 'string' },
                avatar: { type: 'string' },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints de autenticación',
      },
      {
        name: 'Users',
        description: 'Endpoints de gestión de usuarios',
      },
    ],
  },
  // Rutas ABSOLUTAS para evitar problemas
  apis: [
    path.join(__dirname, 'routes/*.js'),  // Ruta absoluta
    path.join(__dirname, 'controllers/*.js'), // También busca en controladores
  ],
};

console.log('Archivos que buscará Swagger:');
console.log('1.', path.join(__dirname, 'routes/*.js'));
console.log('2.', path.join(__dirname, 'controllers/*.js'));

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Verificar qué endpoints encontró
console.log('\n📊 SWAGGER SPEC GENERADO:');
console.log('Tags encontrados:', swaggerSpec.tags?.length || 0);
console.log('Paths encontrados:', Object.keys(swaggerSpec.paths || {}).length);

if (swaggerSpec.paths) {
  console.log('Endpoints detectados:');
  Object.keys(swaggerSpec.paths).forEach(path => {
    console.log(`  - ${path}`);
  });
} else {
  console.log('⚠️  No se encontraron endpoints');
}

// ============================================
// MIDDLEWARES
// ============================================
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta para documentación Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'Senado de Bolivia - API Docs',
  swaggerOptions: {
    docExpansion: 'list',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    showRequestDuration: true,
  },
}));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor del Senado de Bolivia funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

// Ruta de prueba para Swagger
app.get('/api/swagger-test', (req, res) => {
  res.json({
    message: 'Esta ruta es para probar Swagger',
    swaggerDetected: Object.keys(swaggerSpec.paths || {}).length,
    endpoints: Object.keys(swaggerSpec.paths || {}),
  });
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 3000;

// Conectar a la base de datos y luego iniciar el servidor
const startServer = async () => {
  try {
    // Conectar a MongoDB primero
    await connectDB();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor ejecutándose en: http://localhost:${PORT}`);
      console.log(`📚 Documentación API: http://localhost:${PORT}/api/docs`);
      console.log(`🔍 Prueba Swagger: http://localhost:${PORT}/api/swagger-test`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
};

// Iniciar la aplicación
startServer();