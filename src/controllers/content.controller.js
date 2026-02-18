const contentService = require('../services/content.service');
const { processImage, generateThumbnails } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

/**
 * @swagger
 * tags:
 *   name: Content
 *   description: Gestión de contenido (páginas, noticias, artículos)
 */

class ContentController {
  /**
   * @swagger
   * /api/content:
   *   post:
   *     summary: Crear nuevo contenido
   *     tags: [Content]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - type
   *             properties:
   *               title:
   *                 type: string
   *               slug:
   *                 type: string
   *               content:
   *                 type: string
   *               type:
   *                 type: string
   *                 enum: [page, news, article, announcement]
   *               category:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [draft, published, archived, scheduled]
   *               featuredImage:
   *                 type: object
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       201:
   *         description: Contenido creado exitosamente
   *       400:
   *         description: Error en los datos
   */
  async createContent(req, res) {
    try {
      const content = await contentService.createContent(req.body, req.user._id);
      
      res.status(201).json({
        success: true,
        message: 'Contenido creado exitosamente',
        data: content,
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
   * /api/content:
   *   get:
   *     summary: Obtener lista de contenido
   *     tags: [Content]
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
   *         name: type
   *         schema:
   *           type: string
   *           enum: [page, news, article, announcement]
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [draft, published, archived, scheduled]
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *       - in: query
   *         name: includeDrafts
   *         schema:
   *           type: boolean
   *           default: false
   *     responses:
   *       200:
   *         description: Lista de contenido obtenida
   */
  async getContents(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        type, 
        category, 
        status, 
        search,
        includeDrafts,
        language,
        fromDate,
        toDate,
        tags
      } = req.query;

      const filters = {};
      if (type) filters.type = type;
      if (category) filters.category = category;
      if (status) filters.status = status;
      if (search) filters.search = search;
      if (language) filters.language = language;
      if (fromDate) filters.fromDate = fromDate;
      if (toDate) filters.toDate = toDate;
      if (includeDrafts) filters.includeDrafts = includeDrafts === 'true';
      if (tags) filters.tags = tags.split(',');

      const result = await contentService.getContents(
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
   * /api/content/{id}:
   *   get:
   *     summary: Obtener contenido por ID
   *     tags: [Content]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Contenido encontrado
   *       404:
   *         description: Contenido no encontrado
   */
  async getContentById(req, res) {
    try {
      const { id } = req.params;
      const content = await contentService.getContentById(id);

      res.json({
        success: true,
        data: content,
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
   * /api/content/slug/{slug}:
   *   get:
   *     summary: Obtener contenido por slug
   *     tags: [Content]
   *     parameters:
   *       - in: path
   *         name: slug
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Contenido encontrado
   *       404:
   *         description: Contenido no encontrado
   */
  async getContentBySlug(req, res) {
    try {
      const { slug } = req.params;
      const content = await contentService.getContentBySlug(slug);

      res.json({
        success: true,
        data: content,
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
   * /api/content/{id}:
   *   put:
   *     summary: Actualizar contenido
   *     tags: [Content]
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
   *               title:
   *                 type: string
   *               content:
   *                 type: string
   *               category:
   *                 type: string
   *               status:
   *                 type: string
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Contenido actualizado
   *       404:
   *         description: Contenido no encontrado
   */
  async updateContent(req, res) {
    try {
      const { id } = req.params;
      const content = await contentService.updateContent(id, req.body, req.user._id);

      res.json({
        success: true,
        message: 'Contenido actualizado exitosamente',
        data: content,
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
   * /api/content/{id}:
   *   delete:
   *     summary: Eliminar contenido
   *     tags: [Content]
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
   *         description: Contenido eliminado
   *       404:
   *         description: Contenido no encontrado
   */
  async deleteContent(req, res) {
    try {
      const { id } = req.params;
      const result = await contentService.deleteContent(id);

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

  /**
   * @swagger
   * /api/content/{id}/status:
   *   patch:
   *     summary: Cambiar estado del contenido
   *     tags: [Content]
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
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [draft, published, archived, scheduled]
   *     responses:
   *       200:
   *         description: Estado actualizado
   */
  async changeStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const content = await contentService.changeContentStatus(id, status, req.user._id);

      res.json({
        success: true,
        message: `Estado cambiado a ${status}`,
        data: content,
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
   * /api/content/stats:
   *   get:
   *     summary: Obtener estadísticas de contenido
   *     tags: [Content]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Estadísticas obtenidas
   */
  async getStats(req, res) {
    try {
      const stats = await contentService.getContentStats();

      res.json({
        success: true,
        data: stats,
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
   * /api/content/search:
   *   get:
   *     summary: Buscar contenido
   *     tags: [Content]
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: Resultados de búsqueda
   */
  async searchContent(req, res) {
    try {
      const { q, limit = 20 } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Término de búsqueda requerido',
        });
      }

      const results = await contentService.searchContent(q, parseInt(limit));

      res.json({
        success: true,
        data: results,
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
   * /api/content/{id}/related:
   *   get:
   *     summary: Obtener contenido relacionado
   *     tags: [Content]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 5
   *     responses:
   *       200:
   *         description: Contenido relacionado
   */
  async getRelatedContent(req, res) {
    try {
      const { id } = req.params;
      const { limit = 5 } = req.query;

      const related = await contentService.getRelatedContent(id, parseInt(limit));

      res.json({
        success: true,
        data: related,
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
   * /api/content/upload/image:
   *   post:
   *     summary: Subir imagen para contenido
   *     tags: [Content]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               image:
   *                 type: string
   *                 format: binary
   *               alt:
   *                 type: string
   *               caption:
   *                 type: string
   *     responses:
   *       200:
   *         description: Imagen subida exitosamente
   */
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se subió ninguna imagen',
        });
      }

      // Procesar imagen
      const imagePath = path.join(req.file.destination, req.file.filename);
      const processedFilename = await processImage(imagePath, {
        width: 1200,
        quality: 80,
        format: 'webp',
      });

      // Generar thumbnails
      const thumbnails = await generateThumbnails(
        path.join(req.file.destination, processedFilename)
      );

      const imageUrl = `/uploads/images/${processedFilename}`;

      res.json({
        success: true,
        message: 'Imagen subida exitosamente',
        data: {
          url: imageUrl,
          filename: processedFilename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          thumbnails,
          alt: req.body.alt || '',
          caption: req.body.caption || '',
        },
      });
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      res.status(500).json({
        success: false,
        message: 'Error al subir la imagen',
      });
    }
  }

  /**
   * @swagger
   * /api/content/upload/document:
   *   post:
   *     summary: Subir documento
   *     tags: [Content]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               document:
   *                 type: string
   *                 format: binary
   *     responses:
   *       200:
   *         description: Documento subido exitosamente
   */
  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se subió ningún documento',
        });
      }

      const documentUrl = `/uploads/documents/${req.file.filename}`;

      res.json({
        success: true,
        message: 'Documento subido exitosamente',
        data: {
          url: documentUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al subir el documento',
      });
    }
  }

  /**
   * @swagger
   * /api/content/types:
   *   get:
   *     summary: Obtener tipos de contenido disponibles
   *     tags: [Content]
   *     responses:
   *       200:
   *         description: Tipos de contenido
   */
  async getContentTypes(req, res) {
    try {
      const types = [
        { value: 'page', label: 'Página', description: 'Páginas estáticas como institucional, historia, etc.' },
        { value: 'news', label: 'Noticia', description: 'Noticias y anuncios de actualidad' },
        { value: 'article', label: 'Artículo', description: 'Artículos de opinión o análisis' },
        { value: 'announcement', label: 'Anuncio', description: 'Comunicados oficiales' },
      ];

      res.json({
        success: true,
        data: types,
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
   * /api/content/categories:
   *   get:
   *     summary: Obtener categorías disponibles
   *     tags: [Content]
   *     responses:
   *       200:
   *         description: Categorías de contenido
   */
  async getCategories(req, res) {
    try {
      const categories = [
        { value: 'institucional', label: 'Institucional', color: 'blue' },
        { value: 'historia', label: 'Historia', color: 'green' },
        { value: 'directiva', label: 'Directiva', color: 'purple' },
        { value: 'noticias', label: 'Noticias', color: 'orange' },
        { value: 'eventos', label: 'Eventos', color: 'red' },
        { value: 'transparencia', label: 'Transparencia', color: 'teal' },
        { value: 'participacion', label: 'Participación', color: 'cyan' },
        { value: 'legislacion', label: 'Legislación', color: 'indigo' },
      ];

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new ContentController();