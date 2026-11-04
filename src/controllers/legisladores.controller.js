// src/controllers/legisladores.controller.js
const Senador = require('../models/Senador');
const Comision = require('../models/Comision');
const DirectivaCamaral = require('../models/DirectivaCamaral');
const legisladoresService = require('../services/legisladores.service');
const { processImage } = require('../middleware/upload');
const path = require('path');

// ============================================
// 🛠️ HELPER: Validar que los IDs sean senadores titulares
// ============================================
const validarSenadoresTitulares = async (ids) => {
  const idsUnicos = [...new Set(ids)];
  const titulares = await Senador.find({
    id: { $in: idsUnicos },
    tipo: 'titular'
  })
    .select('id name foto party partyShort department')
    .lean();

  const encontrados = titulares.map((t) => t.id);
  const faltantes = idsUnicos.filter((id) => !encontrados.includes(id));

  if (faltantes.length > 0) {
    return {
      ok: false,
      mensaje: `Los siguientes IDs no son senadores titulares válidos: ${faltantes.join(', ')}`
    };
  }

  return { ok: true, titulares };
};

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

      // 1. Buscar la directiva activa en BD
      const directivaDB = await DirectivaCamaral.findOne({ activa: true }).lean();

      // 2. Definir los IDs (BD si existe, hardcoded como fallback)
      let ids;
      let gestion;
      let fuente;

      if (directivaDB) {
        ids = {
          presidente: directivaDB.presidenteId,
          primeraVice: directivaDB.primeraViceId,
          segundaVice: directivaDB.segundaViceId,
          primeraSecretaria: directivaDB.primeraSecretariaId,
          segundaSecretaria: directivaDB.segundaSecretariaId,
          terceraSecretaria: directivaDB.terceraSecretariaId
        };
        gestion = directivaDB.gestion;
        fuente = 'db';
      } else {
        // Fallback: valores hardcodeados (compatibilidad)
        ids = {
          presidente: 32,
          primeraVice: 6,
          segundaVice: 12,
          primeraSecretaria: 33,
          segundaSecretaria: 24,
          terceraSecretaria: 13
        };
        gestion = '2025-2026';
        fuente = 'hardcoded';
      }

      console.log(`   📊 Fuente: ${fuente} | Gestión: ${gestion}`);

      // 3. Buscar los senadores en la BD
      const miembros = await Senador.find({
        id: { $in: Object.values(ids) }
      }).lean();

      console.log(`   ✅ Encontrados ${miembros.length} miembros`);

      // 4. Helper para buscar miembro por ID
      const findMember = (id) => miembros.find((m) => m.id === id) || null;

      // 5. Construir respuesta (MISMO FORMATO QUE ANTES)
      const resultado = {
        presidente: findMember(ids.presidente),
        vicepresidencias: [
          { ...findMember(ids.primeraVice), cargo: 'Primera Vicepresidencia' },
          { ...findMember(ids.segundaVice), cargo: 'Segunda Vicepresidencia' }
        ].filter((m) => m && m.id),
        secretarias: [
          { ...findMember(ids.primeraSecretaria), cargo: 'Primera Secretaria' },
          { ...findMember(ids.segundaSecretaria), cargo: 'Segunda Secretaria' },
          { ...findMember(ids.terceraSecretaria), cargo: 'Tercera Secretaria' }
        ].filter((m) => m && m.id)
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

  /**
   * GET /api/legisladores/directiva/admin
   *
   * ADMIN — Devuelve la directiva actual con los IDs crudos
   * para que el CMS pueda poblar el formulario de edición.
   */
  async getDirectivaAdmin(req, res) {
    try {
      console.log('\n🔒 [getDirectivaAdmin] Obteniendo directiva para CMS');

      const directivaDB = await DirectivaCamaral.findOne({ activa: true })
        .populate('creadoPor', 'email profile')
        .populate('actualizadoPor', 'email profile')
        .lean();

      if (!directivaDB) {
        console.log('   ⚠️ No hay directiva en BD, usando fallback');
        return res.json({
          success: true,
          data: {
            _id: null,
            gestion: '2025-2026',
            presidenteId: 32,
            primeraViceId: 6,
            segundaViceId: 12,
            primeraSecretariaId: 33,
            segundaSecretariaId: 24,
            terceraSecretariaId: 13,
            activa: true,
            esHardcoded: true
          }
        });
      }

      console.log(`   ✅ Directiva encontrada (gestión ${directivaDB.gestion})`);

      res.json({
        success: true,
        data: {
          ...directivaDB,
          esHardcoded: false
        }
      });
    } catch (error) {
      console.error('❌ Error en getDirectivaAdmin:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la directiva'
      });
    }
  }

  /**
   * GET /api/legisladores/directiva/titulares
   *
   * ADMIN — Lista de senadores titulares disponibles para
   * asignar a los cargos de la directiva.
   */
  async getTitularesDisponibles(req, res) {
    try {
      console.log('\n📋 [getTitularesDisponibles] Obteniendo senadores titulares');

      const titulares = await Senador.find({ tipo: 'titular' })
        .select('id name foto party partyShort partyColor department cargo seatNumber')
        .sort({ name: 1 })
        .lean();

      console.log(`   ✅ ${titulares.length} titulares encontrados`);

      res.json({
        success: true,
        data: titulares,
        total: titulares.length
      });
    } catch (error) {
      console.error('❌ Error en getTitularesDisponibles:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los titulares'
      });
    }
  }

  /**
   * PUT /api/legisladores/directiva
   *
   * ADMIN — Crea o actualiza la directiva activa.
   */
  async saveDirectiva(req, res) {
    try {
      console.log('\n💾 [saveDirectiva] Guardando directiva camaral');
      console.log('   👤 Usuario:', req.user.email);
      console.log('   📦 Body:', req.body);

      const {
        gestion,
        presidenteId,
        primeraViceId,
        segundaViceId,
        primeraSecretariaId,
        segundaSecretariaId,
        terceraSecretariaId
      } = req.body;

      // 1. Validar que todos los campos estén presentes
      const faltantes = [];
      if (!presidenteId) faltantes.push('presidenteId');
      if (!primeraViceId) faltantes.push('primeraViceId');
      if (!segundaViceId) faltantes.push('segundaViceId');
      if (!primeraSecretariaId) faltantes.push('primeraSecretariaId');
      if (!segundaSecretariaId) faltantes.push('segundaSecretariaId');
      if (!terceraSecretariaId) faltantes.push('terceraSecretariaId');

      if (faltantes.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Faltan campos obligatorios: ${faltantes.join(', ')}`
        });
      }

      // 2. Convertir a números
      const ids = {
        presidenteId: Number(presidenteId),
        primeraViceId: Number(primeraViceId),
        segundaViceId: Number(segundaViceId),
        primeraSecretariaId: Number(primeraSecretariaId),
        segundaSecretariaId: Number(segundaSecretariaId),
        terceraSecretariaId: Number(terceraSecretariaId)
      };

      // 3. Validar que no haya NaN
      for (const [key, value] of Object.entries(ids)) {
        if (isNaN(value)) {
          return res.status(400).json({
            success: false,
            message: `El campo ${key} debe ser un número válido`
          });
        }
      }

      // 4. Validar duplicados
      const valores = Object.values(ids);
      const unicos = new Set(valores);
      if (unicos.size !== valores.length) {
        return res.status(400).json({
          success: false,
          message: 'Un senador no puede ocupar dos posiciones en la directiva. Cada cargo debe ser una persona distinta.'
        });
      }

      // 5. Validar que todos sean senadores titulares
      const validacion = await validarSenadoresTitulares(valores);
      if (!validacion.ok) {
        return res.status(400).json({
          success: false,
          message: validacion.mensaje
        });
      }

      // 6. Upsert: buscar directiva activa existente
      const gestionFinal = (gestion || '2025-2026').trim();
      let directiva = await DirectivaCamaral.findOne({ activa: true });

      if (directiva) {
        console.log('   🔄 Actualizando directiva existente');
        directiva.gestion = gestionFinal;
        
        // 🔥 SOLUCIÓN: Asignar campo por campo para evitar errores de Mongoose
        directiva.presidenteId = ids.presidenteId;
        directiva.primeraViceId = ids.primeraViceId;
        directiva.segundaViceId = ids.segundaViceId;
        directiva.primeraSecretariaId = ids.primeraSecretariaId;
        directiva.segundaSecretariaId = ids.segundaSecretariaId;
        directiva.terceraSecretariaId = ids.terceraSecretariaId;
        
        directiva.actualizadoPor = req.user._id;
      } else {
        console.log('   ➕ Creando nueva directiva');
        directiva = new DirectivaCamaral({
          gestion: gestionFinal,
          ...ids,
          activa: true,
          creadoPor: req.user._id,
          actualizadoPor: req.user._id
        });
      }

      await directiva.save();

      console.log(`   ✅ Directiva guardada (ID: ${directiva._id})`);

      // 7. Devolver la directiva con los datos populados de los senadores
      const poblada = await this._formatearDirectiva(directiva);

      res.json({
        success: true,
        message: 'Directiva actualizada exitosamente',
        data: poblada
      });
    } catch (error) {
      console.error('❌ Error en saveDirectiva:', error);

      if (error.name === 'ValidationError') {
        const mensajes = Object.values(error.errors).map((e) => e.message);
        return res.status(400).json({
          success: false,
          message: mensajes.join('. '),
          errores: mensajes
        });
      }

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una directiva para esa gestión'
        });
      }

      // 🔥 SOLUCIÓN: Devolver el error real en caso de fallo interno
      res.status(500).json({
        success: false,
        message: `Error al guardar la directiva: ${error.message}`,
        error: error.message
      });
    }
  }

  /**
   * POST /api/legisladores/directiva/seed
   *
   * SUPER_ADMIN — Inicializa la directiva en BD con los valores
   * hardcodeados actuales (migración inicial).
   */
  async seedDirectiva(req, res) {
    try {
      console.log('\n🌱 [seedDirectiva] Inicializando directiva en BD');

      const existe = await DirectivaCamaral.findOne({ activa: true });
      if (existe) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una directiva activa. Usa PUT para modificarla.'
        });
      }

      const directiva = new DirectivaCamaral({
        gestion: '2025-2026',
        presidenteId: 32,
        primeraViceId: 6,
        segundaViceId: 12,
        primeraSecretariaId: 33,
        segundaSecretariaId: 24,
        terceraSecretariaId: 13,
        activa: true,
        creadoPor: req.user._id,
        actualizadoPor: req.user._id
      });

      await directiva.save();

      console.log(`   ✅ Directiva inicial creada (ID: ${directiva._id})`);

      res.status(201).json({
        success: true,
        message: 'Directiva inicial creada exitosamente',
        data: directiva
      });
    } catch (error) {
      console.error('❌ Error en seedDirectiva:', error);
      res.status(500).json({
        success: false,
        message: 'Error al inicializar la directiva'
      });
    }
  }

  /**
   * Helper privado: formatea la directiva con los datos de los senadores
   */
  async _formatearDirectiva(directiva) {
    const ids = [
      directiva.presidenteId,
      directiva.primeraViceId,
      directiva.segundaViceId,
      directiva.primeraSecretariaId,
      directiva.segundaSecretariaId,
      directiva.terceraSecretariaId
    ];

    const senadores = await Senador.find({ id: { $in: ids } }).lean();
    const find = (id) => senadores.find((s) => s.id === id) || null;

    return {
      _id: directiva._id,
      gestion: directiva.gestion,
      presidente: find(directiva.presidenteId),
      vicepresidencias: [
        { ...find(directiva.primeraViceId), cargo: 'Primera Vicepresidencia' },
        { ...find(directiva.segundaViceId), cargo: 'Segunda Vicepresidencia' }
      ].filter((m) => m && m.id),
      secretarias: [
        { ...find(directiva.primeraSecretariaId), cargo: 'Primera Secretaria' },
        { ...find(directiva.segundaSecretariaId), cargo: 'Segunda Secretaria' },
        { ...find(directiva.terceraSecretariaId), cargo: 'Tercera Secretaria' }
      ].filter((m) => m && m.id)
    };
  }

  // ============================================
  // 🔥 OBTENER COMISIONES Y COMITÉS (CON SUPLENTES - CORREGIDO)
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

      // 🔥 Función para obtener datos del senador (CORREGIDA - usa s.fotoSuplente)
      const getSenadorInfo = (id) => {
        const s = senadoresMap[id];
        if (!s) return null;

        let suplenteNombre = null;
        let cargoSuplente = null;

        if (s.suplente) {
          suplenteNombre = s.suplente;
          // Buscar el suplente para obtener su cargo (no su foto)
          const suplenteData = Object.values(senadoresMap).find(
            sen => sen.name === s.suplente || sen.slug === s.slugSuplente
          );
          if (suplenteData) {
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
          // ✅ CORREGIDO: Usar s.fotoSuplente directamente
          fotoSuplente: s.fotoSuplente || '',
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