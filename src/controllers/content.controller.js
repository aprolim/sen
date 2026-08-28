// src/controllers/content.controller.js - COMPLETO CON NUEVAS FUNCIONES
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
      
      console.log('\n🌐 [PUBLICO] ========== LISTANDO NOTICIAS ==========');
      
      // PUBLICAR CONTENIDO PROGRAMADO (si existe y ya pasó la fecha)
      const now = new Date();
      const scheduledToPublish = await Content.find({
        status: 'scheduled',
        scheduledFor: { $lte: now }
      }).limit(10);
      
      for (const content of scheduledToPublish) {
        content.status = 'published';
        content.publishedAt = now;
        content.scheduledFor = null;
        await content.save();
        console.log(`   ✅ Publicado automáticamente: "${content.title}"`);
      }
      
      // OBTENER NOTICIAS PUBLICADAS
      const filters = { status: 'published' };
      
      if (category && category !== 'all' && category !== 'undefined' && category !== '') {
        filters.category = category;
        console.log(`   ✅ Aplicando filtro: category = ${category}`);
      }
      
      if (type && type !== 'all' && type !== 'undefined') {
        filters.type = type;
      }
      
      if (search && search !== 'undefined') {
        filters.$text = { $search: search };
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
   * ADMIN DASHBOARD - Todas las noticias
   * ============================================
   */
  async getContentsAdmin(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100;
      const { type, status, category, search } = req.query;
      
      console.log('\n🔐 [ADMIN] ========== LISTANDO NOTICIAS PARA DASHBOARD ==========');
      
      const filters = {};
      
      if (type && type !== 'all' && type !== 'undefined') {
        filters.type = type;
      }
      if (category && category !== 'all' && category !== 'undefined' && category !== '') {
        filters.category = category;
        console.log(`   ✅ Aplicando filtro category: ${category}`);
      }
      if (status && status !== 'all' && status !== 'undefined') {
        filters.status = status;
        console.log(`   ✅ Aplicando filtro status: ${status}`);
      }
      if (search && search !== 'undefined') {
        filters.$text = { $search: search };
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
      
      const now = new Date();
      const scheduledContent = await Content.findOne({
        slug,
        status: 'scheduled',
        scheduledFor: { $lte: now }
      });
      
      if (scheduledContent) {
        scheduledContent.status = 'published';
        scheduledContent.publishedAt = now;
        scheduledContent.scheduledFor = null;
        await scheduledContent.save();
        console.log(`   ✅ Publicada automáticamente: "${scheduledContent.title}"`);
      }
      
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
      console.log(`   Categoría: ${content.category}`);
      console.log(`   Participantes: ${content.participantes || 'Ninguno'}`);
      
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
   * Obtener contenido por ID (PÚBLICO)
   */
  async getContentByIdPublic(req, res) {
    try {
      const { id } = req.params;
      
      console.log(`\n🔍 [PUBLICO] Buscando noticia por ID: ${id}`);
      
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        console.log(`❌ ID inválido: ${id}`);
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      const now = new Date();
      const scheduledContent = await Content.findOne({
        _id: id,
        status: 'scheduled',
        scheduledFor: { $lte: now }
      });
      
      if (scheduledContent) {
        scheduledContent.status = 'published';
        scheduledContent.publishedAt = now;
        scheduledContent.scheduledFor = null;
        await scheduledContent.save();
        console.log(`   ✅ Publicada automáticamente: "${scheduledContent.title}"`);
      }
      
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
      
      if (content.status !== 'published') {
        console.log(`❌ No publicada: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Contenido no disponible'
        });
      }
      
      console.log(`✅ Encontrada: ${content.title}`);
      
      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      console.error(`❌ Error en getContentByIdPublic: ${error.message}`);
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
      
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        console.log(`❌ ID inválido: ${id}`);
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
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
      console.log(`   Participantes: ${content.participantes || 'Ninguno'}`);
      
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
      console.log(`📦 Categoría: ${req.body.category || 'noticia'}`);
      console.log(`👥 Participantes: ${req.body.participantes || 'Ninguno'}`);
      
      const status = req.body.status || 'draft';
      const scheduledFor = req.body.scheduledFor;
      const publishedAt = req.body.publishedAt;
      
      // 🔥 VALIDACIÓN: Si es programada y la fecha ya pasó, publicar ahora
      let finalStatus = status;
      let finalPublishedAt = null;
      
      if (status === 'scheduled' && scheduledFor) {
        const now = new Date();
        const scheduleDate = new Date(scheduledFor);
        
        if (scheduleDate <= now) {
          finalStatus = 'published';
          finalPublishedAt = now;
          console.log(`⚠️ Fecha programada ya pasó, publicando ahora: ${req.body.title}`);
        } else {
          finalStatus = 'scheduled';
        }
      } else if (status === 'published') {
        finalPublishedAt = publishedAt ? new Date(publishedAt) : new Date();
        console.log(`📅 Fecha de publicación: ${finalPublishedAt}`);
      }
      
      const contentData = {
        title: req.body.title,
        slug: req.body.slug || this.generateSlug(req.body.title),
        content: req.body.content,
        blocks: req.body.blocks || [],
        excerpt: req.body.excerpt || '',
        type: req.body.type || 'news',
        category: req.body.category || 'noticia',
        originalCategory: req.body.originalCategory,
        tags: req.body.tags || [],
        status: finalStatus,
        featuredImage: req.body.featuredImage || { url: '', alt: '' },
        gallery: req.body.gallery || [],
        participantes: req.body.participantes || [], // 🔥 NUEVO
        author: req.user._id,
        lastModifiedBy: req.user._id,
        publishedAt: finalStatus === 'published' ? finalPublishedAt : null,
        scheduledFor: finalStatus === 'scheduled' ? scheduledFor : null
      };
      
      const content = new Content(contentData);
      await content.save();
      
      console.log(`✅ Contenido creado - ID: ${content._id}, Status: ${content.status}, Categoría: ${content.category}`);
      console.log(`   Participantes: ${content.participantes || 'Ninguno'}`);
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
   * ============================================
   * ACTUALIZAR CONTENIDO (ADMIN) - CORREGIDO
   * ============================================
   */
  async updateContent(req, res) {
    try {
      const { id } = req.params;
      
      console.log(`\n📝 [updateContent] Actualizando ID: ${id}`);
      console.log(`   Usuario: ${req.user ? req.user.email : 'NO AUTENTICADO'}`);
      console.log(`   📅 publishedAt recibido: ${req.body.publishedAt}`);
      console.log(`   📅 scheduledFor recibido: ${req.body.scheduledFor}`);
      console.log(`   👥 Participantes recibidos: ${req.body.participantes || 'Ninguno'}`);
      
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        console.log(`❌ ID inválido: ${id}`);
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
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
      console.log(`   Participantes originales: ${content.participantes || 'Ninguno'}`);
      
      // Guardar versión anterior en historial
      content.versionHistory.push({
        content: content.content,
        modifiedBy: content.lastModifiedBy,
        modifiedAt: content.updatedAt || new Date(),
        revision: content.revision,
        comment: req.body.versionComment || 'Actualización'
      });
      
      // ✅ Campos permitidos para actualizar (sin fechas)
      const allowedFields = [
        'title', 'slug', 'content', 'blocks', 'excerpt', 
        'type', 'category', 'originalCategory', 'tags', 
        'featuredImage', 'gallery', 'seo', 'participantes' // 🔥 NUEVO
      ];
      
      // Actualizar campos básicos
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          content[field] = req.body[field];
          console.log(`   ✅ ${field} actualizado`);
        }
      });
      
      // ============================================
      // 🔥 MANEJO DE FECHAS - CORREGIDO
      // ============================================
      
      // 1. Guardar publishedAt si viene en el body
      if (req.body.publishedAt !== undefined) {
        if (typeof req.body.publishedAt === 'string') {
          const parsedDate = new Date(req.body.publishedAt);
          if (!isNaN(parsedDate.getTime())) {
            content.publishedAt = parsedDate;
            console.log(`   📅 publishedAt guardado desde body: ${content.publishedAt}`);
          } else {
            console.log(`   ⚠️ publishedAt inválido: ${req.body.publishedAt}`);
          }
        } else if (req.body.publishedAt instanceof Date) {
          content.publishedAt = req.body.publishedAt;
          console.log(`   📅 publishedAt guardado desde body (Date): ${content.publishedAt}`);
        } else if (req.body.publishedAt === null) {
          content.publishedAt = null;
          console.log(`   📅 publishedAt establecido a null`);
        }
      }
      
      // 2. Guardar scheduledFor si viene en el body
      if (req.body.scheduledFor !== undefined) {
        if (typeof req.body.scheduledFor === 'string') {
          const parsedDate = new Date(req.body.scheduledFor);
          if (!isNaN(parsedDate.getTime())) {
            content.scheduledFor = parsedDate;
            console.log(`   ⏰ scheduledFor guardado desde body: ${content.scheduledFor}`);
          } else {
            console.log(`   ⚠️ scheduledFor inválido: ${req.body.scheduledFor}`);
          }
        } else if (req.body.scheduledFor instanceof Date) {
          content.scheduledFor = req.body.scheduledFor;
          console.log(`   ⏰ scheduledFor guardado desde body (Date): ${content.scheduledFor}`);
        } else if (req.body.scheduledFor === null) {
          content.scheduledFor = null;
          console.log(`   ⏰ scheduledFor establecido a null`);
        }
      }
      
      // ============================================
      // 🔥 MANEJO DE ESTADO - CORREGIDO
      // ============================================
      
      const newStatus = req.body.status || content.status;
      
      // Solo cambiar el estado si se especificó en el body y es diferente
      if (req.body.status !== undefined && req.body.status !== content.status) {
        console.log(`   🔄 Estado: ${content.status} → ${newStatus}`);
        
        content.status = newStatus;
        
        if (newStatus === 'published') {
          if (!content.publishedAt) {
            content.publishedAt = new Date();
            console.log(`   📅 publishedAt asignado (no tenía): ${content.publishedAt}`);
          }
          content.scheduledFor = null;
          console.log(`   ⏰ scheduledFor limpiado (publicado)`);
          
        } else if (newStatus === 'scheduled') {
          if (!content.scheduledFor) {
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 7);
            content.scheduledFor = defaultDate;
            console.log(`   ⏰ scheduledFor asignado (por defecto +7 días): ${content.scheduledFor}`);
          }
          console.log(`   📅 publishedAt preservado: ${content.publishedAt}`);
          
        } else if (newStatus === 'draft' || newStatus === 'archived') {
          console.log(`   📅 publishedAt preservado: ${content.publishedAt}`);
          console.log(`   ⏰ scheduledFor preservado: ${content.scheduledFor}`);
        }
      } else {
        console.log(`   ℹ️ Estado sin cambios: ${content.status}`);
      }
      
      // Actualizar metadatos
      content.lastModifiedBy = req.user._id;
      content.revision += 1;
      
      await content.save();
      
      console.log(`✅ Actualizado - Nuevo estado: ${content.status}`);
      console.log(`   📅 publishedAt final: ${content.publishedAt}`);
      console.log(`   ⏰ scheduledFor final: ${content.scheduledFor}`);
      console.log(`   👥 Participantes finales: ${content.participantes || 'Ninguno'}`);
      
      // Obtener el contenido actualizado con población
      const updatedContent = await Content.findById(id)
        .populate('author', 'email profile')
        .populate('lastModifiedBy', 'email profile');
      
      res.json({
        success: true,
        message: 'Contenido actualizado exitosamente',
        data: updatedContent
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
      
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        console.log(`❌ ID inválido: ${id}`);
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
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
      
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        console.log(`❌ ID inválido: ${id}`);
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
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
        content.scheduledFor = null;
      }
      
      if (status === 'scheduled' && !content.scheduledFor) {
        content.scheduledFor = new Date();
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
      const scheduled = await Content.countDocuments({ status: 'scheduled' });
      const noticias = await Content.countDocuments({ category: 'noticia' });
      const importantes = await Content.countDocuments({ category: 'importante' });
      
      console.log(`\n📊 [getStats] Total: ${total}, Publicadas: ${published}, Borradores: ${drafts}, Archivadas: ${archived}, Programadas: ${scheduled}`);
      console.log(`   Noticias: ${noticias}, Importantes: ${importantes}`);
      
      res.json({
        success: true,
        data: { total, published, drafts, archived, scheduled, noticias, importantes }
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
      
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.json({ success: true, data: [] });
      }
      
      const current = await Content.findById(id);
      
      if (!current || current.status !== 'published') {
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
      .sort({ publishedAt: -1, views: -1 })
      .limit(limit)
      .select('title slug excerpt type category publishedAt featuredImage views');
      
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
   * 🔥 OBTENER NOTICIAS POR SENADOR (PÚBLICO)
   * GET /api/content/senador/:senadorId
   */
  async getContentsBySenador(req, res) {
    try {
      const { senadorId } = req.params;
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      
      console.log(`\n👤 [PUBLICO] Buscando noticias del senador ID: ${senadorId}`);
      
      // Validar que sea un número
      const idNumero = parseInt(senadorId);
      if (isNaN(idNumero)) {
        console.log(`❌ ID inválido: ${senadorId}`);
        return res.status(400).json({
          success: false,
          message: 'ID de senador inválido'
        });
      }
      
      // Publicar contenido programado si corresponde
      const now = new Date();
      const scheduledToPublish = await Content.find({
        status: 'scheduled',
        scheduledFor: { $lte: now }
      }).limit(10);
      
      for (const content of scheduledToPublish) {
        content.status = 'published';
        content.publishedAt = now;
        content.scheduledFor = null;
        await content.save();
        console.log(`   ✅ Publicado automáticamente: "${content.title}"`);
      }
      
      // Buscar noticias donde el senador esté en participantes
      const skip = (page - 1) * limit;
      
      const query = {
        status: 'published',
        participantes: { $in: [idNumero] }
      };
      
      const [contents, total] = await Promise.all([
        Content.find(query)
          .sort({ publishedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('title slug excerpt category publishedAt featuredImage views participantes')
          .lean(),
        Content.countDocuments(query)
      ]);
      
      console.log(`   📊 Encontradas ${contents.length} noticias para el senador ${senadorId}`);
      
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
      console.error(`❌ Error en getContentsBySenador: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 🔥 OBTENER NOTICIAS POR MÚLTIPLES SENADORES (PÚBLICO)
   * POST /api/content/senadores
   */
  async getContentsBySenadores(req, res) {
    try {
      const { senadoresIds, limit = 20 } = req.body;
      
      if (!senadoresIds || !Array.isArray(senadoresIds) || senadoresIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de IDs de senadores'
        });
      }
      
      console.log(`\n👥 [PUBLICO] Buscando noticias para ${senadoresIds.length} senadores`);
      
      // Convertir a números
      const idsNumericos = senadoresIds
        .map(id => parseInt(id))
        .filter(id => !isNaN(id));
      
      if (idsNumericos.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'IDs de senadores inválidos'
        });
      }
      
      // Publicar contenido programado
      const now = new Date();
      const scheduledToPublish = await Content.find({
        status: 'scheduled',
        scheduledFor: { $lte: now }
      }).limit(10);
      
      for (const content of scheduledToPublish) {
        content.status = 'published';
        content.publishedAt = now;
        content.scheduledFor = null;
        await content.save();
      }
      
      const contents = await Content.find({
        status: 'published',
        participantes: { $in: idsNumericos }
      })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(limit)
        .select('title slug excerpt category publishedAt featuredImage views participantes')
        .lean();
      
      console.log(`   📊 Encontradas ${contents.length} noticias`);
      
      res.json({
        success: true,
        data: contents
      });
      
    } catch (error) {
      console.error(`❌ Error en getContentsBySenadores: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener noticias por categoría (PÚBLICO)
   */
  async getContentsByCategory(req, res) {
    try {
      const { category } = req.params;
      const limit = parseInt(req.query.limit) || 10;
      const excludeId = req.query.exclude;
      
      if (category !== 'noticia' && category !== 'importante') {
        return res.status(400).json({
          success: false,
          message: 'Categoría no válida. Use "noticia" o "importante"'
        });
      }
      
      const now = new Date();
      const scheduledToPublish = await Content.find({
        status: 'scheduled',
        scheduledFor: { $lte: now }
      }).limit(10);
      
      for (const content of scheduledToPublish) {
        content.status = 'published';
        content.publishedAt = now;
        content.scheduledFor = null;
        await content.save();
        console.log(`   ✅ Publicada automáticamente: "${content.title}"`);
      }
      
      const filters = { 
        status: 'published',
        category: category 
      };
      
      if (excludeId && excludeId.match(/^[0-9a-fA-F]{24}$/)) {
        filters._id = { $ne: excludeId };
      }
      
      const contents = await Content.find(filters)
        .sort({ publishedAt: -1 })
        .limit(limit)
        .select('title slug excerpt category publishedAt featuredImage views');
      
      res.json({
        success: true,
        data: contents
      });
    } catch (error) {
      console.error(`❌ Error en getContentsByCategory: ${error.message}`);
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
      { value: 'noticia', label: '📰 Noticia', description: 'Noticias regulares del día a día', color: 'blue' },
      { value: 'importante', label: '⭐ Importante', description: 'Noticias destacadas, leyes aprobadas, eventos especiales', color: 'red' },
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

  /**
   * Publicar contenido programado (endpoint para cron o bajo demanda)
   */
  async publishScheduledContent(req, res) {
    try {
      console.log('\n⏰ [publishScheduledContent] Verificando contenido programado...');
      
      const now = new Date();
      
      const scheduledContents = await Content.find({
        status: 'scheduled',
        scheduledFor: { $lte: now }
      });
      
      console.log(`   📝 Encontrados ${scheduledContents.length} contenidos para publicar`);
      
      let published = 0;
      let errors = 0;
      
      for (const content of scheduledContents) {
        try {
          content.status = 'published';
          content.publishedAt = now;
          content.scheduledFor = null;
          await content.save();
          published++;
          console.log(`   ✅ Publicado: "${content.title}"`);
        } catch (error) {
          errors++;
          console.error(`   ❌ Error publicando "${content.title}":`, error.message);
        }
      }
      
      console.log(`   📊 Resumen: ${published} publicados, ${errors} errores`);
      
      res.json({
        success: true,
        message: 'Verificación completada',
        data: { published, errors, total: scheduledContents.length }
      });
    } catch (error) {
      console.error('❌ Error en publishScheduledContent:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new ContentController();