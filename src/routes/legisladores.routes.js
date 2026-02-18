const express = require('express');
const router = express.Router();
const legisladoresController = require('../controllers/legisladores.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Rutas públicas
router.get('/', legisladoresController.getLegisladores);
router.get('/cargos', legisladoresController.getCargosDisponibles);
router.get('/estados', legisladoresController.getEstadosDisponibles);
router.get('/distribution/party', legisladoresController.getDistributionByParty);
router.get('/distribution/department', legisladoresController.getByDepartamento);
router.get('/comisiones', legisladoresController.getComisionesActivas);
router.get('/search', legisladoresController.searchLegisladores);
router.get('/ci/:ci', legisladoresController.getLegisladorByCI);
router.get('/:id', legisladoresController.getLegisladorById);

// Rutas protegidas (requieren autenticación)
router.use(authenticate);

// Rutas de administración (admin/editor)
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

// Rutas solo para super admin y admin
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

// Rutas para subir archivos
router.post(
  '/upload/foto',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  upload.single('foto'),
  legisladoresController.uploadFotoPerfil
);

module.exports = router;