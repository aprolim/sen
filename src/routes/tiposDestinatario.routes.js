// src/routes/tiposDestinatario.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/tiposDestinatario.controller');
const { authenticate, authorize } = require('../middleware/auth');

console.log('✅ Cargando rutas de tipos de destinatario...');

// ============================================
// 📡 PÚBLICO (solo lectura, para poblar selects del CMS)
// ============================================
router.get('/', controller.getTiposDestinatario);

// ============================================
// 🔐 PROTEGIDAS (CRUD desde el CMS)
// ============================================
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'EDITOR_AUDITORIA'));

router.post('/', controller.createTipoDestinatario);
router.put('/:id', controller.updateTipoDestinatario);
router.delete('/:id', controller.deleteTipoDestinatario);

// Seed (solo SUPER_ADMIN y ADMIN)
router.post(
  '/seed',
  authorize('SUPER_ADMIN', 'ADMIN'),
  controller.seedTiposDestinatario
);

console.log('✅ Rutas de tipos de destinatario configuradas');

module.exports = router;