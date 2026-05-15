// src/controllers/content.controller.js
const Content = require('../models/Content');
const path = require('path');
const fs = require('fs');

class ContentController {
  /**
   * Obtener lista de contenido paginada (PUBLICO + ADMIN)
   */
  async getContents(req, res) {
    try {
      // HEADERS ANTI-CACHÉ
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100;
      const { type, status, category, search } = req.query;
      
      console.log('🔍 [getContents] ========== INICIO ==========');
      console.log('🔍 [getContents] Parámetros recibidos:', { 
        page, 
        limit, 
        type: type || 'no', 
        status: status || 'no', 
        category: category || 'no', 
        search: search || 'no' 
      });
      console.log('🔍 [getContents] Usuario autenticado:', req.user ? req.user.email : 'NO (público)');
      
      const filters = {};
      
      // Filtrar por tipo
      if (type && type !== 'all' && type !== 'undefined') {
        filters.type = type;
        console.log('   ✅ Filtro type aplicado:', type);
      }
      
      // Filtrar por categoría
      if (category && category !== 'undefined') {
        filters.category = category;
        console.log('   ✅ Filtro category aplicado:', category);
      }
      
      // FILTRO POR ESTADO - CORREGIDO
      if (status && status !== 'all' && status !== 'undefined') {
        filters.status = status;
        console.log('   ✅ Filtro status aplicado:', status);
      } else if (status === 'all') {
        console.log('   ⏭️ Status = "all", no se aplica filtro de estado');
      }
      
      // Búsqueda por texto
      if (search && search !== 'undefined') {
        filters.$text = { $search: search };
        console.log('   ✅ Filtro search aplicado:', search);
      }
      
      // Si es usuario público (no autenticado), solo ver publicados
      if (!req.user) {
        filters.status = 'published';
        console.log('   🔒 Usuario público, forzando status: published');
      }
      
      const skip = (page - 1) * limit;
      
      console.log('🔍 [getContents] Filtros finales aplicados:', JSON.stringify(filters, null, 2));
      
      const [contents, total] = await Promise.all([
        Content.find(filters)
          .sort({ publishedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('author', 'email profile')
          .populate('lastModifiedBy', 'email profile')
          .lean(),
        Content.countDocuments(filters)
      ]);
      
      console.log(`📊 [getContents] RESULTADO: ${contents.length} documentos de ${total} totales`);
      console.log(`📊 [getContents] Filtro usado: status=${status || 'ninguno'}`);
      console.log('🔍 [getContents] ========== FIN ==========\n');
      
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
      
      console.log(`🔍 [getContentBySlug] Buscando slug: ${slug}`);
      
      const content = await Content.findOne({ 
        slug, 
        status: 'published' 
      })
      .populate('author', 'email profile')
      .populate('lastModifiedBy', 'email profile');
      
      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Contenido no encontrado'
        });
      }
      
      // Incrementar vistas
      content.views += 1;
      await content.save();
      
      console.log(`✅ [getContentBySlug] Encontrado: ${content.title}`);
      
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
      
      console.log(`🔍 [getContentById] Buscando ID: ${id}`);
      
      const content = await Content.findById(id)
        .populate('author', 'email profile')
        .populate('lastModifiedBy', 'email profile');
      
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
      
      console.log(`📝 [createContent] Creando: ${contentData.title}`);
      
      const content = new Content(contentData);
      await content.save();
      
      console.log(`✅ [createContent] Creado: ${content._id}`);
      
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
      
      console.log(`📝 [updateContent] Actualizando ID: ${id}`);
      
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
      
      if (req.body.status === 'published' && !content.publishedAt) {
        content.publishedAt = new Date();
      }
      
      await content.save();
      
      console.log(`✅ [updateContent] Actualizado: ${content.title}`);
      
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
      
      console.log(`🗑️ [deleteContent] Eliminando ID: ${id}`);
      
      const content = await Content.findByIdAndDelete(id);
      
      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Contenido no encontrado'
        });
      }
      
      console.log(`✅ [deleteContent] Eliminado: ${content.title}`);
      
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
      
      console.log(`🔄 [changeStatus] Cambiando estado de ${id} a ${status}`);
      
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
      
      console.log(`✅ [changeStatus] Estado cambiado a ${status}`);
      
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
      const total = await Content.countDocuments();
      const published = await Content.countDocuments({ status: 'published' });
      const drafts = await Content.countDocuments({ status: 'draft' });
      const archived = await Content.countDocuments({ status: 'archived' });
      
      console.log(`📊 [getStats] Total: ${total}, Publicadas: ${published}, Borradores: ${drafts}, Archivadas: ${archived}`);
      
      res.json({
        success: true,
        data: {
          total,
          published,
          drafts,
          archived
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
      
      console.log(`🔍 [searchContent] Buscando: ${q}`);
      
      const results = await Content.find(
        { 
          $text: { $search: q },
          status: 'published'
        },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit));
      
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
      .limit(limit);
      
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
      console.log('📸 [uploadImage] Llamado');
      console.log('📁 req.file:', req.file);
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se subió ninguna imagen'
        });
      }
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const imageUrl = `${baseUrl}/uploads/images/${req.file.filename}`;
      
      console.log('✅ Imagen subida exitosamente:', imageUrl);
      
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
      console.error('❌ Error subiendo imagen:', error);
      res.status(500).json({
        success: false,
        message: 'Error al subir la imagen',
        error: error.message
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
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const documentUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;
      
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
      console.error('❌ Error subiendo documento:', error);
      res.status(500).json({
        success: false,
        message: 'Error al subir el documento'
      });
    }
  }
}

module.exports = new ContentController();