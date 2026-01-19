const { body } = require('express-validator');

const userValidators = {
  register: [
    body('email')
      .isEmail().withMessage('Debe ser un email válido')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('El apellido debe tener al menos 2 caracteres'),
    body('ci')
      .optional()
      .trim()
      .isLength({ min: 5 }).withMessage('La cédula debe tener al menos 5 caracteres'),
    body('phone')
      .optional()
      .trim()
      .isMobilePhone().withMessage('Debe ser un número de teléfono válido'),
  ],
  
  login: [
    body('email')
      .isEmail().withMessage('Debe ser un email válido')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('La contraseña es requerida'),
  ],
  
  updateUser: [
    body('email')
      .optional()
      .isEmail().withMessage('Debe ser un email válido')
      .normalizeEmail(),
    body('password')
      .optional()
      .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('El apellido debe tener al menos 2 caracteres'),
  ],
};

module.exports = userValidators;