// src/routes/icons.routes.js
const express = require('express');
const router = express.Router();
const iconsController = require('../controllers/icons.controller');

console.log('✅ Cargando rutas de iconos...');

// Rutas públicas para iconos maestros
router.get('/master', iconsController.getMasterIcons);
router.get('/categories', iconsController.getIconCategories);

module.exports = router;