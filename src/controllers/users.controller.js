const usersService = require('../services/users.service');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios
 */

class UsersController {
  /**
   * @swagger
   * /api/users:
   *   post:
   *     summary: Crear nuevo usuario (admin only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
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
   *               role:
   *                 type: string
   *                 enum: [ADMIN, EDITOR, MODERATOR, VIEWER, CITIZEN]
   *               status:
   *                 type: string
   *                 enum: [ACTIVE, INACTIVE, SUSPENDED, PENDING]
   *               profile:
   *                 type: object
   *     responses:
   *       201:
   *         description: Usuario creado exitosamente
   *       400:
   *         description: Error en los datos
   *       403:
   *         description: No autorizado
   */
  async createUser(req, res) {
    try {
      const userData = req.body;
      const creatorRole = req.user.role;
      
      const user = await usersService.createUser(userData, creatorRole);
      
      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: user,
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
   * /api/users:
   *   get:
   *     summary: Obtener lista de usuarios
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *           enum: [SUPER_ADMIN, ADMIN, EDITOR, MODERATOR, VIEWER, CITIZEN]
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [ACTIVE, INACTIVE, SUSPENDED, PENDING]
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Lista de usuarios
   *       401:
   *         description: No autenticado
   */
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 10, role, status, search } = req.query;
      
      const filters = {};
      if (role) filters.role = role;
      if (status) filters.status = status;
      if (search) filters.search = search;
      
      const result = await usersService.getUsers(
        parseInt(page),
        parseInt(limit),
        filters
      );
      
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
   * /api/users/{id}:
   *   get:
   *     summary: Obtener usuario por ID
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Usuario encontrado
   *       404:
   *         description: Usuario no encontrado
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      const user = await usersService.getUserById(id);
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }
  
  /**
   * @swagger
   * /api/users/{id}:
   *   put:
   *     summary: Actualizar usuario
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               profile:
   *                 type: object
   *               role:
   *                 type: string
   *                 enum: [ADMIN, EDITOR, MODERATOR, VIEWER, CITIZEN]
   *               status:
   *                 type: string
   *                 enum: [ACTIVE, INACTIVE, SUSPENDED, PENDING]
   *     responses:
   *       200:
   *         description: Usuario actualizado
   *       403:
   *         description: No autorizado
   *       404:
   *         description: Usuario no encontrado
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updaterRole = req.user.role;
      
      const user = await usersService.updateUser(id, updateData, updaterRole);
      
      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: user,
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
   * /api/users/{id}:
   *   delete:
   *     summary: Eliminar usuario (super admin only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Usuario eliminado
   *       403:
   *         description: No autorizado
   *       404:
   *         description: Usuario no encontrado
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const deleterRole = req.user.role;
      
      const result = await usersService.deleteUser(id, deleterRole);
      
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new UsersController();