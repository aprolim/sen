// src/routes/sesiones.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const sesionesController = require('../controllers/sesiones.controller');

// ============================================
// RUTAS PÚBLICAS
// ============================================
router.get('/', sesionesController.getVideos);
router.get('/live', sesionesController.getLiveVideo);
router.get('/fechas', sesionesController.getFechasSesiones);

// ============================================
// RUTAS PROTEGIDAS (CMS)
// ============================================
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'));

router.get('/admin', sesionesController.getAllVideos);
router.post('/', sesionesController.createVideo);
router.put('/:position', sesionesController.updateVideo);
router.delete('/:position', sesionesController.deleteVideo);

router.get('/fechas/admin', sesionesController.getFechasSesionesAdmin);
router.post('/fechas', sesionesController.createFechaSesion);
router.put('/fechas/:fechaId', sesionesController.updateFechaSesion);
router.delete('/fechas/:fechaId', sesionesController.deleteFechaSesion);

module.exports = router;