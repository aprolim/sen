// src/routes/tabs.routes.js
const express = require('express');
const router = express.Router();
const tabsController = require('../controllers/tabs.controller');
const { authenticate, authorize } = require('../middleware/auth');

console.log('✅ Cargando rutas de tabs...');

// ===== RUTAS PÚBLICAS (NO REQUIEREN TOKEN) =====
router.get('/', (req, res) => {
  console.log('📌 GET /api/tabs - Pública');
  tabsController.getTabsData(req, res);
});

router.get('/icons/gallery', (req, res) => {
  console.log('📌 GET /api/tabs/icons/gallery - Pública');
  tabsController.getIconsGallery(req, res);
});

router.get('/categories', (req, res) => {
  console.log('📌 GET /api/tabs/categories - Pública');
  tabsController.getCategories(req, res);
});

router.get('/categories/:categoryId', (req, res) => {
  console.log(`📌 GET /api/tabs/categories/${req.params.categoryId} - Pública`);
  tabsController.getCategoryById(req, res);
});

// ===== MIDDLEWARE DE AUTENTICACIÓN =====
// A PARTIR DE AQUÍ, TODAS LAS RUTAS REQUIEREN TOKEN
console.log('🔐 Activando middleware de autenticación para rutas protegidas');
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'));

// ===== RUTAS PROTEGIDAS (REQUIEREN TOKEN) =====
// ⚠️ IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros
router.get('/links', (req, res) => {
  console.log('📌 GET /api/tabs/links - Protegida');
  tabsController.getAllLinks(req, res);
});

router.post('/links', (req, res) => {
  console.log('📌 POST /api/tabs/links - Protegida');
  tabsController.createLink(req, res);
});

router.post('/links/reorder', (req, res) => {
  console.log('📌 POST /api/tabs/links/reorder - Protegida');
  tabsController.reorderLinks(req, res);
});

// Rutas con parámetros (estas deben ir DESPUÉS de las rutas específicas)
router.get('/links/:linkId', (req, res) => {
  console.log('📌 GET /api/tabs/links/:linkId - Protegida');
  tabsController.getLinkById(req, res);
});

router.put('/links/:linkId', (req, res) => {
  console.log('📌 PUT /api/tabs/links/:linkId - Protegida');
  tabsController.updateLink(req, res);
});

router.delete('/links/:linkId', (req, res) => {
  console.log('📌 DELETE /api/tabs/links/:linkId - Protegida');
  tabsController.deleteLink(req, res);
});

// Categorías (protegidas)
router.post('/categories', (req, res) => {
  console.log('📌 POST /api/tabs/categories - Protegida');
  tabsController.createCategory(req, res);
});

router.put('/categories/:categoryId', (req, res) => {
  console.log('📌 PUT /api/tabs/categories/:categoryId - Protegida');
  tabsController.updateCategory(req, res);
});

router.delete('/categories/:categoryId', (req, res) => {
  console.log('📌 DELETE /api/tabs/categories/:categoryId - Protegida');
  tabsController.deleteCategory(req, res);
});

// ESTA RUTA DEBE IR AL FINAL (es la más genérica)
router.get('/:tabId', (req, res) => {
  console.log('📌 GET /api/tabs/:tabId - Pública');
  tabsController.getTabLinks(req, res);
});

console.log('✅ Rutas de tabs configuradas correctamente');
module.exports = router;