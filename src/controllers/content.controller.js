// src/controllers/content.controller.js - VERSIÓN MONGODB REAL
const Content = require('../models/Content');
const path = require('path');
const fs = require('fs');

class ContentController {
  /**
   * Obtener lista de contenido paginada (PUBLICO + ADMIN)
   */
  async getContents(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      const { type, status, category, search } = req.query;
      
      // Construir filtros
      const filters = {};
      if (type && type !== 'all') filters.type = type;
      if (category) filters.category = category;
      if (search) {
        filters.$text = { $search: search };
      }
      
      // Si es usuario público (no autenticado), solo ver publicados
      if (!req.user) {
        filters.status = 'published';
      } else if (status && status !== 'all') {
        // Si es admin y filtra por estado
        filters.status = status;
      }
      
      const skip = (page - 1) * limit;
      
      const [contents, total] = await Promise.all([
        Content.find(filters)
          .sort({ publishedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('author', 'email profile')
          .populate('lastModifiedBy', 'email profile'),
        Content.countDocuments(filters)
      ]);
      
      console.log(`📊 getContents: ${contents.length} de ${total} documentos`);
      
      res.json({
        success: true,
        data: {
          contents,
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('❌ Error en getContents:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener contenido por slug (PÚBLICO)
   */
  async getContentBySlug(req, res) {
    try {
      const { slug } = req.params;
      
      console.log(`🔍 Buscando contenido por slug: ${slug}`);
      
      const content = await Content.findOne({ 
        slug, 
        status: 'published' 
      })
      .populate('author', 'email profile')
      .populate('lastModifiedBy', 'email profile')
      .populate('relatedContent', 'title slug type');
      
      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Contenido no encontrado'
        });
      }
      
      // Incrementar vistas
      await content.incrementViews();
      
      console.log(`✅ Contenido encontrado: ${content.title}`);
      
      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      console.error('❌ Error en getContentBySlug:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener contenido por ID (ADMIN)
   */
  async getContentById(req, res) {
    try {
      const { id } = req.params;
      
      const content = await Content.findById(id)
        .populate('author', 'email profile')
        .populate('lastModifiedBy', 'email profile')
        .populate('relatedContent', 'title slug type');
      
      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Contenido no encontrado'
        });
      }
      
      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      console.error('❌ Error en getContentById:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Crear nuevo contenido (ADMIN)
   */
  async createContent(req, res) {
    try {
      const contentData = {
        ...req.body,
        author: req.user._id,
        lastModifiedBy: req.user._id,
        publishedAt: req.body.status === 'published' ? new Date() : null
      };
      
      console.log('📝 Creando nuevo contenido:', contentData.title);
      
      const content = new Content(contentData);
      await content.save();
      
      console.log(`✅ Contenido creado: ${content._id}`);
      
      res.status(201).json({
        success: true,
        message: 'Contenido creado exitosamente',
        data: content
      });
    } catch (error) {
      console.error('❌ Error en createContent:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Actualizar contenido (ADMIN)
   */
  async updateContent(req, res) {
    try {
      const { id } = req.params;
      
      console.log(`📝 Actualizando contenido: ${id}`);
      
      const content = await Content.findById(id);
      
      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Contenido no encontrado'
        });
      }
      
      // Guardar versión anterior en historial
      content.versionHistory.push({
        content: content.content,
        modifiedBy: content.lastModifiedBy,
        modifiedAt: content.updatedAt || new Date(),
        revision: content.revision,
        comment: req.body.versionComment || 'Actualización'
      });
      
      // Actualizar campos permitidos
      const allowedFields = ['title', 'slug', 'content', 'excerpt', 'type', 'category', 'tags', 'status', 'featuredImage', 'gallery', 'seo', 'scheduledFor'];
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          content[field] = req.body[field];
        }
      });
      
      content.lastModifiedBy = req.user._id;
      content.revision += 1;
      
      // Si cambia a publicado y no tenía fecha
      if (req.body.status === 'published' && !content.publishedAt) {
        content.publishedAt = new Date();
      }
      
      await content.save();
      
      console.log(`✅ Contenido actualizado: ${content.title}`);
      
      res.json({
        success: true,
        message: 'Contenido actualizado exitosamente',
        data: content
      });
    } catch (error) {
      console.error('❌ Error en updateContent:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Eliminar contenido (ADMIN)
   */
  async deleteContent(req, res) {
    try {
      const { id } = req.params;
      
      console.log(`🗑️ Eliminando contenido: ${id}`);
      
      const content = await Content.findByIdAndDelete(id);
      
      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Contenido no encontrado'
        });
      }
      
      console.log(`✅ Contenido eliminado: ${content.title}`);
      
      res.json({
        success: true,
        message: 'Contenido eliminado exitosamente'
      });
    } catch (error) {
      console.error('❌ Error en deleteContent:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Cambiar estado del contenido (ADMIN)
   */
  async changeStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      console.log(`🔄 Cambiando estado de ${id} a ${status}`);
      
      const content = await Content.findById(id);
      
      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Contenido no encontrado'
        });
      }
      
      content.status = status;
      content.lastModifiedBy = req.user._id;
      
      if (status === 'published' && !content.publishedAt) {
        content.publishedAt = new Date();
      }
      
      await content.save();
      
      res.json({
        success: true,
        message: `Estado cambiado a ${status}`,
        data: content
      });
    } catch (error) {
      console.error('❌ Error en changeStatus:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de contenido (ADMIN)
   */
  async getStats(req, res) {
    try {
      const stats = await Content.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalViews: { $sum: '$views' }
          }
        }
      ]);
      
      const total = await Content.countDocuments();
      const byType = await Content.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]);
      
      res.json({
        success: true,
        data: {
          total,
          byStatus: stats,
          byType
        }
      });
    } catch (error) {
      console.error('❌ Error en getStats:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Buscar contenido (PÚBLICO)
   */
  async searchContent(req, res) {
    try {
      const { q, limit = 20 } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Término de búsqueda requerido'
        });
      }
      
      const results = await Content.find(
        { 
          $text: { $search: q },
          status: 'published'
        },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit))
      .select('title slug excerpt type category publishedAt featuredImage');
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('❌ Error en searchContent:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener contenido relacionado (PÚBLICO)
   */
  async getRelatedContent(req, res) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit) || 5;
      
      const current = await Content.findById(id);
      
      if (!current) {
        return res.json({ success: true, data: [] });
      }
      
      const related = await Content.find({
        _id: { $ne: id },
        status: 'published',
        $or: [
          { category: current.category },
          { tags: { $in: current.tags } },
          { type: current.type }
        ]
      })
      .limit(limit)
      .select('title slug excerpt type category publishedAt featuredImage');
      
      res.json({
        success: true,
        data: related
      });
    } catch (error) {
      console.error('❌ Error en getRelatedContent:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener tipos de contenido disponibles
   */
  async getContentTypes(req, res) {
    try {
      const types = [
        { value: 'page', label: 'Página', description: 'Páginas estáticas' },
        { value: 'news', label: 'Noticia', description: 'Noticias y anuncios' },
        { value: 'article', label: 'Artículo', description: 'Artículos de opinión' },
        { value: 'announcement', label: 'Anuncio', description: 'Comunicados oficiales' },
      ];
      
      res.json({ success: true, data: types });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Obtener categorías disponibles
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
      
      res.json({ success: true, data: categories });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Subir imagen para contenido
   */
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se subió ninguna imagen'
        });
      }
      
      const imageUrl = `/uploads/images/${req.file.filename}`;
      
      res.json({
        success: true,
        message: 'Imagen subida exitosamente',
        data: {
          url: imageUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      res.status(500).json({
        success: false,
        message: 'Error al subir la imagen'
      });
    }
  }

  /**
   * Subir documento
   */
  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se subió ningún documento'
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
          mimetype: req.file.mimetype
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al subir el documento'
      });
    }
  }
}

module.exports = new ContentController();