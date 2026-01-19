const { validationResult } = require('express-validator');

/**
 * Middleware para validar los resultados de express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
      })),
    });
  }
  
  next();
};

module.exports = validate;