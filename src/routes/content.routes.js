// src/routes/content.routes.js
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// ============================================
// RUTAS PÚBLICAS - NO REQUIEREN AUTENTICACIÓN
// ============================================
router.get('/', contentController.getContentsPublic);
router.get('/types', contentController.getContentTypes);
router.get('/categories', contentController.getCategories);
router.get('/search', contentController.searchContent);
router.get('/slug/:slug', contentController.getContentBySlug);
router.get('/stats', contentController.getStats);
router.get('/:id/related', contentController.getRelatedContent);
router.get('/public/:id', contentController.getContentByIdPublic);
router.get('/category/:category', contentController.getContentsByCategory);

// 🔥 NUEVAS RUTAS PARA NOTICIAS POR SENADOR
router.get('/senador/:senadorId', contentController.getContentsBySenador);
router.post('/senadores', contentController.getContentsBySenadores);

// ============================================
// RUTAS PROTEGIDAS - REQUIEREN AUTENTICACIÓN
// ============================================
router.use(authenticate);

router.get('/admin', contentController.getContentsAdmin);
router.get('/:id', contentController.getContentById);

router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'), contentController.createContent);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'), contentController.updateContent);
router.patch('/:id/status', authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'), contentController.changeStatus);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), contentController.deleteContent);

// Ruta para publicar contenido programado (puede ser llamada por cron o manualmente)
router.post('/publish-scheduled', authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'), contentController.publishScheduledContent);

router.post('/upload/image', authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'), upload.single('image'), contentController.uploadImage);
router.post('/upload/document', authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'), upload.single('document'), contentController.uploadDocument);

module.exports = router;