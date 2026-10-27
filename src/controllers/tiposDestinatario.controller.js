// src/controllers/tiposDestinatario.controller.js
const TipoDestinatario = require('../models/TipoDestinatario');

// ============================================
// HELPERS
// ============================================
const validarNombre = (nombre) => {
  if (typeof nombre !== 'string' || !nombre.trim()) {
    return { ok: false, mensaje: 'El nombre es requerido' };
  }
  if (nombre.trim().length > 150) {
    return { ok: false, mensaje: 'El nombre no puede exceder 150 caracteres' };
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
 * GET /api/tipos-destinatario
 * GET /api/tipos-destinatario?q=ejecutivo
 * GET /api/tipos-destinatario?incluirInactivos=true
 */
const getTiposDestinatario = async (req, res) => {
  try {
    const { q, incluirInactivos } = req.query;

    const filters = {};
    if (incluirInactivos !== 'true') filters.activo = true;

    if (q && typeof q === 'string' && q.trim()) {
      filters.nombre = { $regex: q.trim(), $options: 'i' };
    }

    const tipos = await TipoDestinatario.find(filters)
      .sort({ orden: 1, nombre: 1 })
      .lean();

    const data = tipos.map((t) => ({
      _id: String(t._id),
      id: String(t._id),
      nombre: t.nombre,
      name: t.nombre,
      value: t.nombre,
      label: t.nombre,
      activo: t.activo,
      orden: t.orden
    }));

    res.json({ success: true, data, total: data.length });
  } catch (error) {
    console.error('❌ [tiposDestinatario.getTiposDestinatario]', error);
    res.status(500).json({ success: false, message: 'Error al obtener los tipos de destinatario' });
  }
};

// ============================================
// 🔐 ADMIN - CRUD
// ============================================

const createTipoDestinatario = async (req, res) => {
  try {
    const { nombre, activo, orden } = req.body;

    const v = validarNombre(nombre);
    if (!v.ok) return res.status(400).json({ success: false, message: v.mensaje });

    const nombreLimpio = nombre.trim();

    const existe = await TipoDestinatario.findOne({ nombre: nombreLimpio });
    if (existe) {
      return res.status(409).json({
        success: false,
        message: `Ya existe un tipo de destinatario con el nombre "${nombreLimpio}"`
      });
    }

    const doc = await TipoDestinatario.create({
      nombre: nombreLimpio,
      activo: parseBool(activo, true),
      orden: parseOrden(orden, 0)
    });

    console.log(`✅ [TipoDestinatario] creado: ${doc.nombre} por ${req.user.email}`);

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error('❌ [createTipoDestinatario]', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Ese nombre ya existe' });
    }
    res.status(400).json({ success: false, message: error.message || 'Error al crear el tipo de destinatario' });
  }
};

const updateTipoDestinatario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, activo, orden } = req.body;

    const doc = await TipoDestinatario.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Tipo de destinatario no encontrado' });
    }

    if (nombre !== undefined) {
      const v = validarNombre(nombre);
      if (!v.ok) return res.status(400).json({ success: false, message: v.mensaje });

      const nombreLimpio = nombre.trim();

      if (nombreLimpio !== doc.nombre) {
        const existe = await TipoDestinatario.findOne({
          _id: { $ne: doc._id },
          nombre: nombreLimpio
        });
        if (existe) {
          return res.status(409).json({
            success: false,
            message: `Ya existe otro tipo de destinatario con el nombre "${nombreLimpio}"`
          });
        }
        doc.nombre = nombreLimpio;
      }
    }

    if (activo !== undefined) doc.activo = parseBool(activo, true);
    if (orden !== undefined) doc.orden = parseOrden(orden, doc.orden);

    await doc.save();

    console.log(`✏️ [TipoDestinatario] actualizado: ${doc.nombre} por ${req.user.email}`);

    res.json({ success: true, data: doc });
  } catch (error) {
    console.error('❌ [updateTipoDestinatario]', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Ese nombre ya existe' });
    }
    res.status(400).json({ success: false, message: error.message || 'Error al actualizar el tipo de destinatario' });
  }
};

const deleteTipoDestinatario = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await TipoDestinatario.findByIdAndDelete(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Tipo de destinatario no encontrado' });
    }

    console.log(`🗑️ [TipoDestinatario] eliminado: ${doc.nombre} por ${req.user.email}`);

    res.json({ success: true, message: 'Tipo de destinatario eliminado' });
  } catch (error) {
    console.error('❌ [deleteTipoDestinatario]', error);
    res.status(500).json({ success: false, message: 'Error al eliminar el tipo de destinatario' });
  }
};

// ============================================
// 🌱 SEED INICIAL
// ============================================

/**
 * POST /api/tipos-destinatario/seed
 * Body opcional: { sobrescribir: true }
 */
const seedTiposDestinatario = async (req, res) => {
  try {
    const { sobrescribir } = req.body || {};

    const total = await TipoDestinatario.countDocuments();
    const yaHayDatos = total > 0;

    if (yaHayDatos && sobrescribir !== true) {
      return res.status(400).json({
        success: false,
        message: `Ya existen ${total} tipos de destinatario. Envía { "sobrescribir": true } para reemplazarlos.`
      });
    }

    if (sobrescribir === true) {
      await TipoDestinatario.deleteMany({});
      console.log('🗑️ [seedTiposDestinatario] colección limpiada');
    }

    const NOMBRES = [
      'Órgano Ejecutivo',
      'Órgano Judicial',
      'Órgano Electoral',
      'Gobernación',
      'Alcaldía',
      'Universidad',
      'Otra Entidad'
    ];

    const docs = NOMBRES.map((nombre, idx) => ({
      nombre,
      activo: true,
      orden: (idx + 1) * 10
    }));

    const insertados = await TipoDestinatario.insertMany(docs, { ordered: false });

    console.log(
      `🌱 [seedTiposDestinatario] ${insertados.length} tipos insertados por ${req.user.email}`
    );

    res.json({
      success: true,
      message: 'Catálogo base de tipos de destinatario importado correctamente',
      data: { tiposDestinatario: insertados.length }
    });
  } catch (error) {
    console.error('❌ [seedTiposDestinatario]', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Algunos nombres ya existían. Vuelve a intentarlo con sobrescribir=true.'
      });
    }

    res.status(500).json({ success: false, message: 'Error al importar el catálogo base' });
  }
};

// ============================================
// EXPORTAR
// ============================================
module.exports = {
  getTiposDestinatario,
  createTipoDestinatario,
  updateTipoDestinatario,
  deleteTipoDestinatario,
  seedTiposDestinatario
};