// src/routes/catalogos.routes.js
const express = require('express');
const router = express.Router();
const catalogosController = require('../controllers/catalogos.controller');
const { authenticate } = require('../middleware/auth');

// Rutas protegidas (solo para el CMS)
router.use(authenticate);

router.get('/senadores', catalogosController.getSenadores);
router.get('/comisiones', catalogosController.getComisiones);

module.exports = router;