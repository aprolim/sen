// ============================================
// src/controllers/tabs.controller.js (COMPLETO)
// ============================================
const TabLink = require('../models/TabLink');
const TabCategory = require('../models/TabCategory');

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
   */
  async getTabsData(req, res) {
    try {
      // Obtener TODAS las categorías activas
      const categories = await TabCategory.find({ isActive: true })
        .sort({ order: 1 })
        .lean();

      // Obtener TODOS los links activos
      const activeLinks = await TabLink.find({ isActive: true })
        .sort({ categoryId: 1, orden: 1 })
        .lean();

      // Si no hay categorías, devolver estructura vacía
      if (!categories || categories.length === 0) {
        console.warn('⚠️ No se encontraron categorías en la base de datos. Ejecuta el script de seed.');
        return res.json({
          success: true,
          data: {
            tabs: [],
            areas: {},
            links: {},
            message: 'No hay categorías configuradas. Contacte al administrador.'
          }
        });
      }

      // Construir la respuesta dinámica basada en las categorías
      const tabs = categories.map(cat => ({
        id: cat.categoryId,
        label: cat.name,
        icono: cat.icon,
        color: cat.color
      }));

      const areas = {};
      const links = {};

      // Inicializar áreas y links para cada categoría
      categories.forEach(cat => {
        areas[cat.categoryId] = {
          titulo: cat.name,
          descripcion: cat.description,
          color: cat.color
        };
        
        links[cat.categoryId] = [];
      });

      // Poblar los links en sus categorías correspondientes
      activeLinks.forEach(item => {
        const categoryId = item.categoryId;
        
        // Solo agregar si la categoría existe
        if (links[categoryId]) {
          links[categoryId].push({
            id: item.linkId,
            titulo: item.titulo,
            descripcion: item.descripcion,
            icono: item.icono,
            path: item.path
          });
        }
      });

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
   *     responses:
   *       200:
   *         description: Links de la pestaña obtenidos
   */
  async getTabLinks(req, res) {
    try {
      const { tabId } = req.params;
      
      // Verificar que la categoría existe
      const category = await TabCategory.findOne({ categoryId: tabId, isActive: true });
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Pestaña no encontrada'
        });
      }

      // Obtener links de la categoría específica
      const links = await TabLink.find({ 
        categoryId: tabId, 
        isActive: true 
      })
      .sort({ orden: 1 })
      .lean();

      res.json({
        success: true,
        data: {
          category: {
            id: category.categoryId,
            name: category.name,
            description: category.description,
            color: category.color
          },
          links
        }
      });

    } catch (error) {
      console.error('🔥 Error en getTabLinks:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // ===== FUNCIONES PARA CATEGORÍAS (CMS) =====

  /**
   * @swagger
   * /api/tabs/categories:
   *   get:
   *     summary: Obtener todas las categorías
   *     tags: [Tabs]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de categorías
   */
  async getCategories(req, res) {
    try {
      const { includeInactive = false } = req.query;
      
      const query = {};
      if (!includeInactive) query.isActive = true;

      const categories = await TabCategory.find(query)
        .sort({ order: 1 })
        .populate('createdBy', 'email profile')
        .populate('lastUpdatedBy', 'email profile')
        .lean();

      // Para cada categoría, contar cuántos links tiene
      const categoriesWithCount = await Promise.all(
        categories.map(async (cat) => {
          const linksCount = await TabLink.countDocuments({ 
            categoryId: cat.categoryId,
            isActive: true 
          });
          return { ...cat, linksCount };
        })
      );

      res.json({
        success: true,
        data: categoriesWithCount
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/tabs/categories/{categoryId}:
   *   get:
   *     summary: Obtener una categoría específica por ID
   *     tags: [Tabs]
   *     parameters:
   *       - in: path
   *         name: categoryId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Categoría encontrada
   *       404:
   *         description: Categoría no encontrada
   */
  async getCategoryById(req, res) {
    try {
      console.log(`🔍 Buscando categoría: ${req.params.categoryId}`);
      
      const { categoryId } = req.params;
      
      const category = await TabCategory.findOne({ categoryId })
        .populate('createdBy', 'email profile')
        .populate('lastUpdatedBy', 'email profile')
        .lean();
      
      if (!category) {
        console.log(`❌ Categoría no encontrada: ${categoryId}`);
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }
      
      console.log(`✅ Categoría encontrada: ${category.name}`);
      
      // Contar links activos
      const linksCount = await TabLink.countDocuments({ 
        categoryId, 
        isActive: true 
      });
      
      res.json({
        success: true,
        data: { ...category, linksCount }
      });
      
    } catch (error) {
      console.error('🔥 Error en getCategoryById:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la categoría'
      });
    }
  }

  /**
   * @swagger
   * /api/tabs/categories:
   *   post:
   *     summary: Crear nueva categoría
   *     tags: [Tabs]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - categoryId
   *               - name
   *             properties:
   *               categoryId:
   *                 type: string
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               order:
   *                 type: number
   *               color:
   *                 type: string
   *               icon:
   *                 type: string
   *     responses:
   *       201:
   *         description: Categoría creada
   */
  async createCategory(req, res) {
    try {
      const { categoryId, name, description, order, color, icon } = req.body;

      // Validar categoryId (solo letras, números y guiones)
      const idRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!idRegex.test(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido. Use solo letras minúsculas, números y guiones'
        });
      }

      // Verificar si ya existe
      const existing = await TabCategory.findOne({ categoryId });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una categoría con ese ID'
        });
      }

      const category = new TabCategory({
        categoryId,
        name,
        description,
        order: order || 0,
        color: color || '#e03735',
        icon,
        createdBy: req.user._id,
        lastUpdatedBy: req.user._id
      });

      await category.save();

      res.status(201).json({
        success: true,
        message: 'Categoría creada exitosamente',
        data: category
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/tabs/categories/{categoryId}:
   *   put:
   *     summary: Actualizar categoría
   *     tags: [Tabs]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: categoryId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               order:
   *                 type: number
   *               color:
   *                 type: string
   *               icon:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Categoría actualizada
   */
  async updateCategory(req, res) {
    try {
      console.log('\n🔵 UPDATE CATEGORY - INICIANDO');
      console.log('📌 req.user desde middleware:', req.user ? req.user.email : 'UNDEFINED');
      console.log('📌 Params:', req.params);
      console.log('📌 Body:', req.body);
      
      const { categoryId } = req.params;
      const updates = req.body;

      // Verificar que req.user existe (debería venir del middleware)
      if (!req.user) {
        console.log('❌ Error: req.user no está definido');
        return res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
      }

      const category = await TabCategory.findOne({ categoryId });
      
      if (!category) {
        console.log('❌ Categoría no encontrada:', categoryId);
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      // Campos permitidos para actualizar
      const allowedUpdates = ['name', 'description', 'order', 'color', 'icon', 'isActive'];
      
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          category[field] = updates[field];
          console.log(`   ✅ ${field} actualizado`);
        }
      });

      category.lastUpdatedBy = req.user._id;
      await category.save();

      console.log('✅ Categoría actualizada exitosamente por:', req.user.email);

      res.json({
        success: true,
        message: 'Categoría actualizada exitosamente',
        data: category
      });
    } catch (error) {
      console.error('🔥 Error en updateCategory:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/tabs/categories/{categoryId}:
   *   delete:
   *     summary: Eliminar categoría (soft delete)
   *     tags: [Tabs]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: categoryId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Categoría eliminada
   */
  async deleteCategory(req, res) {
    try {
      const { categoryId } = req.params;

      // Verificar si hay links activos usando esta categoría
      const activeLinksCount = await TabLink.countDocuments({ 
        categoryId, 
        isActive: true 
      });
      
      if (activeLinksCount > 0) {
        return res.status(400).json({
          success: false,
          message: `No se puede eliminar: ${activeLinksCount} links activos usan esta categoría. Desactive los links primero.`
        });
      }

      // Verificar si hay links inactivos
      const totalLinksCount = await TabLink.countDocuments({ categoryId });
      
      if (totalLinksCount > 0) {
        // Soft delete: marcar como inactiva pero mantener links inactivos
        const category = await TabCategory.findOne({ categoryId });
        category.isActive = false;
        category.lastUpdatedBy = req.user._id;
        await category.save();

        return res.json({
          success: true,
          message: 'Categoría desactivada. Los links asociados permanecen inactivos.'
        });
      }

      // Si no hay links, eliminar físicamente
      const category = await TabCategory.findOneAndDelete({ categoryId });
      
      res.json({
        success: true,
        message: 'Categoría eliminada permanentemente'
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // ===== FUNCIONES PARA LINKS (CMS) =====

  /**
   * @swagger
   * /api/tabs/links:
   *   post:
   *     summary: Crear nuevo link
   *     tags: [Tabs]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - categoryId
   *               - linkId
   *               - titulo
   *               - descripcion
   *               - icono
   *               - path
   *             properties:
   *               categoryId:
   *                 type: string
   *               linkId:
   *                 type: string
   *               titulo:
   *                 type: string
   *               descripcion:
   *                 type: string
   *               icono:
   *                 type: string
   *               path:
   *                 type: string
   *               orden:
   *                 type: number
   *     responses:
   *       201:
   *         description: Link creado
   */
  async createLink(req, res) {
    try {
      const { categoryId, linkId, titulo, descripcion, icono, path, orden } = req.body;

      // Verificar que la categoría existe y está activa
      const category = await TabCategory.findOne({ categoryId, isActive: true });
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'La categoría especificada no existe o no está activa'
        });
      }

      // Verificar que no exista el linkId
      const existing = await TabLink.findOne({ linkId });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un link con ese ID'
        });
      }

      const newLink = new TabLink({
        categoryId,
        areaTitulo: category.name,
        areaDescripcion: category.description,
        linkId,
        titulo,
        descripcion,
        icono,
        path,
        orden: orden || 0,
        createdBy: req.user._id,
        lastUpdatedBy: req.user._id,
        isActive: true
      });

      await newLink.save();

      res.status(201).json({
        success: true,
        message: 'Link creado exitosamente',
        data: newLink
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/tabs/links/{linkId}:
   *   put:
   *     summary: Actualizar link
   *     tags: [Tabs]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: linkId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               titulo:
   *                 type: string
   *               descripcion:
   *                 type: string
   *               icono:
   *                 type: string
   *               path:
   *                 type: string
   *               orden:
   *                 type: number
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Link actualizado
   */
  async updateLink(req, res) {
    try {
      const { linkId } = req.params;
      const updates = req.body;

      const link = await TabLink.findOne({ linkId });
      if (!link) {
        return res.status(404).json({
          success: false,
          message: 'Link no encontrado'
        });
      }

      // Actualizar campos permitidos
      const allowedUpdates = ['titulo', 'descripcion', 'icono', 'path', 'orden', 'isActive'];
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          link[field] = updates[field];
        }
      });

      link.lastUpdatedBy = req.user._id;
      await link.save();

      res.json({
        success: true,
        message: 'Link actualizado exitosamente',
        data: link
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/tabs/links/{linkId}:
   *   delete:
   *     summary: Eliminar link (soft delete)
   *     tags: [Tabs]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: linkId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Link eliminado
   */
  async deleteLink(req, res) {
    try {
      const { linkId } = req.params;
      
      const link = await TabLink.findOne({ linkId });
      if (!link) {
        return res.status(404).json({
          success: false,
          message: 'Link no encontrado'
        });
      }

      // Soft delete
      link.isActive = false;
      link.lastUpdatedBy = req.user._id;
      await link.save();

      res.json({
        success: true,
        message: 'Link desactivado exitosamente'
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/tabs/links:
   *   get:
   *     summary: Obtener todos los links (para administración)
   *     tags: [Tabs]
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
   *           default: 20
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: string
   *       - in: query
   *         name: includeInactive
   *         schema:
   *           type: boolean
   *           default: false
   *     responses:
   *       200:
   *         description: Lista de links
   */
  async getAllLinks(req, res) {
    try {
      const { page = 1, limit = 20, categoryId, includeInactive = false } = req.query;
      
      const query = {};
      if (categoryId) query.categoryId = categoryId;
      if (!includeInactive) query.isActive = true;

      const skip = (page - 1) * limit;
      
      const [links, total] = await Promise.all([
        TabLink.find(query)
          .sort({ categoryId: 1, orden: 1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('createdBy', 'email profile')
          .populate('lastUpdatedBy', 'email profile')
          .lean(),
        TabLink.countDocuments(query)
      ]);

      // Agregar información de la categoría a cada link
      const linksWithCategory = await Promise.all(
        links.map(async (link) => {
          const category = await TabCategory.findOne({ 
            categoryId: link.categoryId 
          }).lean();
          return {
            ...link,
            categoryName: category?.name,
            categoryColor: category?.color
          };
        })
      );

      res.json({
        success: true,
        data: {
          links: linksWithCategory,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/tabs/links/{linkId}:
   *   get:
   *     summary: Obtener un link específico
   *     tags: [Tabs]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: linkId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Link encontrado
   */
  async getLinkById(req, res) {
    try {
      const { linkId } = req.params;
      
      const link = await TabLink.findOne({ linkId })
        .populate('createdBy', 'email profile')
        .populate('lastUpdatedBy', 'email profile')
        .lean();

      if (!link) {
        return res.status(404).json({
          success: false,
          message: 'Link no encontrado'
        });
      }

      // Agregar información de la categoría
      const category = await TabCategory.findOne({ 
        categoryId: link.categoryId 
      }).lean();

      res.json({
        success: true,
        data: {
          ...link,
          categoryName: category?.name,
          categoryColor: category?.color
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/tabs/links/reorder:
   *   post:
   *     summary: Reordenar links de una categoría
   *     tags: [Tabs]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - categoryId
   *               - order
   *             properties:
   *               categoryId:
   *                 type: string
   *               order:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     linkId:
   *                       type: string
   *                     position:
   *                       type: number
   *     responses:
   *       200:
   *         description: Orden actualizado
   */
  async reorderLinks(req, res) {
    try {
      const { categoryId, order } = req.body; // order: [{ linkId, position }]
      
      // Verificar que la categoría existe
      const category = await TabCategory.findOne({ categoryId });
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      // Actualizar el orden de cada link
      const operations = order.map((item) => ({
        updateOne: {
          filter: { linkId: item.linkId, categoryId },
          update: { 
            $set: { 
              orden: item.position * 10, // Multiplicamos para dejar espacio entre inserts
              lastUpdatedBy: req.user._id 
            } 
          }
        }
      }));

      if (operations.length > 0) {
        await TabLink.bulkWrite(operations);
      }

      // Obtener los links actualizados para devolverlos
      const updatedLinks = await TabLink.find({ categoryId, isActive: true })
        .sort({ orden: 1 })
        .lean();

      res.json({
        success: true,
        message: 'Orden actualizado exitosamente',
        data: updatedLinks
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // ===== FUNCIÓN PARA GALERÍA DE ICONOS =====

  /**
   * @swagger
   * /api/tabs/icons/gallery:
   *   get:
   *     summary: Obtener galería de iconos disponibles
   *     tags: [Tabs]
   *     responses:
   *       200:
   *         description: Galería de iconos
   */
  async getIconsGallery(req, res) {
    try {
      console.log('📸 Obteniendo galería de iconos...');
      
      // Obtener todos los links activos
      const links = await TabLink.find({ isActive: true })
        .select('icono categoryId titulo')
        .lean();

      console.log(`📊 Encontrados ${links.length} links`);

      // Crear un mapa de iconos únicos por categoría
      const iconsByCategory = {};
      const allIcons = [];

      for (const link of links) {
        // Obtener información de la categoría para cada link
        const category = await TabCategory.findOne({ 
          categoryId: link.categoryId 
        }).lean();

        const categoryName = category?.name || link.categoryId;
        const categoryColor = category?.color || '#e03735';

        if (!iconsByCategory[link.categoryId]) {
          iconsByCategory[link.categoryId] = {
            categoryId: link.categoryId,
            categoryName: categoryName,
            categoryColor: categoryColor,
            icons: []
          };
        }

        // Verificar si este icono ya fue agregado (evitar duplicados)
        const existingIcon = iconsByCategory[link.categoryId].icons.find(
          i => i.icono === link.icono
        );

        if (!existingIcon) {
          const iconEntry = {
            id: `${link.categoryId}-${iconsByCategory[link.categoryId].icons.length + 1}`,
            icono: link.icono,
            ejemplo: link.titulo,
            preview: link.icono.substring(0, 100) + '...'
          };
          
          iconsByCategory[link.categoryId].icons.push(iconEntry);
          allIcons.push({
            ...iconEntry,
            categoryId: link.categoryId,
            categoryName: categoryName,
            categoryColor: categoryColor
          });
        }
      }

      console.log(`✅ Galería generada: ${allIcons.length} iconos únicos`);

      res.json({
        success: true,
        data: {
          byCategory: Object.values(iconsByCategory),
          all: allIcons,
          total: allIcons.length
        }
      });
    } catch (error) {
      console.error('🔥 Error en getIconsGallery:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener galería de iconos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new TabsController();