const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const validators = require('../utils/validators');

// Todas las rutas requieren autenticación
router.use(authenticate);

// Crear usuario (admin+ only)
router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN'),
  validators.register,
  validate,
  usersController.createUser
);

// Obtener usuarios (admin+ only)
router.get(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  usersController.getUsers
);

// Obtener usuario por ID
router.get('/:id', usersController.getUserById);

// Actualizar usuario
router.put(
  '/:id',
  validators.updateUser,
  validate,
  usersController.updateUser
);

// Eliminar usuario (super admin only)
router.delete(
  '/:id',
  authorize('SUPER_ADMIN'),
  usersController.deleteUser
);

module.exports = router;