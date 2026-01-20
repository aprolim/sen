const authService = require('../services/auth.service');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación de usuarios
 */

class AuthController {
  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Iniciar sesión
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 format: password
   *     responses:
   *       200:
   *         description: Login exitoso
   *       400:
   *         description: Error en los datos
   *       401:
   *         description: Credenciales inválidas
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      const result = await authService.login(email, password);
      
      res.json({
        success: true,
        message: 'Login exitoso',
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }
  
  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     tags: [Auth]
   *     summary: Registrar nuevo usuario
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 format: password
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               ci:
   *                 type: string
   *               phone:
   *                 type: string
   *     responses:
   *       201:
   *         description: Usuario registrado exitosamente
   *       400:
   *         description: Error en los datos
   *       409:
   *         description: El email ya está registrado
   */
  async register(req, res) {
    try {
      const userData = req.body;
      
      const result = await authService.register(userData);
      
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
  
  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     tags: [Auth]
   *     summary: Obtener información del usuario actual
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Información del usuario
   *       401:
   *         description: No autenticado
   */
  async getCurrentUser(req, res) {
    try {
      const result = await authService.getCurrentUser(req.user._id);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
  
  /**
   * @swagger
   * /api/auth/validate:
   *   post:
   *     tags: [Auth]
   *     summary: Validar token JWT
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *             properties:
   *               token:
   *                 type: string
   *     responses:
   *       200:
   *         description: Token válido o inválido
   */
  async validateToken(req, res) {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.json({
          success: false,
          valid: false,
          message: 'Token no proporcionado',
        });
      }
      
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      res.json({
        success: true,
        valid: true,
        decoded,
      });
    } catch (error) {
      res.json({
        success: false,
        valid: false,
        message: error.message,
      });
    }
  }
}

module.exports = new AuthController();