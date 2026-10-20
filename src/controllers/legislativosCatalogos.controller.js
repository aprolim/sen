// src/controllers/legislativosCatalogos.controller.js
const LegislativoSenador = require('../models/LegislativoSenador');
const LegislativoComision = require('../models/LegislativoComision');

// ============================================
// HELPERS
// ============================================
const validarNombre = (nombre) => {
  if (typeof nombre !== 'string' || !nombre.trim()) {
    return { ok: false, mensaje: 'El nombre es requerido' };
  }
  if (nombre.trim().length > 300) {
    return { ok: false, mensaje: 'El nombre no puede exceder 300 caracteres' };
  }
  return { ok: true };
};

const parseBool = (v, def = true) => {
  if (v === undefined || v === null) return def;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'true';
  return def;
};

const parseOrden = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

// ============================================
// 📡 PÚBLICO (o CMS) - Listar
// ============================================

/**
 * GET /api/legislativos/catalogos/senadores
 * GET /api/legislativos/catalogos/senadores?q=wilder
 * GET /api/legislativos/catalogos/senadores?incluirInactivos=true
 */
const getSenadores = async (req, res) => {
  try {
    const { q, incluirInactivos } = req.query;

    const filters = {};
    if (incluirInactivos !== 'true') filters.activo = true;

    if (q && typeof q === 'string' && q.trim()) {
      filters.nombre = { $regex: q.trim(), $options: 'i' };
    }

    const senadores = await LegislativoSenador.find(filters)
      .sort({ orden: 1, nombre: 1 })
      .lean();

    // Mismo formato que el catálogo global: { id, name, value, label, ... }
    const data = senadores.map((s) => ({
      _id: String(s._id),
      id: String(s._id),
      nombre: s.nombre,
      name: s.nombre,
      value: s.nombre,
      label: s.nombre,
      activo: s.activo,
      orden: s.orden
    }));

    res.json({ success: true, data, total: data.length });
  } catch (error) {
    console.error('❌ [legislativosCatalogos.getSenadores]', error);
    res.status(500).json({ success: false, message: 'Error al obtener los senadores' });
  }
};

/**
 * GET /api/legislativos/catalogos/comisiones
 * GET /api/legislativos/catalogos/comisiones?q=constituci
 * GET /api/legislativos/catalogos/comisiones?incluirInactivos=true
 */
const getComisiones = async (req, res) => {
  try {
    const { q, incluirInactivos } = req.query;

    const filters = {};
    if (incluirInactivos !== 'true') filters.activo = true;

    if (q && typeof q === 'string' && q.trim()) {
      filters.nombre = { $regex: q.trim(), $options: 'i' };
    }

    const comisiones = await LegislativoComision.find(filters)
      .sort({ orden: 1, nombre: 1 })
      .lean();

    const data = comisiones.map((c) => ({
      _id: String(c._id),
      id: String(c._id),
      nombre: c.nombre,
      name: c.nombre,
      value: c.nombre,
      label: c.nombre,
      activo: c.activo,
      orden: c.orden
    }));

    res.json({ success: true, data, total: data.length });
  } catch (error) {
    console.error('❌ [legislativosCatalogos.getComisiones]', error);
    res.status(500).json({ success: false, message: 'Error al obtener las comisiones' });
  }
};

// ============================================
// 🔐 ADMIN - Senadores
// ============================================

const createSenador = async (req, res) => {
  try {
    const { nombre, activo, orden } = req.body;

    const v = validarNombre(nombre);
    if (!v.ok) return res.status(400).json({ success: false, message: v.mensaje });

    const nombreLimpio = nombre.trim();

    const existe = await LegislativoSenador.findOne({ nombre: nombreLimpio });
    if (existe) {
      return res.status(409).json({
        success: false,
        message: `Ya existe un senador con el nombre "${nombreLimpio}"`
      });
    }

    const doc = await LegislativoSenador.create({
      nombre: nombreLimpio,
      activo: parseBool(activo, true),
      orden: parseOrden(orden, 0)
    });

    console.log(`✅ [LegislativoSenador] creado: ${doc.nombre} por ${req.user.email}`);

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error('❌ [createSenador]', error);

    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Ese nombre ya existe' });
    }

    res.status(400).json({ success: false, message: error.message || 'Error al crear el senador' });
  }
};

const updateSenador = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, activo, orden } = req.body;

    const doc = await LegislativoSenador.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Senador no encontrado' });
    }

    if (nombre !== undefined) {
      const v = validarNombre(nombre);
      if (!v.ok) return res.status(400).json({ success: false, message: v.mensaje });

      const nombreLimpio = nombre.trim();

      if (nombreLimpio !== doc.nombre) {
        const existe = await LegislativoSenador.findOne({
          _id: { $ne: doc._id },
          nombre: nombreLimpio
        });
        if (existe) {
          return res.status(409).json({
            success: false,
            message: `Ya existe otro senador con el nombre "${nombreLimpio}"`
          });
        }
        doc.nombre = nombreLimpio;
      }
    }

    if (activo !== undefined) doc.activo = parseBool(activo, true);
    if (orden !== undefined) doc.orden = parseOrden(orden, doc.orden);

    await doc.save();

    console.log(`✏️ [LegislativoSenador] actualizado: ${doc.nombre} por ${req.user.email}`);

    res.json({ success: true, data: doc });
  } catch (error) {
    console.error('❌ [updateSenador]', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Ese nombre ya existe' });
    }
    res.status(400).json({ success: false, message: error.message || 'Error al actualizar el senador' });
  }
};

const deleteSenador = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await LegislativoSenador.findByIdAndDelete(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Senador no encontrado' });
    }

    console.log(`🗑️ [LegislativoSenador] eliminado: ${doc.nombre} por ${req.user.email}`);

    res.json({ success: true, message: 'Senador eliminado' });
  } catch (error) {
    console.error('❌ [deleteSenador]', error);
    res.status(500).json({ success: false, message: 'Error al eliminar el senador' });
  }
};

// ============================================
// 🔐 ADMIN - Comisiones
// ============================================

const createComision = async (req, res) => {
  try {
    const { nombre, activo, orden } = req.body;

    const v = validarNombre(nombre);
    if (!v.ok) return res.status(400).json({ success: false, message: v.mensaje });

    const nombreLimpio = nombre.trim();

    const existe = await LegislativoComision.findOne({ nombre: nombreLimpio });
    if (existe) {
      return res.status(409).json({
        success: false,
        message: `Ya existe una comisión con el nombre "${nombreLimpio}"`
      });
    }

    const doc = await LegislativoComision.create({
      nombre: nombreLimpio,
      activo: parseBool(activo, true),
      orden: parseOrden(orden, 0)
    });

    console.log(`✅ [LegislativoComision] creada: ${doc.nombre} por ${req.user.email}`);

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error('❌ [createComision]', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Ese nombre ya existe' });
    }
    res.status(400).json({ success: false, message: error.message || 'Error al crear la comisión' });
  }
};

const updateComision = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, activo, orden } = req.body;

    const doc = await LegislativoComision.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Comisión no encontrada' });
    }

    if (nombre !== undefined) {
      const v = validarNombre(nombre);
      if (!v.ok) return res.status(400).json({ success: false, message: v.mensaje });

      const nombreLimpio = nombre.trim();

      if (nombreLimpio !== doc.nombre) {
        const existe = await LegislativoComision.findOne({
          _id: { $ne: doc._id },
          nombre: nombreLimpio
        });
        if (existe) {
          return res.status(409).json({
            success: false,
            message: `Ya existe otra comisión con el nombre "${nombreLimpio}"`
          });
        }
        doc.nombre = nombreLimpio;
      }
    }

    if (activo !== undefined) doc.activo = parseBool(activo, true);
    if (orden !== undefined) doc.orden = parseOrden(orden, doc.orden);

    await doc.save();

    console.log(`✏️ [LegislativoComision] actualizada: ${doc.nombre} por ${req.user.email}`);

    res.json({ success: true, data: doc });
  } catch (error) {
    console.error('❌ [updateComision]', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Ese nombre ya existe' });
    }
    res.status(400).json({ success: false, message: error.message || 'Error al actualizar la comisión' });
  }
};

const deleteComision = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await LegislativoComision.findByIdAndDelete(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Comisión no encontrada' });
    }

    console.log(`🗑️ [LegislativoComision] eliminada: ${doc.nombre} por ${req.user.email}`);

    res.json({ success: true, message: 'Comisión eliminada' });
  } catch (error) {
    console.error('❌ [deleteComision]', error);
    res.status(500).json({ success: false, message: 'Error al eliminar la comisión' });
  }
};

// ============================================
// 🌱 SEED INICIAL - Importa datos base
// ============================================

/**
 * POST /api/legislativos/catalogos/seed
 * Body opcional: { sobrescribir: true }
 *
 * Si las colecciones están vacías, importa:
 *   - 36 senadores titulares (SOLO el nombre)
 *   - 10 comisiones base
 *
 * Si ya hay datos y `sobrescribir !== true`, devuelve un aviso.
 */
const seedCatalogos = async (req, res) => {
  try {
    const { sobrescribir } = req.body || {};

    const totalSenadores = await LegislativoSenador.countDocuments();
    const totalComisiones = await LegislativoComision.countDocuments();

    const yaHayDatos = totalSenadores > 0 || totalComisiones > 0;

    if (yaHayDatos && sobrescribir !== true) {
      return res.status(400).json({
        success: false,
        message: `Ya existen datos (${totalSenadores} senadores, ${totalComisiones} comisiones). Envía { "sobrescribir": true } para reemplazarlos.`
      });
    }

    if (sobrescribir === true) {
      await LegislativoSenador.deleteMany({});
      await LegislativoComision.deleteMany({});
      console.log('🗑️ [seedCatalogos] colecciones limpiadas');
    }

    // ============================================
    // 36 senadores titulares (solo nombre)
    // ============================================
    const SENADORES_NOMBRES = [
      'Wilder Véliz Armas',
      'Judith Rosario García Coca',
      'Claudia Mallón Vargas',
      'Wanda Ximena Medrano Hervas',
      'José Manuel Ormachea Mendieta',
      'Carmen Soledad Chapeton Tancara',
      'Nicanor Gonzalo Cochi Condorí',
      'Tomasa Yarhui Jacome',
      'Abdon Porcel Arancibia',
      'Bertha Cartagena Sánchez',
      'Branko Goran Marinković Jovicevic',
      'Kathia Lizbeth Quiroga Fernández',
      'Rosa Tatiana Áñez Carrasco',
      'Paola Limbania López Zeballos',
      'Betty Canaviri Villanueva',
      'Teresa Alarcón Arana',
      'Marcelino Flores Ordoñez',
      'Bertha Nurmy Gutiérrez Meneses',
      'Erick Nelson Soruco Alpire',
      'José Roca Haensel',
      'Ana Karina Velasco Añez',
      'Ernesto Suarez Sattori',
      'Ana María Crispin Choque',
      'Julio Diego Romaña Galindo',
      'Carol Carlo Durán',
      'Cintia Monica Puerta Campos',
      'Eliana Rina Acosta Quispe',
      'Daniel Antonio Ortiz Velásquez',
      'María Isabel Moreno Cortez',
      'César Mentasti Padilla',
      'Leonor Rosalva Romero Gutiérrez',
      'Diego Esteban Mateo Ávila Navajas',
      'Yasmín Estivariz Villarroel',
      'Freddy Castillo Chávez',
      'Maria Antonieta Alcón Sánchez',
      'José Sánchez Aguilar'
    ];

    // ============================================
    // 10 comisiones base
    // ============================================
    const COMISIONES_NOMBRES = [
      'Comisión de Constitución, Derechos Humanos, Legislación y Sistema Electoral',
      'Comisión de Justicia Plural, Ministerio Público y Defensa Legal del Estado',
      'Comisión de Seguridad del Estado, Fuerzas Armadas y Policía Boliviana',
      'Comisión de Organización Territorial del Estado y Autonomías',
      'Comisión de Planificación, Política Económica y Finanzas',
      'Comisión de Economía Plural, Producción, Industria e Industrialización',
      'Comisión de Naciones y Pueblos Indígena Originario Campesinos e Interculturalidad',
      'Comisión de Política Social, Educación y Salud',
      'Comisión de Política Internacional',
      'Comisión de Tierra y Territorio, Recursos Naturales y Medio Ambiente'
    ];

    // ============================================
    // Insertar
    // ============================================
    const senadoresDocs = SENADORES_NOMBRES.map((nombre, idx) => ({
      nombre,
      activo: true,
      orden: (idx + 1) * 10
    }));

    const comisionesDocs = COMISIONES_NOMBRES.map((nombre, idx) => ({
      nombre,
      activo: true,
      orden: (idx + 1) * 10
    }));

    const senadoresInsertados = await LegislativoSenador.insertMany(senadoresDocs, { ordered: false });
    const comisionesInsertadas = await LegislativoComision.insertMany(comisionesDocs, { ordered: false });

    console.log(
      `🌱 [seedCatalogos] ${senadoresInsertados.length} senadores y ${comisionesInsertadas.length} comisiones insertados por ${req.user.email}`
    );

    res.json({
      success: true,
      message: 'Catálogos base importados correctamente',
      data: {
        senadores: senadoresInsertados.length,
        comisiones: comisionesInsertadas.length
      }
    });
  } catch (error) {
    console.error('❌ [seedCatalogos]', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Algunos nombres ya existían. Vuelve a intentarlo con sobrescribir=true.'
      });
    }

    res.status(500).json({ success: false, message: 'Error al importar los catálogos base' });
  }
};

// ============================================
// EXPORTAR
// ============================================
module.exports = {
  getSenadores,
  getComisiones,
  createSenador,
  updateSenador,
  deleteSenador,
  createComision,
  updateComision,
  deleteComision,
  seedCatalogos
};