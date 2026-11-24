// src/controllers/plenoCamaral.controller.js
//
// Módulo "Pleno Camaral": administra los senadores (titulares y suplentes)
// desde el CMS, incluyendo la subida de sus fotos.
//
// ⚠️ Las fotos se sirven desde /senadores/... (express.static de /public/senadores),
//    NO desde /uploads. Es la ruta que ya usan comisiones, directiva y el
//    hemiciclo, así que mantenerla evita romper nada.

const path = require('path');
const fs = require('fs');
const Senador = require('../models/Senador');

// ============================================
// CONFIGURACIÓN DE ALMACENAMIENTO
// ============================================
const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');
const SENADORES_DIR = path.join(PUBLIC_DIR, 'senadores');

// Prefijo público con el que Express sirve public/senadores
const PREFIJO_PUBLICO = '/senadores';

/**
 * Devuelve la carpeta de destino dentro de public/senadores según el tipo
 * y el grupo del senador. Se mantiene la estructura existente:
 *   public/senadores/titulares/g1|g2|g3/
 *   public/senadores/suplentes/g1|g2|g3/
 * Si no se conoce el grupo, se usa "otros".
 */
const carpetaDestino = (tipo, fotoActual) => {
  const base = tipo === 'suplente' ? 'suplentes' : 'titulares';

  // Intentar deducir el grupo (g1/g2/g3) de la ruta actual
  let grupo = 'otros';
  if (typeof fotoActual === 'string') {
    const m = fotoActual.match(/\/(g[123])\//i);
    if (m) grupo = m[1].toLowerCase();
  }

  return path.join(SENADORES_DIR, base, grupo);
};

/** Convierte un nombre en un nombre de archivo seguro (sin tildes ni espacios). */
const slugArchivo = (nombre) =>
  String(nombre || 'senador')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
    .substring(0, 60) || 'SENADOR';

// ============================================
// 📡 LISTADOS
// ============================================

/**
 * GET /api/pleno-camaral
 * Devuelve titulares y suplentes, con sus fotos resueltas.
 *
 * Query:
 *   ?tipo=titular|suplente
 *   ?q=texto
 *   ?sinFoto=true   → solo los que no tienen foto
 *   ?estado=activo
 */
const getSenadores = async (req, res) => {
  try {
    const { tipo, q, sinFoto, estado } = req.query;

    const filtros = {};
    if (tipo === 'titular' || tipo === 'suplente') filtros.tipo = tipo;
    if (estado) filtros.estado = estado;

    if (q && typeof q === 'string' && q.trim()) {
      const rx = new RegExp(q.trim(), 'i');
      filtros.$or = [
        { name: rx },
        { party: rx },
        { partyShort: rx },
        { department: rx },
        { suplente: rx }
      ];
    }

    let senadores = await Senador.find(filtros)
      .sort({ tipo: 1, seatNumber: 1 })
      .lean();

    // Filtro de "sin foto" (se hace en memoria porque la ruta puede ser '')
    if (sinFoto === 'true') {
      senadores = senadores.filter((s) => {
        if (s.tipo === 'suplente') return !s.foto;
        // Un titular "sin foto" también cuenta si falta la del suplente
        return !s.foto || !s.fotoSuplente;
      });
    }

    res.json({
      success: true,
      data: senadores,
      total: senadores.length
    });
  } catch (error) {
    console.error('❌ [plenoCamaral.getSenadores]', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los senadores'
    });
  }
};

/**
 * GET /api/pleno-camaral/:id
 */
const getSenadorById = async (req, res) => {
  try {
    const { id } = req.params;

    // El ID puede ser el numérico (id) o el _id de Mongo
    let senador = null;
    if (/^\d+$/.test(id)) {
      senador = await Senador.findOne({ id: Number(id) }).lean();
    } else {
      senador = await Senador.findById(id).lean();
    }

    if (!senador) {
      return res.status(404).json({
        success: false,
        message: 'Senador no encontrado'
      });
    }

    res.json({ success: true, data: senador });
  } catch (error) {
    console.error('❌ [plenoCamaral.getSenadorById]', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el senador'
    });
  }
};

// ============================================
// 🔐 ACTUALIZACIÓN DE DATOS
// ============================================

/**
 * Campos que se pueden editar desde el CMS.
 * El `id`, `slug` y `seatNumber` NO se tocan (romperían las referencias
 * de comisiones, directiva y el hemiciclo).
 */
const CAMPOS_EDITABLES = [
  'name',
  'party',
  'partyShort',
  'partyColor',
  'department',
  'cargo',
  'comision',
  'comite',
  'estado',
  // Información personal
  'fechaNacimiento',
  'nacidoEn',
  'ocupacion',
  'distritos',
  // Redes
  'facebook',
  'twitter',
  'instagram',
  'youtube',
  'tiktok'
];

/**
 * PUT /api/pleno-camaral/:id
 * Body: cualquiera de los CAMPOS_EDITABLES
 */
const updateSenador = async (req, res) => {
  try {
    const { id } = req.params;
    const cambios = {};

    for (const campo of CAMPOS_EDITABLES) {
      if (req.body[campo] !== undefined) {
        if (campo === 'distritos') {
          cambios[campo] = Array.isArray(req.body[campo])
            ? req.body[campo].map((d) => String(d).trim()).filter(Boolean)
            : [];
        } else {
          cambios[campo] = req.body[campo] === null ? '' : String(req.body[campo]).trim();
        }
      }
    }

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió ningún campo para actualizar'
      });
    }

    const senador = await Senador.findOne({ id: Number(id) });
    if (!senador) {
      return res.status(404).json({
        success: false,
        message: 'Senador no encontrado'
      });
    }

    Object.assign(senador, cambios);
    await senador.save();

    console.log(`✅ [plenoCamaral] Actualizado: ${senador.name}`);

    res.json({
      success: true,
      message: 'Senador actualizado exitosamente',
      data: senador.toObject()
    });
  } catch (error) {
    console.error('❌ [plenoCamaral.updateSenador]', error);
    res.status(500).json({
      success: false,
      message: `Error al actualizar el senador: ${error.message}`
    });
  }
};

// ============================================
// 📤 FOTO
// ============================================

/**
 * POST /api/pleno-camaral/:id/foto
 * multipart: campo `foto`
 * Query/body opcional: `destino=titular|suplente`
 *
 * Para un titular, `destino=suplente` reemplaza fotoSuplente.
 * Para un suplente, siempre escribe `foto`.
 */
const uploadFoto = async (req, res) => {
  const archivoTemporal = req.file ? req.file.path : null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ninguna imagen'
      });
    }

    const { id } = req.params;
    const destino = req.body.destino === 'suplente' ? 'suplente' : 'titular';

    const senador = await Senador.findOne({ id: Number(id) });
    if (!senador) {
      if (archivoTemporal) fs.unlinkSync(archivoTemporal);
      return res.status(404).json({
        success: false,
        message: 'Senador no encontrado'
      });
    }

    // Dónde se guardará: public/senadores/titulares/g1/...
    const fotoActual =
      destino === 'suplente' ? senador.fotoSuplente : senador.foto;
    const carpeta = carpetaDestino(
      destino === 'suplente' ? 'suplente' : senador.tipo,
      fotoActual
    );

    fs.mkdirSync(carpeta, { recursive: true });

    // Nombre definitivo: NOMBRE SENADOR + extensión original
    const nombreBase = destino === 'suplente'
      ? slugArchivo(senador.suplente || `${senador.name} SUPLENTE`)
      : slugArchivo(senador.name);
    const ext = (path.extname(req.file.originalname) || '.png').toLowerCase();
    const nombreArchivo = `${nombreBase}${ext}`;
    const destinoAbsoluto = path.join(carpeta, nombreArchivo);

    // Si ya existe un archivo con ese nombre (misma persona, misma extensión),
    // se sobrescribe de forma explícita en lugar de dejar que rename falle.
    if (fs.existsSync(destinoAbsoluto)) {
      fs.copyFileSync(archivoTemporal, destinoAbsoluto);
      fs.unlinkSync(archivoTemporal);
    } else {
      fs.renameSync(archivoTemporal, destinoAbsoluto);
    }

    // Ruta pública: /senadores/titulares/g1/NOMBRE.png
    const rutaRelativa = `/${path
      .relative(PUBLIC_DIR, destinoAbsoluto)
      .split(path.sep)
      .join('/')}`;

    if (destino === 'suplente') {
      senador.fotoSuplente = rutaRelativa;
    } else {
      senador.foto = rutaRelativa;
    }

    await senador.save();

    console.log(
      `🖼️  [plenoCamaral] Foto actualizada (${destino}): ${rutaRelativa}`
    );

    res.json({
      success: true,
      message: 'Foto actualizada exitosamente',
      data: {
        senadorId: senador.id,
        nombre: senador.name,
        destino,
        foto: destino === 'suplente' ? senador.fotoSuplente : senador.foto,
        url: rutaRelativa
      }
    });
  } catch (error) {
    console.error('❌ [plenoCamaral.uploadFoto]', error);
    if (archivoTemporal && fs.existsSync(archivoTemporal)) {
      try { fs.unlinkSync(archivoTemporal); } catch { /* ignore */ }
    }
    res.status(500).json({
      success: false,
      message: `Error al subir la foto: ${error.message}`
    });
  }
};

/**
 * DELETE /api/pleno-camaral/:id/foto?destino=titular|suplente
 * Vacía el campo (no borra el archivo del disco, para evitar pérdidas).
 */
const eliminarFoto = async (req, res) => {
  try {
    const { id } = req.params;
    const destino = req.query.destino === 'suplente' ? 'suplente' : 'titular';

    const senador = await Senador.findOne({ id: Number(id) });
    if (!senador) {
      return res.status(404).json({
        success: false,
        message: 'Senador no encontrado'
      });
    }

    if (destino === 'suplente') {
      senador.fotoSuplente = '';
    } else {
      senador.foto = '';
    }

    await senador.save();

    res.json({
      success: true,
      message: 'Foto quitada del registro (el archivo sigue en disco)',
      data: senador.toObject()
    });
  } catch (error) {
    console.error('❌ [plenoCamaral.eliminarFoto]', error);
    res.status(500).json({
      success: false,
      message: 'Error al quitar la foto'
    });
  }
};

// ============================================
// 📊 RESUMEN
// ============================================

/**
 * GET /api/pleno-camaral/resumen
 * Contadores para el panel.
 */
const getResumen = async (req, res) => {
  try {
    const [titulares, suplentes] = await Promise.all([
      Senador.countDocuments({ tipo: 'titular' }),
      Senador.countDocuments({ tipo: 'suplente' })
    ]);

    const sinFotoTitular = await Senador.countDocuments({
      tipo: 'titular',
      $or: [{ foto: '' }, { foto: null }, { foto: { $exists: false } }]
    });

    const sinFotoSuplente = await Senador.countDocuments({
      tipo: 'titular',
      $or: [{ fotoSuplente: '' }, { fotoSuplente: null }, { fotoSuplente: { $exists: false } }]
    });

    res.json({
      success: true,
      data: {
        titulares,
        suplentes,
        total: titulares + suplentes,
        sinFotoTitular,
        sinFotoSuplente
      }
    });
  } catch (error) {
    console.error('❌ [plenoCamaral.getResumen]', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen'
    });
  }
};

module.exports = {
  getSenadores,
  getSenadorById,
  updateSenador,
  uploadFoto,
  eliminarFoto,
  getResumen
};
