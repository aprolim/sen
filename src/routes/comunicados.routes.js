// src/routes/comunicados.routes.js
const express = require('express');
const router = express.Router();
const comunicadosController = require('../controllers/comunicados.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

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

// 🔥 UPLOADS - DEBEN IR ANTES DE /:id
router.post(
  '/upload/image',
  upload.single('imagen'),
  comunicadosController.uploadImage
);

router.post(
  '/upload/pdf',
  upload.single('pdf'),
  comunicadosController.uploadPDF
);

// CRUD
router.get('/', comunicadosController.getComunicados);
router.get('/stats', comunicadosController.getStats);
router.post('/force-update', comunicadosController.forceUpdateEstados);
router.get('/:id', comunicadosController.getComunicadoById);
router.post('/', comunicadosController.createComunicado);
router.put('/:id', comunicadosController.updateComunicado);
router.patch('/:id/estado', comunicadosController.changeEstado);
router.delete('/:id', comunicadosController.deleteComunicado);

module.exports = router;