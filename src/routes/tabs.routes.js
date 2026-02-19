// src/routes/tabs.routes.js
const express = require('express');
const router = express.Router();
const tabsController = require('../controllers/tabs.controller');

/**
 * @swagger
 * tags:
 *   name: Tabs
 *   description: Endpoints para contenido dinámico de pestañas
 */

// Rutas públicas para tabs
router.get('/', tabsController.getTabsData);
router.get('/:tabId', tabsController.getTabLinks);

module.exports = router;