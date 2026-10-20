// src/routes/legislativosCatalogos.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/legislativosCatalogos.controller');
const { authenticate, authorize } = require('../middleware/auth');

console.log('✅ Cargando rutas de catálogos legislativos...');

// ============================================
// 📡 RUTAS PÚBLICAS (solo lectura)
// ============================================
// Las usan los multi-select del CMS y cualquier consumidor.
router.get('/senadores', controller.getSenadores);
router.get('/comisiones', controller.getComisiones);

// ============================================
// 🔐 RUTAS PROTEGIDAS (a partir de aquí)
// ============================================
router.use(authenticate);
router.use(
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'EDITOR_AUDITORIA')
);

// -------- Senadores --------
router.post('/senadores', controller.createSenador);
router.put('/senadores/:id', controller.updateSenador);
router.delete('/senadores/:id', controller.deleteSenador);

// -------- Comisiones --------
router.post('/comisiones', controller.createComision);
router.put('/comisiones/:id', controller.updateComision);
router.delete('/comisiones/:id', controller.deleteComision);

// -------- Seed (solo SUPER_ADMIN y ADMIN) --------
router.post(
  '/seed',
  authorize('SUPER_ADMIN', 'ADMIN'),
  controller.seedCatalogos
);

console.log('✅ Rutas de catálogos legislativos configuradas');

module.exports = router;