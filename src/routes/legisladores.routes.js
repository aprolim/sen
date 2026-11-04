// src/routes/legisladores.routes.js
const express = require('express');
const router = express.Router();
const legisladoresController = require('../controllers/legisladores.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

console.log('✅ Cargando rutas de legisladores...');

// ============================================
// RUTAS PÚBLICAS (NO REQUIEREN AUTENTICACIÓN)
// ============================================

// 🔥 DIRECTIVA PÚBLICA (mismo formato de siempre)
router.get('/directiva', legisladoresController.getDirectivaCamaral);

router.get('/', legisladoresController.getLegisladores);
router.get('/comisiones', legisladoresController.getComisiones);
router.get('/cargos', legisladoresController.getCargosDisponibles);
router.get('/estados', legisladoresController.getEstadosDisponibles);
router.get('/distribution/party', legisladoresController.getDistributionByParty);
router.get('/distribution/department', legisladoresController.getByDepartamento);
router.get('/comisiones/activas', legisladoresController.getComisionesActivas);
router.get('/search', legisladoresController.searchLegisladores);
router.get('/ci/:ci', legisladoresController.getLegisladorByCI);
router.get('/:id', legisladoresController.getLegisladorById);

// ============================================
// RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN)
// ============================================
router.use(authenticate);

// ============================================
// 🔥 DIRECTIVA - CRUD (CMS)
// ⚠️ IMPORTANTE: Las rutas específicas de directiva
//    van ANTES que /:id para evitar colisiones.
//    Aunque ya están antes en el archivo público,
//    las volvemos a declarar aquí con autorización.
// ============================================
router.get(
  '/directiva/admin',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  legisladoresController.getDirectivaAdmin
);

router.get(
  '/directiva/titulares',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  legisladoresController.getTitularesDisponibles
);

router.put(
  '/directiva',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  legisladoresController.saveDirectiva
);

router.post(
  '/directiva/seed',
  authorize('SUPER_ADMIN', 'ADMIN'),
  legisladoresController.seedDirectiva
);

// ============================================
// CRUD GENERAL DE LEGISLADORES
// ============================================
router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  legisladoresController.createLegislador
);

router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  legisladoresController.updateLegislador
);

router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN'),
  legisladoresController.deleteLegislador
);

router.get(
  '/stats',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  legisladoresController.getStats
);

router.post(
  '/upload/foto',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  upload.single('foto'),
  legisladoresController.uploadFotoPerfil
);

console.log('✅ Rutas de legisladores configuradas correctamente');

module.exports = router;