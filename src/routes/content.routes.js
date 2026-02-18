const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Rutas públicas
router.get('/', contentController.getContents);
router.get('/types', contentController.getContentTypes);
router.get('/categories', contentController.getCategories);
router.get('/search', contentController.searchContent);
router.get('/slug/:slug', contentController.getContentBySlug);
router.get('/:id', contentController.getContentById);
router.get('/:id/related', contentController.getRelatedContent);

// Rutas protegidas (requieren autenticación)
router.use(authenticate);

// Rutas de administración (admin/editor)
router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  contentController.createContent
);

router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  contentController.updateContent
);

router.patch(
  '/:id/status',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  contentController.changeStatus
);

// Rutas solo para super admin y admin
router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN'),
  contentController.deleteContent
);

router.get(
  '/stats',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  contentController.getStats
);

// Rutas para subir archivos
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