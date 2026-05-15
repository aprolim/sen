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
      const type = req.query.type;
      const status = req.query.status;
      const category = req.query.category;
      const search = req.query.search;
      
      console.log('\n' + '='.repeat(60));
      console.log('🔍 [getContents] SOLICITUD RECIBIDA');
      console.log('   URL completa:', req.url);
      console.log('   QUERY PARAMS:', req.query);
      console.log('   page:', page);
      console.log('   limit:', limit);
      console.log('   type:', type);
      console.log('   status:', status);
      console.log('   category:', category);
      console.log('   search:', search);
      console.log('   Usuario autenticado:', req.user ? req.user.email : 'NO');
      
      const filters = {};
      
      // Filtrar por tipo
      if (type && type !== 'all' && type !== 'undefined' && type !== '') {
        filters.type = type;
        console.log('   ✅ Aplicando filtro type:', type);
      }
      
      // Filtrar por categoría
      if (category && category !== 'undefined' && category !== '') {
        filters.category = category;
        console.log('   ✅ Aplicando filtro category:', category);
      }
      
      // 🔥 FILTRO POR ESTADO - CORREGIDO
      if (status && status !== 'all' && status !== 'undefined' && status !== '') {
        filters.status = status;
        console.log('   ✅ Aplicando filtro status:', status);
      } else if (status === 'all') {
        console.log('   ⏭️ Status = "all", sin filtro de estado');
      } else {
        console.log('   ⚠️ No se aplica filtro de estado');
      }
      
      // Búsqueda por texto
      if (search && search !== 'undefined' && search !== '') {
        filters.$text = { $search: search };
        console.log('   ✅ Aplicando filtro search:', search);
      }
      
      // Si es usuario público (no autenticado), solo ver publicados
      if (!req.user) {
        filters.status = 'published';
        console.log('   🔒 Usuario público, forzando status: published');
      }
      
      const skip = (page - 1) * limit;
      
      console.log('\n📋 FILTROS FINALES:', JSON.stringify(filters, null, 2));
      
      // Verificar cuántos documentos hay por estado
      const totalPublished = await Content.countDocuments({ status: 'published' });
      const totalDrafts = await Content.countDocuments({ status: 'draft' });
      const totalArchived = await Content.countDocuments({ status: 'archived' });
      const totalAll = await Content.countDocuments();
      
      console.log('\n📊 ESTADÍSTICAS BASE DE DATOS:');
      console.log('   Total documentos:', totalAll);
      console.log('   Publicados (published):', totalPublished);
      console.log('   Borradores (draft):', totalDrafts);
      console.log('   Archivados (archived):', totalArchived);
      
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
      
      console.log('\n✅ RESULTADO FINAL:');
      console.log('   Documentos devueltos:', contents.length);
      console.log('   Total en filtro:', total);
      console.log('   Página:', page);
      console.log('   Páginas totales:', Math.ceil(total / limit));
      console.log('='.repeat(60) + '\n');
      
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
   * Crear nuevo contenido (ADMIN)
   */
  async createContent(req, res) {
    try {
      console.log('\n' + '='.repeat(60));
      console.log('📝 [createContent] CREANDO NUEVO CONTENIDO');
      console.log('   Body recibido:', req.body);
      console.log('   Usuario:', req.user ? req.user.email : 'NO');
      
      // Asegurar que el status se guarda correctamente
      const status = req.body.status || 'draft';
      console.log('   Estado a guardar:', status);
      
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
      
      console.log('   Datos a guardar:', {
        title: contentData.title,
        slug: contentData.slug,
        status: contentData.status,
        publishedAt: contentData.publishedAt
      });
      
      const content = new Content(contentData);
      await content.save();
      
      console.log('✅ [createContent] Contenido creado exitosamente');
      console.log('   ID:', content._id);
      console.log('   Status guardado:', content.status);
      console.log('='.repeat(60) + '\n');
      
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
   * Actualizar contenido (ADMIN)
   */
  async updateContent(req, res) {
    try {
      const { id } = req.params;
      
      console.log(`📝 [updateContent] Actualizando ID: ${id}`);
      console.log('   Body:', req.body);
      
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
      console.log('   Nuevo status:', content.status);
      
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