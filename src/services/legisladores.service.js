const Legislador = require('../models/Legislador');

class LegisladoresService {
  /**
   * Crear nuevo legislador
   */
  async createLegislador(data, userId) {
    try {
      const legisladorData = {
        ...data,
        createdBy: userId,
        lastUpdatedBy: userId,
      };
      
      const legislador = new Legislador(legisladorData);
      await legislador.save();
      
      return legislador;
    } catch (error) {
      throw new Error(`Error al crear legislador: ${error.message}`);
    }
  }
  
  /**
   * Obtener legisladores paginados con filtros
   */
  async getLegisladores(page = 1, limit = 10, filters = {}) {
    try {
      const query = {};
      
      // Aplicar filtros
      if (filters.partidoPolitico) query.partidoPolitico = filters.partidoPolitico;
      if (filters.bancada) query.bancada = filters.bancada;
      if (filters.cargoActual) query.cargoActual = filters.cargoActual;
      if (filters.estado) query.estado = filters.estado;
      
      // Filtrar por departamento
      if (filters.departamento) {
        query['distrito.departamento'] = filters.departamento;
      }
      
      // Filtrar por comisión
      if (filters.comision) {
        query['comisiones.nombre'] = filters.comision;
      }
      
      // Buscar por texto
      if (filters.search) {
        query.$text = { $search: filters.search };
      }
      
      const skip = (page - 1) * limit;
      
      const [legisladores, total] = await Promise.all([
        Legislador.find(query)
          .populate('createdBy', 'email profile')
          .populate('lastUpdatedBy', 'email profile')
          .sort({ apellidos: 1, nombres: 1 })
          .skip(skip)
          .limit(limit),
        Legislador.countDocuments(query),
      ]);
      
      return {
        legisladores,
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      };
    } catch (error) {
      throw new Error(`Error al obtener legisladores: ${error.message}`);
    }
  }
  
  /**
   * Obtener legislador por ID
   */
  async getLegisladorById(id) {
    try {
      const legislador = await Legislador.findById(id)
        .populate('createdBy', 'email profile')
        .populate('lastUpdatedBy', 'email profile');
      
      if (!legislador) {
        throw new Error('Legislador no encontrado');
      }
      
      return legislador;
    } catch (error) {
      throw new Error(`Error al obtener legislador: ${error.message}`);
    }
  }
  
  /**
   * Obtener legislador por CI
   */
  async getLegisladorByCI(ci) {
    try {
      const legislador = await Legislador.findOne({ ci })
        .populate('createdBy', 'email profile')
        .populate('lastUpdatedBy', 'email profile');
      
      if (!legislador) {
        throw new Error('Legislador no encontrado');
      }
      
      return legislador;
    } catch (error) {
      throw new Error(`Error al obtener legislador: ${error.message}`);
    }
  }
  
  /**
   * Actualizar legislador
   */
  async updateLegislador(id, data, userId) {
    try {
      const legislador = await Legislador.findById(id);
      
      if (!legislador) {
        throw new Error('Legislador no encontrado');
      }
      
      // Actualizar campos
      Object.keys(data).forEach(key => {
        if (key !== '_id' && key !== '__v' && key !== 'ci') {
          legislador[key] = data[key];
        }
      });
      
      legislador.lastUpdatedBy = userId;
      legislador.updatedAt = new Date();
      
      await legislador.save();
      
      return legislador;
    } catch (error) {
      throw new Error(`Error al actualizar legislador: ${error.message}`);
    }
  }
  
  /**
   * Eliminar legislador
   */
  async deleteLegislador(id) {
    try {
      const legislador = await Legislador.findByIdAndDelete(id);
      
      if (!legislador) {
        throw new Error('Legislador no encontrado');
      }
      
      return { message: 'Legislador eliminado exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar legislador: ${error.message}`);
    }
  }
  
  /**
   * Obtener estadísticas de legisladores
   */
  async getLegisladoresStats() {
    try {
      const stats = await Legislador.aggregate([
        {
          $group: {
            _id: {
              partido: '$partidoPolitico',
              cargo: '$cargoActual',
              estado: '$estado',
            },
            count: { $sum: 1 },
            avgAsistencia: { $avg: '$porcentajeAsistencia' },
            avgProyectos: { $avg: '$proyectosPresentados' },
          },
        },
        {
          $group: {
            _id: '$_id.partido',
            porCargo: {
              $push: {
                cargo: '$_id.cargo',
                count: '$count',
              },
            },
            porEstado: {
              $push: {
                estado: '$_id.estado',
                count: '$count',
              },
            },
            total: { $sum: '$count' },
            promedioAsistencia: { $avg: '$avgAsistencia' },
            promedioProyectos: { $avg: '$avgProyectos' },
          },
        },
      ]);
      
      return stats;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }
  
  /**
   * Obtener distribución por partido político
   */
  async getDistributionByParty() {
    try {
      const distribution = await Legislador.aggregate([
        {
          $group: {
            _id: '$partidoPolitico',
            count: { $sum: 1 },
            legisladores: {
              $push: {
                nombre: '$nombreCompleto',
                cargo: '$cargoActual',
                departamento: '$distrito.departamento',
              },
            },
          },
        },
        { $sort: { count: -1 } },
      ]);
      
      return distribution;
    } catch (error) {
      throw new Error(`Error al obtener distribución: ${error.message}`);
    }
  }
  
  /**
   * Obtener legisladores por departamento
   */
  async getByDepartamento() {
    try {
      const byDepartamento = await Legislador.aggregate([
        {
          $group: {
            _id: '$distrito.departamento',
            count: { $sum: 1 },
            legisladores: {
              $push: {
                nombre: '$nombreCompleto',
                partido: '$partidoPolitico',
                cargo: '$cargoActual',
              },
            },
          },
        },
        { $sort: { count: -1 } },
      ]);
      
      return byDepartamento;
    } catch (error) {
      throw new Error(`Error al obtener por departamento: ${error.message}`);
    }
  }
  
  /**
   * Buscar legisladores por texto
   */
  async searchLegisladores(query, limit = 20) {
    try {
      const results = await Legislador.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .select('nombres apellidos nombreCompleto partidoPolitico cargoActual fotoPerfil distrito');
      
      return results;
    } catch (error) {
      throw new Error(`Error en búsqueda: ${error.message}`);
    }
  }
  
  /**
   * Obtener comisiones activas
   */
  async getComisionesActivas() {
    try {
      const comisiones = await Legislador.aggregate([
        { $unwind: '$comisiones' },
        {
          $group: {
            _id: '$comisiones.nombre',
            miembros: { $sum: 1 },
            presidentes: {
              $sum: {
                $cond: [{ $eq: ['$comisiones.cargo', 'Presidente'] }, 1, 0],
              },
            },
            legisladores: {
              $push: {
                nombre: '$nombreCompleto',
                cargo: '$comisiones.cargo',
                partido: '$partidoPolitico',
              },
            },
          },
        },
        { $sort: { miembros: -1 } },
      ]);
      
      return comisiones;
    } catch (error) {
      throw new Error(`Error al obtener comisiones: ${error.message}`);
    }
  }
}

module.exports = new LegisladoresService();