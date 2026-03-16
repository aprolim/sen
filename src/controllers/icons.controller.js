// src/controllers/icons.controller.js
const masterIcons = require('../data/masterIcons');

/**
 * @swagger
 * tags:
 *   name: Icons
 *   description: Iconos maestros del sistema
 */

class IconsController {
  /**
   * @swagger
   * /api/icons/master:
   *   get:
   *     summary: Obtener lista maestra de iconos
   *     tags: [Icons]
   *     responses:
   *       200:
   *         description: Lista de iconos disponibles
   */
  async getMasterIcons(req, res) {
    try {
      console.log('📦 Enviando lista maestra de iconos');
      
      res.json({
        success: true,
        data: {
          icons: masterIcons,
          total: masterIcons.length
        }
      });
    } catch (error) {
      console.error('🔥 Error en getMasterIcons:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener iconos maestros'
      });
    }
  }

  /**
   * @swagger
   * /api/icons/categories:
   *   get:
   *     summary: Obtener categorías de iconos
   *     tags: [Icons]
   *     responses:
   *       200:
   *         description: Categorías disponibles
   */
  async getIconCategories(req, res) {
    try {
      const categories = [...new Set(masterIcons.map(icon => icon.categoria))];
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('🔥 Error en getIconCategories:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new IconsController();