// src/routes/documentosLegislativos.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/documentosLegislativos.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadPDF: uploadPDFMiddleware } = require('../middleware/upload');

console.log('✅ Cargando rutas de documentos legislativos...');

// ============================================
// 📡 RUTAS PÚBLICAS (sin autenticación)
// ============================================

// GET /api/legislativos/tipos → lista de tipos disponibles
router.get('/tipos', controller.getTiposDisponibles);

// GET /api/legislativos/:tipo → lista pública paginada
router.get('/:tipo', controller.getDocumentosPublicos);

// GET /api/legislativos/:tipo/stats → contadores para la home
router.get('/:tipo/stats', controller.getStats);

// GET /api/legislativos/:tipo/config → config del tipo para el CMS
router.get('/:tipo/config', controller.getConfigDelTipo);

// ============================================
// 🔐 RUTAS PROTEGIDAS (a partir de aquí)
// ============================================
router.use(authenticate);
router.use(
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'EDITOR_AUDITORIA')
);

// -------- Upload PDF --------
// POST /api/legislativos/:tipo/upload-pdf
router.post(
  '/:tipo/upload-pdf',
  uploadPDFMiddleware.single('pdf'),
  controller.uploadPDF
);

// -------- Listado admin --------
// GET /api/legislativos/:tipo/admin
router.get('/:tipo/admin', controller.getDocumentosAdmin);

// -------- Restaurar (solo SUPER_ADMIN) --------
// PATCH /api/legislativos/:tipo/:id/restore
router.patch(
  '/:tipo/:id/restore',
  authorize('SUPER_ADMIN'),
  controller.restoreDocumento
);

// -------- CRUD --------
// GET    /api/legislativos/:tipo/:id
router.get('/:tipo/:id', controller.getDocumentoById);

// POST   /api/legislativos/:tipo
router.post('/:tipo', controller.createDocumento);

// PUT    /api/legislativos/:tipo/:id
router.put('/:tipo/:id', controller.updateDocumento);

// DELETE /api/legislativos/:tipo/:id   → SOFT DELETE
router.delete('/:tipo/:id', controller.deleteDocumento);

console.log('✅ Rutas de documentos legislativos configuradas');

module.exports = router;