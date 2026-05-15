// src/routes/content.routes.js
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// ============================================
// MIDDLEWARE DE DIAGNÓSTICO - LOG DE TODAS LAS PETICIONES
// ============================================
router.use((req, res, next) => {
  console.log('\n🚦 [ROUTES] ========== PETICIÓN RECIBIDA ==========');
  console.log(`   📌 Método: ${req.method}`);
  console.log(`   📌 Ruta: ${req.path}`);
  console.log(`   📌 URL completa: ${req.url}`);
  console.log(`   📌 Query params:`, req.query);
  console.log(`   📌 Headers Authorization: ${req.headers.authorization ? 'PRESENTE' : 'AUSENTE'}`);
  console.log('🚦 ================================================\n');
  next();
});

// ============================================
// RUTAS PÚBLICAS - NO REQUIEREN AUTENTICACIÓN
// ============================================
console.log('📌 Configurando ruta pública: GET /');
router.get('/', contentController.getContents);
router.get('/types', contentController.getContentTypes);
router.get('/categories', contentController.getCategories);
router.get('/search', contentController.searchContent);
router.get('/slug/:slug', contentController.getContentBySlug);
router.get('/:id/related', contentController.getRelatedContent);
router.get('/stats', contentController.getStats);
router.get('/:id', contentController.getContentById);

// ============================================
// RUTAS PROTEGIDAS - REQUIEREN AUTENTICACIÓN
// ============================================
console.log('🔐 Activando middleware de autenticación para rutas protegidas');
router.use(authenticate);

router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'), contentController.createContent);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'), contentController.updateContent);
router.patch('/:id/status', authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'), contentController.changeStatus);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), contentController.deleteContent);

router.post(
  '/upload/image',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  upload.single('image'),
  contentController.uploadImage
);

router.post(
  '/upload/document',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  upload.single('document'),
  contentController.uploadDocument
);

console.log('✅ Rutas de contenido configuradas correctamente');

module.exports = router;