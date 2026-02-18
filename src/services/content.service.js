const Content = require('../models/Content');

class ContentService {
  /**
   * Crear nuevo contenido
   */
  async createContent(data, authorId) {
    try {
      const contentData = {
        ...data,
        author: authorId,
        lastModifiedBy: authorId,
      };
      
      const content = new Content(contentData);
      await content.save();
      
      return content;
    } catch (error) {
      throw new Error(`Error al crear contenido: ${error.message}`);
    }
  }
  
  /**
   * Obtener contenido paginado con filtros
   */
  async getContents(page = 1, limit = 10, filters = {}) {
    try {
      const query = {};
      
      // Aplicar filtros
      if (filters.type) query.type = filters.type;
      if (filters.category) query.category = filters.category;
      if (filters.status) query.status = filters.status;
      if (filters.language) query.language = filters.language;
      
      // Filtrar por tags
      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }
      
      // Buscar por texto
      if (filters.search) {
        query.$text = { $search: filters.search };
      }
      
      // Filtrar por fecha
      if (filters.fromDate || filters.toDate) {
        query.publishedAt = {};
        if (filters.fromDate) query.publishedAt.$gte = new Date(filters.fromDate);
        if (filters.toDate) query.publishedAt.$lte = new Date(filters.toDate);
      }
      
      // Solo contenido publicado o programado que ya debería publicarse
      if (!filters.includeDrafts) {
        query.$or = [
          { status: 'published' },
          { 
            status: 'scheduled',
            scheduledFor: { $lte: new Date() }
          }
        ];
      }
      
      const skip = (page - 1) * limit;
      
      const [contents, total] = await Promise.all([
        Content.find(query)
          .populate('author', 'email profile')
          .populate('lastModifiedBy', 'email profile')
          .sort({ publishedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Content.countDocuments(query),
      ]);
      
      return {
        contents,
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      };
    } catch (error) {
      throw new Error(`Error al obtener contenidos: ${error.message}`);
    }
  }
  
  /**
   * Obtener contenido por ID
   */
  async getContentById(id) {
    try {
      const content = await Content.findById(id)
        .populate('author', 'email profile')
        .populate('lastModifiedBy', 'email profile')
        .populate('relatedContent', 'title slug type');
      
      if (!content) {
        throw new Error('Contenido no encontrado');
      }
      
      return content;
    } catch (error) {
      throw new Error(`Error al obtener contenido: ${error.message}`);
    }
  }
  
  /**
   * Obtener contenido por slug
   */
  async getContentBySlug(slug) {
    try {
      const content = await Content.findOne({ slug })
        .populate('author', 'email profile')
        .populate('lastModifiedBy', 'email profile')
        .populate('relatedContent', 'title slug type');
      
      if (!content) {
        throw new Error('Contenido no encontrado');
      }
      
      // Incrementar vistas si está publicado
      if (content.status === 'published') {
        await content.incrementViews();
      }
      
      return content;
    } catch (error) {
      throw new Error(`Error al obtener contenido: ${error.message}`);
    }
  }
  
  /**
   * Actualizar contenido
   */
  async updateContent(id, data, userId) {
    try {
      const content = await Content.findById(id);
      
      if (!content) {
        throw new Error('Contenido no encontrado');
      }
      
      // Guardar versión actual en el historial
      content.versionHistory.push({
        content: content.content,
        modifiedBy: content.lastModifiedBy,
        modifiedAt: content.updatedAt,
        revision: content.revision,
        comment: 'Actualización automática',
      });
      
      // Actualizar campos
      Object.keys(data).forEach(key => {
        if (key !== '_id' && key !== '__v') {
          content[key] = data[key];
        }
      });
      
      content.lastModifiedBy = userId;
      content.revision += 1;
      content.updatedAt = new Date();
      
      await content.save();
      
      return content;
    } catch (error) {
      throw new Error(`Error al actualizar contenido: ${error.message}`);
    }
  }
  
  /**
   * Eliminar contenido
   */
  async deleteContent(id) {
    try {
      const content = await Content.findByIdAndDelete(id);
      
      if (!content) {
        throw new Error('Contenido no encontrado');
      }
      
      return { message: 'Contenido eliminado exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar contenido: ${error.message}`);
    }
  }
  
  /**
   * Cambiar estado del contenido
   */
  async changeContentStatus(id, status, userId) {
    try {
      const content = await Content.findById(id);
      
      if (!content) {
        throw new Error('Contenido no encontrado');
      }
      
      content.status = status;
      content.lastModifiedBy = userId;
      
      if (status === 'published' && !content.publishedAt) {
        content.publishedAt = new Date();
      }
      
      await content.save();
      
      return content;
    } catch (error) {
      throw new Error(`Error al cambiar estado: ${error.message}`);
    }
  }
  
  /**
   * Obtener estadísticas de contenido
   */
  async getContentStats() {
    try {
      const stats = await Content.aggregate([
        {
          $group: {
            _id: {
              type: '$type',
              status: '$status',
              category: '$category',
            },
            count: { $sum: 1 },
            totalViews: { $sum: '$views' },
          },
        },
        {
          $group: {
            _id: '$_id.type',
            byStatus: {
              $push: {
                status: '$_id.status',
                count: '$count',
              },
            },
            byCategory: {
              $push: {
                category: '$_id.category',
                count: '$count',
              },
            },
            total: { $sum: '$count' },
            totalViews: { $sum: '$totalViews' },
          },
        },
      ]);
      
      return stats;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }
  
  /**
   * Buscar contenido por texto
   */
  async searchContent(query, limit = 20) {
    try {
      const results = await Content.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .select('title slug excerpt type category publishedAt featuredImage');
      
      return results;
    } catch (error) {
      throw new Error(`Error en búsqueda: ${error.message}`);
    }
  }
  
  /**
   * Obtener contenido relacionado
   */
  async getRelatedContent(contentId, limit = 5) {
    try {
      const content = await Content.findById(contentId);
      
      if (!content) {
        return [];
      }
      
      const related = await Content.find({
        $and: [
          { _id: { $ne: contentId } },
          { 
            $or: [
              { category: content.category },
              { tags: { $in: content.tags } },
              { type: content.type },
            ],
          },
          { status: 'published' },
        ],
      })
        .limit(limit)
        .select('title slug excerpt type category publishedAt featuredImage');
      
      return related;
    } catch (error) {
      throw new Error(`Error al obtener contenido relacionado: ${error.message}`);
    }
  }
}

module.exports = new ContentService();