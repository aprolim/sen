// src/controllers/tabs.controller.js
const TabLink = require('../models/TabLink');

/**
 * @swagger
 * tags:
 *   name: Tabs
 *   description: Contenido dinámico para las pestañas del frontend
 */

class TabsController {
  /**
   * @swagger
   * /api/tabs:
   *   get:
   *     summary: Obtener datos completos para las pestañas
   *     tags: [Tabs]
   *     responses:
   *       200:
   *         description: Datos de pestañas obtenidos exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     tabs:
   *                       type: array
   *                     areas:
   *                       type: object
   *                     links:
   *                       type: object
   */
  async getTabsData(req, res) {
    try {
      // Datos estáticos de las pestañas (podrían moverse a BD si se requiere)
      const tabs = [
        { id: 'legislacion', label: 'Legislación', icono: '📋' },
        { id: 'fiscalizacion', label: 'Fiscalización', icono: '🔍' },
        { id: 'gestion', label: 'Gestión', icono: '⚙️' }
      ];

      // Obtener TODOS los links activos desde MongoDB, ordenados por tabId y orden
      const activeLinks = await TabLink.find({ isActive: true })
                                       .sort({ tabId: 1, orden: 1 })
                                       .lean();

      // Si no hay links en la BD, devolver arrays vacíos con mensaje informativo
      if (!activeLinks || activeLinks.length === 0) {
        console.warn('⚠️ No se encontraron links en la base de datos. Ejecuta el script de seed.');
        return res.json({
          success: true,
          data: {
            tabs,
            areas: {},
            links: {
              legislacion: [],
              fiscalizacion: [],
              gestion: []
            },
            message: 'No hay links configurados. Contacte al administrador.'
          }
        });
      }

      // Construir la estructura 'areas' y 'links' dinámicamente
      const areas = {};
      const links = {
        legislacion: [],
        fiscalizacion: [],
        gestion: []
      };

      // Procesar cada link
      activeLinks.forEach(item => {
        const tabId = item.tabId;

        // Construir/Actualizar el área (tomamos los datos del primer link de esa tabId)
        if (!areas[tabId]) {
          areas[tabId] = {
            titulo: item.areaTitulo,
            descripcion: item.areaDescripcion
          };
        }

        // Agregar el link a su categoría correspondiente
        if (links[tabId]) {
          links[tabId].push({
            id: item.linkId,
            titulo: item.titulo,
            descripcion: item.descripcion,
            icono: item.icono, // SVG completo desde la BD
            path: item.path
          });
        }
      });

      // Respuesta exitosa
      res.json({
        success: true,
        data: { 
          tabs, 
          areas, 
          links 
        }
      });

    } catch (error) {
      console.error('🔥 Error en getTabsData:', error);
      
      // Error response
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener datos de pestañas',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * @swagger
   * /api/tabs/{tabId}:
   *   get:
   *     summary: Obtener links de una pestaña específica
   *     tags: [Tabs]
   *     parameters:
   *       - in: path
   *         name: tabId
   *         required: true
   *         schema:
   *           type: string
   *           enum: [legislacion, fiscalizacion, gestion]
   *     responses:
   *       200:
   *         description: Links de la pestaña obtenidos
   */
  async getTabLinks(req, res) {
    try {
      const { tabId } = req.params;
      
      // Validar tabId
      if (!['legislacion', 'fiscalizacion', 'gestion'].includes(tabId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de pestaña inválido'
        });
      }

      // Obtener links de la pestaña específica
      const links = await TabLink.find({ 
        tabId, 
        isActive: true 
      })
      .sort({ orden: 1 })
      .lean();

      res.json({
        success: true,
        data: links
      });

    } catch (error) {
      console.error('🔥 Error en getTabLinks:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = new TabsController();