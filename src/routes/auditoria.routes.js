// src/routes/auditoria.routes.js
const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoria.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadPDF } = require('../middleware/upload');

console.log('✅ Cargando rutas de auditoría...');

// ============================================
// 📡 RUTAS PÚBLICAS
// ============================================

// GET /api/auditoria/poa-uai - Listar POAs (solo publicados)
router.get('/poa-uai', auditoriaController.getPOAsPublic);

// ============================================
// 🔐 RUTAS PROTEGIDAS (ADMIN)
// ============================================
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'));

// -------- UPLOAD PDF (debe ir antes de /:id) --------
// POST /api/auditoria/poa-uai/upload-pdf
router.post(
  '/poa-uai/upload-pdf',
  uploadPDF.single('pdf'),
  auditoriaController.uploadPDF
);

// -------- ESTADÍSTICAS --------
// GET /api/auditoria/poa-uai/stats
router.get('/poa-uai/stats', auditoriaController.getStats);

// -------- LISTADO ADMIN --------
// GET /api/auditoria/poa-uai/admin
router.get('/poa-uai/admin', auditoriaController.getPOAsAdmin);

// -------- CRUD --------
// GET    /api/auditoria/poa-uai/:id
// POST   /api/auditoria/poa-uai
// PUT    /api/auditoria/poa-uai/:id
// DELETE /api/auditoria/poa-uai/:id
// PATCH  /api/auditoria/poa-uai/:id/toggle
router.get('/poa-uai/:id', auditoriaController.getPOAById);
router.post('/poa-uai', auditoriaController.createPOA);
router.put('/poa-uai/:id', auditoriaController.updatePOA);
router.delete('/poa-uai/:id', auditoriaController.deletePOA);
router.patch('/poa-uai/:id/toggle', auditoriaController.toggleActivo);

console.log('✅ Rutas de auditoría configuradas correctamente');

module.exports = router;