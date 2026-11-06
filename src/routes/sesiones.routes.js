// src/routes/sesiones.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const sesionesController = require('../controllers/sesiones.controller');

// ============================================
// 🔒 Helper: bind seguro de métodos de clase
// Evita "this undefined" al pasar métodos
// como callback directo a Express.
// ============================================
const bind = (fn) => fn.bind(sesionesController);

// ============================================
// RUTAS PÚBLICAS
// ============================================
router.get('/', bind(sesionesController.getVideos));
router.get('/live', bind(sesionesController.getLiveVideo));
router.get('/fechas', bind(sesionesController.getFechasSesiones));

// ============================================
// RUTAS PROTEGIDAS (CMS)
// ============================================
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'EDITOR_SESIONES'));

// Videos (admin)
router.get('/admin', bind(sesionesController.getAllVideos));
router.post('/', bind(sesionesController.createVideo));
router.put('/:position', bind(sesionesController.updateVideo));
router.delete('/:position', bind(sesionesController.deleteVideo));

// Fechas de sesiones (admin)
router.get('/fechas/admin', bind(sesionesController.getFechasSesionesAdmin));
router.post('/fechas', bind(sesionesController.createFechaSesion));
router.put('/fechas/:fechaId', bind(sesionesController.updateFechaSesion));
router.delete('/fechas/:fechaId', bind(sesionesController.deleteFechaSesion));

module.exports = router;