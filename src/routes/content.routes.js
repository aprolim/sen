// src/routes/content.routes.js
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// ============================================
// RUTAS PÚBLICAS - NO REQUIEREN AUTENTICACIÓN
// ============================================
// Estas son las rutas que consume el frontend público
router.get('/types', contentController.getContentTypes);
router.get('/categories', contentController.getCategories);
router.get('/search', contentController.searchContent);
router.get('/slug/:slug', contentController.getContentBySlug);
router.get('/:id/related', contentController.getRelatedContent);
router.get('/', contentController.getContents);           // ← Listado de noticias (público)
router.get('/stats', contentController.getStats);         // ← Estadísticas (público)
router.get('/:id', contentController.getContentById);     // ← Noticia individual (público)

// ============================================
// RUTAS PROTEGIDAS - REQUIEREN AUTENTICACIÓN
// ============================================
router.use(authenticate);

// Crear contenido (admin/editor)
router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  contentController.createContent
);

// Actualizar contenido (admin/editor)
router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  contentController.updateContent
);

// Cambiar estado (admin/editor)
router.patch(
  '/:id/status',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  contentController.changeStatus
);

// Eliminar contenido (solo super admin y admin)
router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN'),
  contentController.deleteContent
);

// Subir imágenes (requiere autenticación)
router.post(
  '/upload/image',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  upload.single('image'),
  contentController.uploadImage
);

// Subir documentos (requiere autenticación)
router.post(
  '/upload/document',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  upload.single('document'),
  contentController.uploadDocument
);

module.exports = router;