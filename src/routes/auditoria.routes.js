// src/routes/auditoria.routes.js
const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoria.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadPDF: uploadPDFMiddleware } = require('../middleware/upload');

console.log('✅ Cargando rutas de auditoría...');

// ============================================
// 📡 RUTAS PÚBLICAS
// ============================================
router.get('/:modulo', auditoriaController.getDocumentosPublicos);

// ============================================
// 🔐 RUTAS PROTEGIDAS (ADMIN)
// ============================================
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'));

// -------- MIGRACIÓN DE PDFs (operación especial) --------
// POST /api/auditoria/migrar-pdfs
router.post('/migrar-pdfs', auditoriaController.migrarPDFs);

// -------- UPLOADS (deben ir antes de /:id) --------
// POST /api/auditoria/:modulo/upload-pdf
router.post(
  '/:modulo/upload-pdf',
  uploadPDFMiddleware.single('pdf'),
  auditoriaController.uploadPDF
);

// -------- ESTADÍSTICAS --------
// GET /api/auditoria/:modulo/stats
router.get('/:modulo/stats', auditoriaController.getStats);

// -------- LISTADO ADMIN --------
// GET /api/auditoria/:modulo/admin
router.get('/:modulo/admin', auditoriaController.getDocumentosAdmin);

// -------- CATEGORÍAS (solo módulos con tabs) --------
// GET    /api/auditoria/:modulo/categorias
// POST   /api/auditoria/:modulo/categorias
// PUT    /api/auditoria/:modulo/categorias/:key
// DELETE /api/auditoria/:modulo/categorias/:key
router.get('/:modulo/categorias', auditoriaController.getCategorias);
router.post('/:modulo/categorias', auditoriaController.createCategoria);
router.put('/:modulo/categorias/:key', auditoriaController.updateCategoria);
router.delete('/:modulo/categorias/:key', auditoriaController.deleteCategoria);

// -------- CRUD DOCUMENTOS --------
// GET    /api/auditoria/:modulo/:id
// POST   /api/auditoria/:modulo
// PUT    /api/auditoria/:modulo/:id
// DELETE /api/auditoria/:modulo/:id
router.get('/:modulo/:id', auditoriaController.getDocumentoById);
router.post('/:modulo', auditoriaController.createDocumento);
router.put('/:modulo/:id', auditoriaController.updateDocumento);
router.delete('/:modulo/:id', auditoriaController.deleteDocumento);

console.log('✅ Rutas de auditoría configuradas correctamente');

module.exports = router;