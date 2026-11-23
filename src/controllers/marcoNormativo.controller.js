// src/controllers/marcoNormativo.controller.js
const path = require('path');
const fs = require('fs');
const MarcoNormativo = require('../models/MarcoNormativo');

// ============================================
// HELPERS
// ============================================
const normalizarArchivo = (a) => {
  if (!a || typeof a !== 'object') return null;
  if (!a.url) return null;
  return {
    url: a.url,
    filename: a.filename || '',
    originalName: a.originalName || '',
    size: Number(a.size) || 0
  };
};

const parseBool = (v, def = false) => {
  if (v === undefined || v === null || v === '') return def;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const s = v.toLowerCase();
    if (s === 'true' || s === '1' || s === 'si' || s === 'sí') return true;
    if (s === 'false' || s === '0' || s === 'no') return false;
  }
  return def;
};

const parseNumero = (v, def = null) => {
  if (v === undefined || v === null || v === '') return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

const parseFecha = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const construirBaseUrl = (req) => {
  const host = req.get('host');
  const proto = req.protocol || 'https';
  return host ? `${proto}://${host}` : '';
};

/**
 * Asegura que la URL del archivo sea absoluta usando el host de la petición.
 * Si ya es absoluta (http/https) se deja tal cual.
 */
const urlAbsoluta = (url, baseUrl) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (!baseUrl) return url;
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const toPublico = (doc, baseUrl) => {
  const archivo = normalizarArchivo(doc.archivo);
  return {
    _id: String(doc._id),
    id: String(doc._id),
    nombre: doc.nombre,
    codigo: doc.codigo || '',
    descripcion: doc.descripcion || '',
    gestion: doc.gestion ?? null,
    fechaDocumento: doc.fechaDocumento || null,
    categoria: doc.categoria || null,
    destacado: Boolean(doc.destacado),
    orden: doc.orden ?? 0,
    imagen: urlAbsoluta(doc.imagen, baseUrl),
    archivo: archivo ? { ...archivo, url: urlAbsoluta(archivo.url, baseUrl) } : null
  };
};

const toAdmin = (doc, baseUrl) => ({
  ...toPublico(doc, baseUrl),
  activo: Boolean(doc.activo),
  eliminado: Boolean(doc.eliminado),
  fechaEliminacion: doc.fechaEliminacion || null,
  motivoEliminacion: doc.motivoEliminacion || '',
  creadoPor: doc.creadoPor || null,
  actualizadoPor: doc.actualizadoPor || null,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

// ============================================
// 📡 PUBLICO - Vista del módulo (destacados + acordeón)
// ============================================

/**
 * GET /api/marco-normativo
 *
 * Devuelve la estructura que consume el visor público:
 *   { success: true, data: { destacados: [...], categorias: [{ nombre, documentos }] } }
 *
 * - `destacados`: tarjetas superiores (destacado = true y con imagen), máx. 6.
 * - `categorias`: acordeón agrupado por el campo `categoria`.
 */
const getMarcoNormativoPublico = async (req, res) => {
  try {
    const baseUrl = construirBaseUrl(req);

    // 1. DESTACADOS (con imagen, hasta 6)
    const destacadosRaw = await MarcoNormativo.find({
      activo: true,
      eliminado: false,
      destacado: true,
      imagen: { $nin: ['', null] }
    })
      .sort({ orden: 1, gestion: -1, createdAt: -1 })
      .limit(6)
      .lean();

    const destacados = destacadosRaw.map((d) => toPublico(d, baseUrl));

    // 2. ACORDEÓN agrupado por categoría
    const docsRaw = await MarcoNormativo.find({
      activo: true,
      eliminado: false,
      categoria: { $nin: ['', null] }
    })
      .sort({ orden: 1, nombre: 1 })
      .lean();

    const porCategoria = new Map();
    for (const d of docsRaw) {
      const nombre = (d.categoria || '').trim();
      if (!nombre) continue;
      if (!porCategoria.has(nombre)) porCategoria.set(nombre, []);
      porCategoria.get(nombre).push(toPublico(d, baseUrl));
    }

    const categorias = [];
    for (const [nombre, documentos] of porCategoria) {
      if (documentos.length === 0) continue;
      categorias.push({ nombre, documentos });
    }

    console.log(
      `📚 [getMarcoNormativoPublico] destacados: ${destacados.length} | categorias: ${categorias.length}`
    );

    res.json({
      success: true,
      data: { destacados, categorias }
    });
  } catch (error) {
    console.error('❌ [getMarcoNormativoPublico]', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el marco normativo'
    });
  }
};

// ============================================
// 🔐 ADMIN - Listado
// ============================================

/**
 * GET /api/marco-normativo/admin
 * Query: page, limit, q, categoria, incluirInactivos, incluirEliminados
 */
const getMarcoNormativoAdmin = async (req, res) => {
  try {
    const baseUrl = construirBaseUrl(req);

    const page = Math.max(1, parseNumero(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, parseNumero(req.query.limit, 20)));
    const skip = (page - 1) * limit;

    const filters = {};
    const incluirEliminados = req.query.incluirEliminados === 'true';
    const incluirInactivos = req.query.incluirInactivos === 'true';

    // Por defecto: solo vigentes y activos.
    if (!incluirEliminados) filters.eliminado = false;
    if (!incluirInactivos && !incluirEliminados) filters.activo = true;

    if (req.query.categoria && typeof req.query.categoria === 'string' && req.query.categoria.trim()) {
      filters.categoria = req.query.categoria.trim();
    }

    if (req.query.destacado === 'true' || req.query.destacado === 'false') {
      filters.destacado = parseBool(req.query.destacado);
    }

    if (req.query.q && typeof req.query.q === 'string' && req.query.q.trim()) {
      const rx = new RegExp(req.query.q.trim(), 'i');
      filters.$or = [{ nombre: rx }, { codigo: rx }, { descripcion: rx }];
    }

    const [total, docs] = await Promise.all([
      MarcoNormativo.countDocuments(filters),
      MarcoNormativo.find(filters)
        .sort({ orden: 1, nombre: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    res.json({
      success: true,
      data: docs.map((d) => toAdmin(d, baseUrl)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    console.error('❌ [getMarcoNormativoAdmin]', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el marco normativo'
    });
  }
};

// ============================================
// 🔐 ADMIN - Obtener uno
// ============================================

/**
 * GET /api/marco-normativo/:id
 */
const getMarcoNormativoById = async (req, res) => {
  try {
    const baseUrl = construirBaseUrl(req);
    const doc = await MarcoNormativo.findById(req.params.id).lean();

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    res.json({ success: true, data: toAdmin(doc, baseUrl) });
  } catch (error) {
    console.error('❌ [getMarcoNormativoById]', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el documento'
    });
  }
};

// ============================================
// 🔐 ADMIN - Catálogo de categorías (para selects)
// ============================================

/**
 * GET /api/marco-normativo/categorias
 * Devuelve las categorías existentes para poblar selects del CMS.
 */
const getCategorias = async (req, res) => {
  try {
    const valores = await MarcoNormativo.distinct('categoria', {
      eliminado: false,
      categoria: { $nin: ['', null] }
    });

    const data = (valores || [])
      .map((c) => String(c).trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ [getCategorias marcoNormativo]', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las categorías'
    });
  }
};

// ============================================
// 🔐 ADMIN - Crear
// ============================================

const construirPayload = (body, req, esCreacion) => {
  const payload = {};

  if (esCreacion || body.nombre !== undefined) {
    payload.nombre = String(body.nombre || '').trim();
  }
  if (body.codigo !== undefined) payload.codigo = String(body.codigo || '').trim();
  if (body.descripcion !== undefined) payload.descripcion = String(body.descripcion || '').trim();
  if (body.gestion !== undefined) payload.gestion = parseNumero(body.gestion, null);
  if (body.fechaDocumento !== undefined) payload.fechaDocumento = parseFecha(body.fechaDocumento);
  if (body.categoria !== undefined) {
    const c = String(body.categoria || '').trim();
    payload.categoria = c || null;
  }
  if (body.destacado !== undefined) payload.destacado = parseBool(body.destacado);
  if (body.orden !== undefined) payload.orden = parseNumero(body.orden, 0);
  if (body.imagen !== undefined) {
    const img = body.imagen ? String(body.imagen).trim() : '';
    payload.imagen = img || null;
  }
  if (body.archivo !== undefined) {
    const archivo = normalizarArchivo(body.archivo);
    payload.archivo = archivo || { url: null, filename: '', originalName: '', size: 0 };
  }
  if (body.activo !== undefined) payload.activo = parseBool(body.activo, true);

  return payload;
};

/**
 * POST /api/marco-normativo
 */
const createMarcoNormativo = async (req, res) => {
  try {
    const baseUrl = construirBaseUrl(req);
    const payload = construirPayload(req.body || {}, req, true);

    if (!payload.nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    // Un destacado sin imagen no se mostraría; se avisa en vez de fallar.
    if (payload.destacado && !payload.imagen) {
      return res.status(400).json({
        success: false,
        message: 'Los documentos destacados requieren una imagen de portada'
      });
    }

    const doc = await MarcoNormativo.create({
      ...payload,
      creadoPor: req.user ? req.user._id : null,
      actualizadoPor: req.user ? req.user._id : null
    });

    console.log(`✅ [MarcoNormativo] Creado: ${doc.nombre}`);

    res.status(201).json({
      success: true,
      message: 'Documento creado exitosamente',
      data: toAdmin(doc.toObject(), baseUrl)
    });
  } catch (error) {
    console.error('❌ [createMarcoNormativo]', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al crear el documento'
    });
  }
};

// ============================================
// 🔐 ADMIN - Actualizar
// ============================================

/**
 * PUT /api/marco-normativo/:id
 */
const updateMarcoNormativo = async (req, res) => {
  try {
    const baseUrl = construirBaseUrl(req);
    const payload = construirPayload(req.body || {}, req, false);

    if (payload.nombre !== undefined && !payload.nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    const actual = await MarcoNormativo.findById(req.params.id);
    if (!actual) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    const destacadoFinal =
      payload.destacado !== undefined ? payload.destacado : actual.destacado;
    const imagenFinal = payload.imagen !== undefined ? payload.imagen : actual.imagen;

    if (destacadoFinal && !imagenFinal) {
      return res.status(400).json({
        success: false,
        message: 'Los documentos destacados requieren una imagen de portada'
      });
    }

    Object.assign(actual, payload);
    actual.actualizadoPor = req.user ? req.user._id : null;
    await actual.save();

    console.log(`✅ [MarcoNormativo] Actualizado: ${actual.nombre}`);

    res.json({
      success: true,
      message: 'Documento actualizado exitosamente',
      data: toAdmin(actual.toObject(), baseUrl)
    });
  } catch (error) {
    console.error('❌ [updateMarcoNormativo]', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el documento'
    });
  }
};

// ============================================
// 🔐 ADMIN - Eliminar (soft delete)
// ============================================

/**
 * DELETE /api/marco-normativo/:id
 * Body opcional: { motivo }
 */
const deleteMarcoNormativo = async (req, res) => {
  try {
    const motivo = String((req.body && req.body.motivo) || '').trim();

    const doc = await MarcoNormativo.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    doc.eliminado = true;
    doc.activo = false;
    doc.fechaEliminacion = new Date();
    doc.motivoEliminacion = motivo;
    doc.eliminadoPor = req.user ? req.user._id : null;
    doc.actualizadoPor = req.user ? req.user._id : null;
    await doc.save();

    console.log(`🗑️ [MarcoNormativo] Eliminado: ${doc.nombre}`);

    res.json({
      success: true,
      message: 'Documento eliminado exitosamente'
    });
  } catch (error) {
    console.error('❌ [deleteMarcoNormativo]', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el documento'
    });
  }
};

// ============================================
// 🔐 ADMIN - Restaurar
// ============================================

/**
 * PATCH /api/marco-normativo/:id/restore
 */
const restoreMarcoNormativo = async (req, res) => {
  try {
    const baseUrl = construirBaseUrl(req);
    const doc = await MarcoNormativo.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    doc.eliminado = false;
    doc.activo = true;
    doc.fechaEliminacion = null;
    doc.motivoEliminacion = '';
    doc.eliminadoPor = null;
    doc.actualizadoPor = req.user ? req.user._id : null;
    await doc.save();

    console.log(`♻️ [MarcoNormativo] Restaurado: ${doc.nombre}`);

    res.json({
      success: true,
      message: 'Documento restaurado exitosamente',
      data: toAdmin(doc.toObject(), baseUrl)
    });
  } catch (error) {
    console.error('❌ [restoreMarcoNormativo]', error);
    res.status(500).json({
      success: false,
      message: 'Error al restaurar el documento'
    });
  }
};

// ============================================
// 🔐 ADMIN - Upload PDF
// ============================================

/**
 * POST /api/marco-normativo/upload-pdf
 * Campo multipart: `pdf`
 */
const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ningún PDF'
      });
    }

    const baseUrl = construirBaseUrl(req);
    const pdfUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;

    console.log(`📄 [MarcoNormativo.uploadPDF] ${req.file.originalname} → ${pdfUrl}`);

    res.json({
      success: true,
      message: 'PDF subido exitosamente',
      data: {
        url: pdfUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        sizeMB: (req.file.size / 1024 / 1024).toFixed(2)
      }
    });
  } catch (error) {
    console.error('❌ [MarcoNormativo.uploadPDF]', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir el PDF'
    });
  }
};

// ============================================
// 🔐 ADMIN - Upload imagen de portada
// ============================================

/**
 * POST /api/marco-normativo/upload-imagen
 * Campo multipart: `imagen`
 */
const uploadImagen = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ninguna imagen'
      });
    }

    const baseUrl = construirBaseUrl(req);
    const imagenUrl = `${baseUrl}/uploads/images/${req.file.filename}`;

    console.log(`🖼️ [MarcoNormativo.uploadImagen] ${req.file.originalname} → ${imagenUrl}`);

    res.json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: {
        url: imagenUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('❌ [MarcoNormativo.uploadImagen]', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir la imagen'
    });
  }
};

module.exports = {
  // Público
  getMarcoNormativoPublico,
  // Admin
  getMarcoNormativoAdmin,
  getMarcoNormativoById,
  getCategorias,
  createMarcoNormativo,
  updateMarcoNormativo,
  deleteMarcoNormativo,
  restoreMarcoNormativo,
  uploadPDF,
  uploadImagen
};
