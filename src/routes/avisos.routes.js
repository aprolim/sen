// src/routes/avisos.routes.js
const express = require('express');
const router = express.Router();
const avisosController = require('../controllers/avisos.controller');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================
// 📡 RUTAS PÚBLICAS
// ============================================
router.get('/', avisosController.getAvisos);
router.get('/tipos', avisosController.getTipos);

// ============================================
// 🔐 RUTAS PROTEGIDAS (ADMIN)
// ============================================
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'));

// CRUD
router.get('/admin', avisosController.getAvisosAdmin);
router.get('/stats', avisosController.getStats);
router.get('/:id', avisosController.getAvisoById);
router.post('/', avisosController.createAviso);
router.put('/:id', avisosController.updateAviso);
router.patch('/:id/toggle', avisosController.toggleActivo);
router.delete('/:id', avisosController.deleteAviso);

module.exports = router;