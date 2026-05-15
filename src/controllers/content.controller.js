// src/controllers/content.controller.js
const Content = require('../models/Content');
const path = require('path');
const fs = require('fs');

class ContentController {
  /**
   * ============================================
   * FRONTEND PÚBLICO - Solo noticias publicadas
   * ============================================
   */
  async getContentsPublic(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100;
      const { type, category, search } = req.query;
      
      console.log('\n🌐 [PUBLICO] ========== LISTANDO NOTICIAS PARA FRONTEND ==========');
      console.log(`   Página: ${page}, Límite: ${limit}`);
      console.log(`   Filtros: type=${type || 'ninguno'}, category=${category || 'ninguno'}, search=${search || 'ninguno'}`);
      
      const filters = { status: 'published' };
      
      if (type && type !== 'all' && type !== 'undefined') {
        filters.type = type;
        console.log(`   ✅ Filtro type: ${type}`);
      }
      
      if (category && category !== 'undefined') {
        filters.category = category;
        console.log(`   ✅ Filtro category: ${category}`);
      }
      
      if (search && search !== 'undefined') {
        filters.$text = { $search: search };
        console.log(`   ✅ Filtro search: ${search}`);
      }
      
      const skip = (page - 1) * limit;
      
      const [contents, total] = await Promise.all([
        Content.find(filters)
          .sort({ publishedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('author', 'email profile')
          .lean(),
        Content.countDocuments(filters)
      ]);
      
      console.log(`   📊 Resultado: ${contents.length} de ${total} noticias publicadas`);
      console.log('🌐 ==============================================================\n');
      
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
      console.error('❌ Error en getContentsPublic:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * ============================================
   * ADMIN DASHBOARD - Todas las noticias (con filtros)
   * ============================================
   */
  async getContentsAdmin(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100;
      const { type, status, category, search } = req.query;
      
      console.log('\n🔐 [ADMIN] ========== LISTANDO NOTICIAS PARA DASHBOARD ==========');
      console.log(`   Usuario: ${req.user ? req.user.email : 'NO AUTENTICADO'}`);
      console.log(`   Página: ${page}, Límite: ${limit}`);
      console.log(`   Filtros: type=${type || 'ninguno'}, status=${status || 'ninguno'}, category=${category || 'ninguno'}, search=${search || 'ninguno'}`);
      
      const filters = {};
      
      if (type && type !== 'all' && type !== 'undefined') {
        filters.type = type;
        console.log(`   ✅ Filtro type: ${type}`);
      }
      
      if (category && category !== 'undefined') {
        filters.category = category;
        console.log(`   ✅ Filtro category: ${category}`);
      }
      
      if (status && status !== 'all' && status !== 'undefined') {
        filters.status = status;
        console.log(`   ✅ Filtro status: ${status}`);
      } else {
        console.log(`   ⏭️ Sin filtro de estado - mostrando TODOS`);
      }
      
      if (search && search !== 'undefined') {
        filters.$text = { $search: search };
        console.log(`   ✅ Filtro search: ${search}`);
      }
      
      const skip = (page - 1) * limit;
      
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
      
      console.log(`   📊 Resultado: ${contents.length} de ${total} documentos`);
      console.log('🔐 ==============================================================\n');
      
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
      console.error('❌ Error en getContentsAdmin:', error);
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
      
      console.log(`\n🔍 [PUBLICO] Buscando noticia por slug: ${slug}`);
      
      const content = await Content.findOne({ 
        slug, 
        status: 'published' 
      })
      .populate('author', 'email profile')
      .populate('lastModifiedBy', 'email profile');
      
      if (!content) {
        console.log(`❌ No encontrada: ${slug}`);
        return res.status(404).json({
          success: false,
          message: 'Contenido no encontrado'
        });
      }
      
      content.views += 1;
      await content.save();
      
      console.log(`✅ Encontrada: ${content.title}`);
      
      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      console.error(`❌ Error en getContentBySlug: ${error.message}`);
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
      
      console.log(`\n🔍 [ADMIN] Buscando noticia por ID: ${id}`);
      
      const content = await Content.findById(id)
        .populate('author', 'email profile')
        .populate('lastModifiedBy', 'email profile');
      
      if (!content) {
        console.log(`❌ No encontrada: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Contenido no encontrado'
        });
      }
      
      console.log(`✅ Encontrada: ${content.title}`);
      
      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      console.error(`❌ Error en getContentById: ${error.message}`);
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
      console.log('\n' + '='.repeat(80));
      console.log('📝 [createContent] CREANDO NUEVO CONTENIDO');
      console.log(`👤 Usuario: ${req.user ? req.user.email : 'NO AUTENTICADO'}`);
      console.log(`📦 Título: ${req.body.title}`);
      console.log(`📦 Estado: ${req.body.status || 'draft'}`);
      
      const status = req.body.status || 'draft';
      
      const contentData = {
        title: req.body.title,
        slug: req.body.slug || this.generateSlug(req.body.title),
        content: req.body.content,
        excerpt: req.body.excerpt || '',
        type: req.body.type || 'news',
        category: req.body.category || 'noticias',
        tags: req.body.tags || [],
        status: status,
        featuredImage: req.body.featuredImage || { url: '', alt: '' },
        author: req.user._id,
        lastModifiedBy: req.user._id,
        publishedAt: status === 'published' ? new Date() : null
      };
      
      const content = new Content(contentData);
      await content.save();
      
      console.log(`✅ Contenido creado - ID: ${content._id}, Status: ${content.status}`);
      console.log('='.repeat(80) + '\n');
      
      res.status(201).json({
        success: true,
        message: 'Contenido creado exitosamente',
        data: content
      });
    } catch (error) {
      console.error(`❌ Error en createContent: ${error.message}`);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Generar slug a partir del título
   */
  generateSlug(title) {
    if (!title) return 'sin-titulo-' + Date.now();
    return title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now();
  }

  /**
   * Actualizar contenido (ADMIN)
   */
  async updateContent(req, res) {
    try {
      const { id } = req.params;
      
      console.log(`\n📝 [updateContent] Actualizando ID: ${id}`);
      console.log(`   Usuario: ${req.user ? req.user.email : 'NO AUTENTICADO'}`);
      
      const content = await Content.findById(id);
      
      if (!content) {
        console.log(`❌ No encontrado: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Contenido no encontrado'
        });
      }
      
      console.log(`   Título original: ${content.title}`);
      console.log(`   Estado original: ${content.status}`);
      console.log(`   Nuevo estado: ${req.body.status || 'sin cambio'}`);
      
      // Guardar versión anterior en historial
      content.versionHistory.push({
        content: content.content,
        modifiedBy: content.lastModifiedBy,
        modifiedAt: content.updatedAt || new Date(),
        revision: content.revision,
        comment: req.body.versionComment || 'Actualización'
      });
      
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
      
      console.log(`✅ Actualizado - Nuevo estado: ${content.status}`);
      
      res.json({
        success: true,
        message: 'Contenido actualizado exitosamente',
        data: content
      });
    } catch (error) {
      console.error(`❌ Error en updateContent: ${error.message}`);
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
      
      console.log(`\n🗑️ [deleteContent] Eliminando ID: ${id}`);
      console.log(`   Usuario: ${req.user ? req.user.email : 'NO AUTENTICADO'}`);
      
      const content = await Content.findByIdAndDelete(id);
      
      if (!content) {
        console.log(`❌ No encontrado: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Contenido no encontrado'
        });
      }
      
      console.log(`✅ Eliminado: ${content.title}`);
      
      res.json({
        success: true,
        message: 'Contenido eliminado exitosamente'
      });
    } catch (error) {
      console.error(`❌ Error en deleteContent: ${error.message}`);
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
      
      console.log(`\n🔄 [changeStatus] Cambiando estado`);
      console.log(`   ID: ${id}`);
      console.log(`   Nuevo estado: ${status}`);
      console.log(`   Usuario: ${req.user ? req.user.email : 'NO AUTENTICADO'}`);
      
      const content = await Content.findById(id);
      
      if (!content) {
        console.log(`❌ No encontrado: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Contenido no encontrado'
        });
      }
      
      console.log(`   Estado anterior: ${content.status}`);
      
      content.status = status;
      content.lastModifiedBy = req.user._id;
      
      if (status === 'published' && !content.publishedAt) {
        content.publishedAt = new Date();
      }
      
      await content.save();
      
      console.log(`✅ Estado cambiado a ${status}`);
      
      res.json({
        success: true,
        message: `Estado cambiado a ${status}`,
        data: content
      });
    } catch (error) {
      console.error(`❌ Error en changeStatus: ${error.message}`);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de contenido
   */
  async getStats(req, res) {
    try {
      const total = await Content.countDocuments();
      const published = await Content.countDocuments({ status: 'published' });
      const drafts = await Content.countDocuments({ status: 'draft' });
      const archived = await Content.countDocuments({ status: 'archived' });
      
      console.log(`\n📊 [getStats] Total: ${total}, Publicadas: ${published}, Borradores: ${drafts}, Archivadas: ${archived}`);
      
      res.json({
        success: true,
        data: { total, published, drafts, archived }
      });
    } catch (error) {
      console.error(`❌ Error en getStats: ${error.message}`);
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
      
      console.log(`\n🔍 [searchContent] Buscando: ${q}`);
      
      const results = await Content.find(
        { $text: { $search: q }, status: 'published' },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit));
      
      console.log(`✅ Encontrados: ${results.length}`);
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error(`❌ Error en searchContent: ${error.message}`);
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
      console.error(`❌ Error en getRelatedContent: ${error.message}`);
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
    const types = [
      { value: 'page', label: 'Página', description: 'Páginas estáticas' },
      { value: 'news', label: 'Noticia', description: 'Noticias y anuncios' },
      { value: 'article', label: 'Artículo', description: 'Artículos de opinión' },
      { value: 'announcement', label: 'Anuncio', description: 'Comunicados oficiales' },
    ];
    res.json({ success: true, data: types });
  }

  /**
   * Obtener categorías disponibles
   */
  async getCategories(req, res) {
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
  }

  /**
   * Subir imagen para contenido
   */
  async uploadImage(req, res) {
    try {
      console.log(`\n📸 [uploadImage] Subiendo imagen`);
      console.log(`   Usuario: ${req.user ? req.user.email : 'NO AUTENTICADO'}`);
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se subió ninguna imagen'
        });
      }
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const imageUrl = `${baseUrl}/uploads/images/${req.file.filename}`;
      
      console.log(`✅ Imagen subida: ${imageUrl}`);
      
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
      console.error(`❌ Error subiendo imagen: ${error.message}`);
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
      console.error(`❌ Error subiendo documento: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al subir el documento'
      });
    }
  }
}

module.exports = new ContentController();