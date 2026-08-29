// src/controllers/legisladores.controller.js
const Senador = require('../models/Senador');
const Comision = require('../models/Comision');
const legisladoresService = require('../services/legisladores.service');
const { processImage } = require('../middleware/upload');
const path = require('path');

/**
 * @swagger
 * tags:
 *   name: Legisladores
 *   description: Gestión de legisladores y representantes
 */

class LegisladoresController {
  /**
   * @swagger
   * /api/legisladores:
   *   post:
   *     summary: Crear nuevo legislador
   *     tags: [Legisladores]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - nombres
   *               - apellidos
   *               - ci
   *               - partidoPolitico
   *             properties:
   *               nombres:
   *                 type: string
   *               apellidos:
   *                 type: string
   *               ci:
   *                 type: string
   *               partidoPolitico:
   *                 type: string
   *               cargoActual:
   *                 type: string
   *               distrito:
   *                 type: object
   *               comisiones:
   *                 type: array
   *                 items:
   *                   type: object
   *     responses:
   *       201:
   *         description: Legislador creado exitosamente
   *       400:
   *         description: Error en los datos
   */
  async createLegislador(req, res) {
    try {
      const legislador = await legisladoresService.createLegislador(req.body, req.user._id);
      
      res.status(201).json({
        success: true,
        message: 'Legislador creado exitosamente',
        data: legislador,
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
   * /api/legisladores:
   *   get:
   *     summary: Obtener lista de legisladores
   *     tags: [Legisladores]
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
   *         name: partidoPolitico
   *         schema:
   *           type: string
   *       - in: query
   *         name: bancada
   *         schema:
   *           type: string
   *       - in: query
   *         name: cargoActual
   *         schema:
   *           type: string
   *       - in: query
   *         name: departamento
   *         schema:
   *           type: string
   *       - in: query
   *         name: comision
   *         schema:
   *           type: string
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Lista de legisladores obtenida
   */
  async getLegisladores(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        partidoPolitico, 
        bancada, 
        cargoActual, 
        departamento,
        comision,
        search,
        estado
      } = req.query;

      const filters = {};
      if (partidoPolitico) filters.partidoPolitico = partidoPolitico;
      if (bancada) filters.bancada = bancada;
      if (cargoActual) filters.cargoActual = cargoActual;
      if (departamento) filters.departamento = departamento;
      if (comision) filters.comision = comision;
      if (search) filters.search = search;
      if (estado) filters.estado = estado;

      const result = await legisladoresService.getLegisladores(
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
   * /api/legisladores/{id}:
   *   get:
   *     summary: Obtener legislador por ID
   *     tags: [Legisladores]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Legislador encontrado
   *       404:
   *         description: Legislador no encontrado
   */
  async getLegisladorById(req, res) {
    try {
      const { id } = req.params;
      const legislador = await legisladoresService.getLegisladorById(id);

      res.json({
        success: true,
        data: legislador,
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
   * /api/legisladores/ci/{ci}:
   *   get:
   *     summary: Obtener legislador por CI
   *     tags: [Legisladores]
   *     parameters:
   *       - in: path
   *         name: ci
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Legislador encontrado
   *       404:
   *         description: Legislador no encontrado
   */
  async getLegisladorByCI(req, res) {
    try {
      const { ci } = req.params;
      const legislador = await legisladoresService.getLegisladorByCI(ci);

      res.json({
        success: true,
        data: legislador,
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
   * /api/legisladores/{id}:
   *   put:
   *     summary: Actualizar legislador
   *     tags: [Legisladores]
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
   *               nombres:
   *                 type: string
   *               apellidos:
   *                 type: string
   *               partidoPolitico:
   *                 type: string
   *               cargoActual:
   *                 type: string
   *               comisiones:
   *                 type: array
   *                 items:
   *                   type: object
   *               contacto:
   *                 type: object
   *     responses:
   *       200:
   *         description: Legislador actualizado
   *       404:
   *         description: Legislador no encontrado
   */
  async updateLegislador(req, res) {
    try {
      const { id } = req.params;
      const legislador = await legisladoresService.updateLegislador(
        id, 
        req.body, 
        req.user._id
      );

      res.json({
        success: true,
        message: 'Legislador actualizado exitosamente',
        data: legislador,
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
   * /api/legisladores/{id}:
   *   delete:
   *     summary: Eliminar legislador
   *     tags: [Legisladores]
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
   *         description: Legislador eliminado
   *       404:
   *         description: Legislador no encontrado
   */
  async deleteLegislador(req, res) {
    try {
      const { id } = req.params;
      const result = await legisladoresService.deleteLegislador(id);

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
   * /api/legisladores/stats:
   *   get:
   *     summary: Obtener estadísticas de legisladores
   *     tags: [Legisladores]
   *     responses:
   *       200:
   *         description: Estadísticas obtenidas
   */
  async getStats(req, res) {
    try {
      const stats = await legisladoresService.getLegisladoresStats();

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
   * /api/legisladores/distribution/party:
   *   get:
   *     summary: Obtener distribución por partido político
   *     tags: [Legisladores]
   *     responses:
   *       200:
   *         description: Distribución por partido
   */
  async getDistributionByParty(req, res) {
    try {
      const distribution = await legisladoresService.getDistributionByParty();

      res.json({
        success: true,
        data: distribution,
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
   * /api/legisladores/distribution/department:
   *   get:
   *     summary: Obtener legisladores por departamento
   *     tags: [Legisladores]
   *     responses:
   *       200:
   *         description: Legisladores por departamento
   */
  async getByDepartamento(req, res) {
    try {
      const byDepartamento = await legisladoresService.getByDepartamento();

      res.json({
        success: true,
        data: byDepartamento,
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
   * /api/legisladores/search:
   *   get:
   *     summary: Buscar legisladores
   *     tags: [Legisladores]
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
  async searchLegisladores(req, res) {
    try {
      const { q, limit = 20 } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Término de búsqueda requerido',
        });
      }

      const results = await legisladoresService.searchLegisladores(q, parseInt(limit));

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
   * /api/legisladores/comisiones:
   *   get:
   *     summary: Obtener comisiones activas
   *     tags: [Legisladores]
   *     responses:
   *       200:
   *         description: Comisiones activas
   */
  async getComisionesActivas(req, res) {
    try {
      const comisiones = await legisladoresService.getComisionesActivas();

      res.json({
        success: true,
        data: comisiones,
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
   * /api/legisladores/upload/foto:
   *   post:
   *     summary: Subir foto de perfil para legislador
   *     tags: [Legisladores]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               foto:
   *                 type: string
   *                 format: binary
   *               legisladorId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Foto subida exitosamente
   */
  async uploadFotoPerfil(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se subió ninguna imagen',
        });
      }

      const imagePath = path.join(req.file.destination, req.file.filename);
      const processedFilename = await processImage(imagePath, {
        width: 400,
        height: 400,
        quality: 90,
        format: 'webp',
      });

      const imageUrl = `/uploads/legisladores/${processedFilename}`;

      if (req.body.legisladorId) {
        const legislador = await legisladoresService.getLegisladorById(req.body.legisladorId);
        legislador.fotoPerfil = {
          url: imageUrl,
          alt: `${legislador.nombreCompleto} - Foto de perfil`,
        };
        await legislador.save();
      }

      res.json({
        success: true,
        message: 'Foto subida exitosamente',
        data: {
          url: imageUrl,
          filename: processedFilename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    } catch (error) {
      console.error('Error subiendo foto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al subir la foto',
      });
    }
  }

  /**
   * @swagger
   * /api/legisladores/cargos:
   *   get:
   *     summary: Obtener cargos disponibles
   *     tags: [Legisladores]
   *     responses:
   *       200:
   *         description: Cargos disponibles
   */
  async getCargosDisponibles(req, res) {
    try {
      const cargos = [
        { value: 'Presidente', label: 'Presidente' },
        { value: 'Vicepresidente', label: 'Vicepresidente' },
        { value: 'Senador', label: 'Senador' },
        { value: 'Senadora', label: 'Senadora' },
        { value: 'Secretario', label: 'Secretario' },
        { value: 'Pro-Secretario', label: 'Pro-Secretario' },
      ];

      res.json({
        success: true,
        data: cargos,
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
   * /api/legisladores/estados:
   *   get:
   *     summary: Obtener estados disponibles
   *     tags: [Legisladores]
   *     responses:
   *       200:
   *         description: Estados disponibles
   */
  async getEstadosDisponibles(req, res) {
    try {
      const estados = [
        { value: 'activo', label: 'Activo', color: 'green' },
        { value: 'inactivo', label: 'Inactivo', color: 'gray' },
        { value: 'suspendido', label: 'Suspendido', color: 'red' },
        { value: 'licencia', label: 'En licencia', color: 'yellow' },
      ];

      res.json({
        success: true,
        data: estados,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ============================================
  // 🔥 OBTENER DIRECTIVA CAMARAL
  // ============================================

  /**
   * @swagger
   * /api/legisladores/directiva:
   *   get:
   *     summary: Obtener la directiva camaral (Presidente, Vicepresidencias, Secretarías)
   *     tags: [Legisladores]
   *     responses:
   *       200:
   *         description: Directiva camaral obtenida exitosamente
   */
  async getDirectivaCamaral(req, res) {
    try {
      console.log('\n👥 [getDirectivaCamaral] Obteniendo directiva camaral');

      const DIRECTIVA_IDS = {
        presidente: 32,
        primeraVice: 6,
        segundaVice: 12,
        primeraSecretaria: 33,
        segundaSecretaria: 13,
        terceraSecretaria: 24
      };

      const miembros = await Senador.find({
        id: {
          $in: [
            DIRECTIVA_IDS.presidente,
            DIRECTIVA_IDS.primeraVice,
            DIRECTIVA_IDS.segundaVice,
            DIRECTIVA_IDS.primeraSecretaria,
            DIRECTIVA_IDS.segundaSecretaria,
            DIRECTIVA_IDS.terceraSecretaria
          ]
        }
      }).lean();

      console.log(`✅ Encontrados ${miembros.length} miembros de la directiva`);

      const findMember = (id) => miembros.find(m => m.id === id) || null;

      const resultado = {
        presidente: findMember(DIRECTIVA_IDS.presidente),
        vicepresidencias: [
          { ...findMember(DIRECTIVA_IDS.primeraVice), cargo: 'Primera Vicepresidencia' },
          { ...findMember(DIRECTIVA_IDS.segundaVice), cargo: 'Segunda Vicepresidencia' }
        ].filter(m => m && m.id),
        secretarias: [
          { ...findMember(DIRECTIVA_IDS.primeraSecretaria), cargo: 'Primera Secretaria' },
          { ...findMember(DIRECTIVA_IDS.segundaSecretaria), cargo: 'Segunda Secretaria' },
          { ...findMember(DIRECTIVA_IDS.terceraSecretaria), cargo: 'Tercera Secretaria' }
        ].filter(m => m && m.id)
      };

      res.json({
        success: true,
        data: resultado
      });

    } catch (error) {
      console.error('❌ Error en getDirectivaCamaral:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la directiva camaral'
      });
    }
  }

  // ============================================
  // 🔥 OBTENER COMISIONES Y COMITÉS (CON SUPLENTES)
  // ============================================

  /**
   * @swagger
   * /api/legisladores/comisiones:
   *   get:
   *     summary: Obtener todas las comisiones y comités con sus miembros (incluye suplentes)
   *     tags: [Legisladores]
   *     responses:
   *       200:
   *         description: Comisiones y comités obtenidos exitosamente
   */
  async getComisiones(req, res) {
    try {
      console.log('\n📋 [getComisiones] Obteniendo comisiones y comités');

      // Obtener todas las comisiones
      const comisiones = await Comision.find().lean();

      // Obtener todos los senadores (titulares y suplentes)
      const senadores = await Senador.find().lean();
      const senadoresMap = {};
      senadores.forEach(s => {
        senadoresMap[s.id] = s;
      });

      // Función para obtener datos del senador (incluye suplente)
      const getSenadorInfo = (id) => {
        const s = senadoresMap[id];
        if (!s) return null;
        
        let suplenteNombre = null;
        let fotoSuplente = null;
        let cargoSuplente = null;
        
        // Buscar suplente si existe
        if (s.suplente) {
          suplenteNombre = s.suplente;
          // Buscar el suplente por nombre o slug
          const suplenteData = Object.values(senadoresMap).find(
            sen => sen.name === s.suplente || sen.slug === s.slugSuplente
          );
          if (suplenteData) {
            fotoSuplente = suplenteData.foto;
            cargoSuplente = suplenteData.cargo || 'Senador Suplente';
          }
        }
        
        return {
          nombre: s.name,
          nombreCompleto: s.name,
          foto: s.foto || '',
          partido: s.partyShort || s.party || '',
          color: s.partyColor || '#666',
          cargo: s.cargo || 'Senador',
          suplente: !!s.suplente,
          suplenteNombre: suplenteNombre,
          fotoSuplente: fotoSuplente || '',
          cargoSuplente: cargoSuplente || 'Senador Suplente'
        };
      };

      // Construir respuesta
      const resultado = comisiones.map(comision => {
        const presidente = getSenadorInfo(comision.presidenteId);
        
        const comites = (comision.comites || []).map(comite => {
          const secretario = getSenadorInfo(comite.secretarioId);
          return {
            nombre: comite.nombre,
            secretario: secretario
          };
        });

        return {
          nombre: comision.nombre,
          presidente: presidente,
          comites: comites
        };
      });

      res.json({
        success: true,
        data: resultado
      });

    } catch (error) {
      console.error('❌ Error en getComisiones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener comisiones y comités'
      });
    }
  }
}

module.exports = new LegisladoresController();