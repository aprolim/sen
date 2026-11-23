// src/routes/marcoNormativo.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/marcoNormativo.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadPDF: uploadPDFMiddleware, uploadImage: uploadImageMiddleware } = require('../middleware/upload');

console.log('✅ Cargando rutas de Marco Normativo...');

// ============================================
// 📢 PÚBLICO (sin autenticación)
// ============================================

// GET /api/marco-normativo → destacados + acordeón por categorías
router.get('/', controller.getMarcoNormativoPublico);

// ============================================
// 🔒 PROTEGIDAS (a partir de aquí)
// ============================================
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'EDITOR_AUDITORIA'));

// -------- Uploads --------
// Deben ir ANTES de '/:id' para no ser capturadas por el parámetro.
router.post('/upload-pdf', uploadPDFMiddleware.single('pdf'), controller.uploadPDF);
router.post('/upload-imagen', uploadImageMiddleware.single('imagen'), controller.uploadImagen);

// -------- Catálogos --------
router.get('/categorias', controller.getCategorias);

// -------- Listado admin --------
router.get('/admin', controller.getMarcoNormativoAdmin);

// -------- Restaurar --------
router.patch('/:id/restore', controller.restoreMarcoNormativo);

// -------- CRUD --------
router.get('/:id', controller.getMarcoNormativoById);
router.post('/', controller.createMarcoNormativo);
router.put('/:id', controller.updateMarcoNormativo);
router.delete('/:id', controller.deleteMarcoNormativo);

console.log('✅ Rutas de Marco Normativo configuradas');

module.exports = router;
