// src/routes/comunicados.routes.js
const express = require('express');
const router = express.Router();
const comunicadosController = require('../controllers/comunicados.controller');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================
// 📡 RUTAS PÚBLICAS
// ============================================
router.get('/activo', comunicadosController.getComunicadoActivo);
router.get('/expirados', comunicadosController.getComunicadosExpirados);

// ============================================
// 🔐 RUTAS PROTEGIDAS (ADMIN)
// ============================================
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'));

// CRUD
router.get('/', comunicadosController.getComunicados);
router.get('/stats', comunicadosController.getStats);
router.get('/:id', comunicadosController.getComunicadoById);
router.post('/', comunicadosController.createComunicado);
router.put('/:id', comunicadosController.updateComunicado);
router.patch('/:id/estado', comunicadosController.changeEstado);
router.delete('/:id', comunicadosController.deleteComunicado);

// Acciones especiales
router.post('/force-update', comunicadosController.forceUpdateEstados);

module.exports = router;