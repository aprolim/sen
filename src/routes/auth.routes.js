const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const validators = require('../utils/validators');

// Ruta pública: Login
router.post('/login', validators.login, validate, authController.login);

// Ruta pública: Registrar ciudadano
router.post('/register', validators.register, validate, authController.register);

// Ruta pública: Validar token
router.post('/validate', authController.validateToken);

// Ruta protegida: Obtener usuario actual
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;