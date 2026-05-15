// src/routes/content.routes.js
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// ============================================
// RUTAS PÚBLICAS - NO REQUIEREN AUTENTICACIÓN
// ============================================
// 🔥 Estas rutas son para el FRONTEND PÚBLICO
router.get('/', contentController.getContentsPublic);  // <- PÚBLICA
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
router.use(authenticate);

// 🔥 Estas rutas son para el ADMIN DASHBOARD
router.get('/admin', contentController.getContentsAdmin);
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

module.exports = router;