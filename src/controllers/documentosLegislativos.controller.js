// src/controllers/documentosLegislativos.controller.js
const DocumentoLegislativo = require('../models/DocumentoLegislativo');
const TipoDestinatario = require('../models/TipoDestinatario');
const {
  esTipoValido,
  getConfigTipo,
  TIPOS_DOCUMENTO,
  esTipoOrigenTransicion,
  esTipoDestinoTransicion,
  validarTransicion,
  MARCO_NORMATIVO_CONFIG
} = require('../config/tiposDocumento');

// ============================================
// 🛠️ HELPERS
// ============================================

const parsearFecha = (valor) => {
  if (!valor || valor === '' || valor === 'null' || valor === 'undefined') return null;
  const fecha = new Date(valor);
  return isNaN(fecha.getTime()) ? null : fecha;
};

const CAMPOS_FECHA = [
  'fechaIngreso', 'fechaRemisionDestinatario', 'fechaRespuesta',
  'fechaRemisionPeticionario', 'fechaRealizacion', 'fechaReprogramacion',
  'fechaRealizacionFinal', 'fechaAprobacion', 'fechaRemisionDiputados',
  'fechaSancion', 'fechaRemisionEjecutivo', 'fechaRechazo',
  'fechaRemisionComisionI', 'fechaRemisionComisionII'
];

const CAMPOS_TEXTO = [
  'codigo', 'asunto', 'destinatario', 'tipoDestinatario', 'conminatoria',
  'observacion', 'esNuevoOReReposicion', 'plAnterior', 'estadoLey', 'imagen'
];

const CAMPOS_ARRAY_TEXTO = ['peticionario', 'comisionI', 'comisionII'];

const sanitizarBody = (body) => {
  const limpio = { ...body };

  CAMPOS_FECHA.forEach((campo) => {
    if (campo in limpio) limpio[campo] = parsearFecha(limpio[campo]);
  });

  CAMPOS_TEXTO.forEach((campo) => {
    if (typeof limpio[campo] === 'string') limpio[campo] = limpio[campo].trim();
  });

  CAMPOS_ARRAY_TEXTO.forEach((campo) => {
    if (campo in limpio) {
      if (Array.isArray(limpio[campo])) {
        limpio[campo] = limpio[campo].map(item => typeof item === 'string' ? item.trim() : item).filter(Boolean);
      } else if (typeof limpio[campo] === 'string') {
        limpio[campo] = limpio[campo].trim() ? [limpio[campo].trim()] : [];
      } else if (limpio[campo] === null || limpio[campo] === undefined) {
        limpio[campo] = [];
      }
    }
  });

  if ('numeroLey' in limpio) {
    if (limpio.numeroLey === '' || limpio.numeroLey === null || limpio.numeroLey === undefined) {
      limpio.numeroLey = null;
    } else {
      const n = Number(limpio.numeroLey);
      limpio.numeroLey = isNaN(n) ? null : n;
    }
  }

  if ('archivoAnexo' in limpio) {
    if (!Array.isArray(limpio.archivoAnexo)) {
      limpio.archivoAnexo = [];
    } else {
      limpio.archivoAnexo = limpio.archivoAnexo
        .filter((a) => a && a.url)
        .map((a) => ({
          url: a.url,
          filename: a.filename || '',
          originalName: a.originalName || '',
          size: Number(a.size) || 0
        }));
    }
  }

  return limpio;
};

const extraerCamposDelTipo = (body, tipo, modo = 'create') => {
  const config = getConfigTipo(tipo);
  if (!config) return {};

  const permitidos = [...config.campos];
  if (modo === 'create') permitidos.push('numero');
  
  // 🔥 Aseguramos que 'orden' siempre sea un campo permitido
  if (!permitidos.includes('orden')) permitidos.push('orden');

  const resultado = {};
  permitidos.forEach((campo) => {
    if (body[campo] !== undefined) resultado[campo] = body[campo];
  });
  return resultado;
};

const validarObligatorios = (body, tipo) => {
  const config = getConfigTipo(tipo);
  if (!config) return ['Tipo inválido'];

  const errores = [];
  config.camposObligatorios.forEach((campo) => {
    const valor = body[campo];
    let vacio;

    if (campo === 'archivoAnexo') {
      vacio = !Array.isArray(valor) || valor.length === 0;
    } else if (campo === 'numeroLey') {
      vacio = valor === undefined || valor === null || valor === '';
    } else if (CAMPOS_ARRAY_TEXTO.includes(campo)) {
      vacio = !Array.isArray(valor) || valor.length === 0;
    } else {
      vacio =
        valor === undefined ||
        valor === null ||
        (typeof valor === 'string' && valor.trim() === '') ||
        (typeof valor === 'number' && valor <= 0);
    }

    if (vacio) errores.push(`El campo "${campo}" es obligatorio`);
  });

  return errores;
};

const validarEstadoVsTipo = (tipo, estadoLey) => {
  const config = getConfigTipo(tipo);
  if (!config || !config.estadoRequerido) return { ok: true };

  if (!estadoLey) {
    return {
      ok: false,
      mensaje: `El estadoLey es obligatorio para el tipo "${tipo}". Debe ser "${config.estadoRequerido}".`
    };
  }

  if (estadoLey !== config.estadoRequerido) {
    return {
      ok: false,
      mensaje: `El estadoLey "${estadoLey}" no corresponde al tipo "${tipo}". Debe ser "${config.estadoRequerido}".`
    };
  }

  return { ok: true };
};

const validarNumeroLeyUnico = async (numeroLey, excludeId = null) => {
  if (numeroLey === null || numeroLey === undefined) return { ok: true };

  const query = { numeroLey };
  if (excludeId) query._id = { $ne: excludeId };

  const existe = await DocumentoLegislativo.findOne(query).select('_id').lean();
  if (existe) {
    return {
      ok: false,
      mensaje: `Ya existe un documento con numeroLey ${numeroLey}`
    };
  }
  return { ok: true };
};

const validarTipoDestinatario = async (valor) => {
  if (valor === undefined || valor === null || valor === '') {
    return { ok: true };
  }

  const tipoValido = await TipoDestinatario.findOne({
    nombre: valor,
    activo: true
  }).select('_id').lean();

  if (tipoValido) return { ok: true };

  const disponibles = await TipoDestinatario
    .find({ activo: true })
    .sort({ orden: 1 })
    .select('nombre -_id')
    .lean();

  const opciones = disponibles.map((t) => t.nombre).join(', ');
  return {
    ok: false,
    mensaje: opciones
      ? `Tipo de destinatario inválido: "${valor}". Opciones: ${opciones}`
      : `Tipo de destinatario inválido: "${valor}". No hay tipos configurados en el catálogo.`
  };
};

const normalizarDocumento = (d) => {
  if (d.archivo && d.archivo.url) {
    return d;
  }

  if (Array.isArray(d.archivoAnexo) && d.archivoAnexo.length > 0) {
    return { ...d, archivo: d.archivoAnexo[0] };
  }

  return { ...d, archivo: null };
};

// ============================================
// 🔥 CONSTRUIR FILTROS (CON SOPORTE PARA `peticionario`)
// ============================================
const construirFiltros = (tipo, queryParams) => {
  const { search, gestion, peticionario, creadoDesde, creadoHasta } = queryParams;

  const filters = { tipo, eliminado: false, activo: true };

  if (gestion) {
    const year = parseInt(gestion);
    if (!isNaN(year)) {
      filters.fechaIngreso = {
        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
        $lte: new Date(`${year}-12-31T23:59:59.999Z`)
      };
    }
  }

  // 🔥 Filtro por GESTIÓN LEGISLATIVA (fecha de CARGA del documento).
  // Se usa `createdAt` y no `fechaIngreso` porque las gestiones del sitio
  // público se definen por cuándo se dio de alta el documento en el sistema.
  // `creadoHasta` es EXCLUSIVO.
  if (creadoDesde || creadoHasta) {
    const rango = {};
    if (creadoDesde) {
      const desde = parsearFecha(creadoDesde);
      if (desde) rango.$gte = desde;
    }
    if (creadoHasta) {
      const hasta = parsearFecha(creadoHasta);
      if (hasta) rango.$lt = hasta;
    }
    if (Object.keys(rango).length > 0) {
      filters.createdAt = rango;
    }
  }

  if (search && search.trim()) {
    const termino = search.trim();
    if (termino.includes('"')) {
      filters.$text = { $search: termino };
    } else {
      filters.$or = [
        { codigo: { $regex: termino, $options: 'i' } },
        { asunto: { $regex: termino, $options: 'i' } },
        { peticionario: { $regex: termino, $options: 'i' } },
        { destinatario: { $regex: termino, $options: 'i' } },
        { comisionI: { $regex: termino, $options: 'i' } },
        { comisionII: { $regex: termino, $options: 'i' } }
      ];
    }
  }

  // 🔥 Filtro específico por peticionante
  // Se usa $and para no pisar el $or de `search` si ambos vienen.
  // Como `peticionario` es un array de strings, el $regex directo
  // matchea si ALGÚN elemento del array contiene la subcadena.
  if (peticionario && String(peticionario).trim()) {
    const terminoPet = String(peticionario).trim();
    filters.$and = filters.$and || [];
    filters.$and.push({
      peticionario: { $regex: terminoPet, $options: 'i' }
    });
  }

  return filters;
};

// ============================================
// 📢 PÚBLICO - Listar documentos
// ============================================
const getDocumentosPublicos = async (req, res) => {
  try {
    const { tipo } = req.params;
    if (!esTipoValido(tipo)) {
      return res.status(400).json({ success: false, message: `Tipo inválido: ${tipo}` });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { order } = req.query;

    const sortOrder = order === 'asc' ? 1 : -1;

    const filters = construirFiltros(tipo, req.query);
    const skip = (page - 1) * limit;

    const [docs, total, extremos] = await Promise.all([
      // 🔥 ORDENAR PRIMERO POR `orden`, LUEGO POR FECHA
      DocumentoLegislativo.find(filters)
        .sort({ orden: 1, fechaIngreso: sortOrder, _id: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),

      DocumentoLegislativo.countDocuments(filters),

      DocumentoLegislativo.aggregate([
        { $match: filters },
        {
          $group: {
            _id: null,
            fechaMinima: { $min: '$fechaIngreso' },
            fechaMaxima: { $max: '$fechaIngreso' }
          }
        }
      ])
    ]);

    const fechaMinima = extremos.length > 0 ? extremos[0].fechaMinima : null;
    const fechaMaxima = extremos.length > 0 ? extremos[0].fechaMaxima : null;

    const documentos = docs.map(normalizarDocumento);

    res.json({
      success: true,
      data: {
        documentos,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        fechaMinima,
        fechaMaxima
      }
    });
  } catch (error) {
    console.error('❌ [getDocumentosPublicos]', error);
    res.status(500).json({ success: false, message: 'Error al obtener los documentos' });
  }
};

// ============================================
// 🆕 PÚBLICO - Peticionarios únicos POR TIPO (para datalist)
// GET /api/legislativos/:tipo/peticionarios
// ============================================
const getPeticionariosPorTipo = async (req, res) => {
  try {
    const { tipo } = req.params;

    if (!esTipoValido(tipo)) {
      return res.status(400).json({ success: false, message: `Tipo inválido: ${tipo}` });
    }

    const { q } = req.query;

    const match = {
      tipo,
      eliminado: false,
      activo: true
    };

    if (q && String(q).trim()) {
      match.peticionario = { $regex: String(q).trim(), $options: 'i' };
    }

    // distinct devuelve los valores únicos del campo (incluye elementos de arrays)
    const lista = await DocumentoLegislativo.distinct('peticionario', match);

    const data = lista
      .filter(Boolean)
      .map(String)
      .filter((v) => v.trim().length > 0)
      // limpia prefijo "Sen." si existiera en registros viejos
      .map((v) => v.replace(/^Sen\.?\s*/i, '').trim())
      // dedup por si quedaron duplicados tras limpiar
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .sort((a, b) => a.localeCompare(b, 'es'));

    console.log(`📋 [getPeticionariosPorTipo] ${tipo}: ${data.length} únicos`);

    res.json({ success: true, data, total: data.length });
  } catch (error) {
    console.error('❌ [getPeticionariosPorTipo]', error);
    res.status(500).json({ success: false, message: 'Error al obtener peticionarios' });
  }
};

// ============================================
// 🆕 PÚBLICO - Marco Normativo (destacados + categorías)
// ============================================
const getMarcoNormativo = async (req, res) => {
  try {
    console.log('\n📚 [getMarcoNormativo] Construyendo vista de Marco Normativo...');

    const tiposDestacados = MARCO_NORMATIVO_CONFIG.destacados;
    const categoriasConfig = MARCO_NORMATIVO_CONFIG.categorias;

    // 1. DESTACADOS: 🔥 ORDENADOS POR EL CAMPO `orden` y luego por fecha
    const destacadosRaw = await DocumentoLegislativo.find({
      tipo: { $in: tiposDestacados },
      imagen: { $ne: null, $nin: ['', null] },
      activo: true,
      eliminado: false
    })
      .sort({ orden: 1, fechaIngreso: -1, _id: -1 })
      .limit(6)
      .lean();

    const destacados = destacadosRaw.map((d) => ({
      id: d._id,
      _id: d._id,
      nombre: d.asunto || d.codigo,
      gestion: d.fechaIngreso ? new Date(d.fechaIngreso).getFullYear().toString() : '',
      imagen: d.imagen,
      archivo: d.archivo && d.archivo.url
        ? { url: d.archivo.url, filename: d.archivo.filename, originalName: d.archivo.originalName, size: d.archivo.size }
        : null,
      codigo: d.codigo,
      tipo: d.tipo,
      orden: d.orden
    }));

    console.log(`   ✅ Destacados: ${destacados.length}`);

    // 2. CATEGORÍAS: 🔥 ORDENADAS POR EL CAMPO `orden`
    const categorias = [];

    for (const cat of categoriasConfig) {
      const docsRaw = await DocumentoLegislativo.find({
        tipo: { $in: cat.tipos },
        activo: true,
        eliminado: false
      })
        .sort({ orden: 1, fechaIngreso: -1, _id: -1 })
        .lean();

      if (docsRaw.length === 0) continue;

      const documentos = docsRaw.map((d) => ({
        id: d._id,
        _id: d._id,
        nombre: d.asunto || d.codigo,
        codigo: d.codigo,
        tipo: d.tipo,
        gestion: d.fechaIngreso ? new Date(d.fechaIngreso).getFullYear().toString() : '',
        fechaIngreso: d.fechaIngreso,
        imagen: d.imagen || null,
        orden: d.orden,
        archivo: d.archivo && d.archivo.url
          ? { url: d.archivo.url, filename: d.archivo.filename, originalName: d.archivo.originalName, size: d.archivo.size }
          : null
      }));

      categorias.push({
        nombre: cat.nombre,
        documentos
      });
    }

    console.log(`   ✅ Categorías: ${categorias.length}`);

    res.json({
      success: true,
      data: {
        destacados,
        categorias
      }
    });
  } catch (error) {
    console.error('❌ [getMarcoNormativo]', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el marco normativo'
    });
  }
};

// ============================================
// 🔒 ADMIN - Listar
// ============================================
const getDocumentosAdmin = async (req, res) => {
  try {
    const { tipo } = req.params;
    if (!esTipoValido(tipo)) {
      return res.status(400).json({ success: false, message: `Tipo inválido: ${tipo}` });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { search, gestion, incluirInactivos, incluirEliminados, order } = req.query;

    const sortOrder = order === 'asc' ? 1 : -1;

    const filters = { tipo };
    if (incluirEliminados !== 'true') filters.eliminado = false;
    if (incluirInactivos !== 'true') filters.activo = true;

    if (gestion) {
      const year = parseInt(gestion);
      if (!isNaN(year)) {
        filters.fechaIngreso = {
          $gte: new Date(`${year}-01-01T00:00:00.000Z`),
          $lte: new Date(`${year}-12-31T23:59:59.999Z`)
        };
      }
    }

    if (search && search.trim()) {
      const termino = search.trim();
      if (termino.includes('"')) {
        filters.$text = { $search: termino };
      } else {
        filters.$or = [
          { codigo: { $regex: termino, $options: 'i' } },
          { asunto: { $regex: termino, $options: 'i' } },
          { peticionario: { $regex: termino, $options: 'i' } },
          { destinatario: { $regex: termino, $options: 'i' } },
          { comisionI: { $regex: termino, $options: 'i' } },
          { comisionII: { $regex: termino, $options: 'i' } }
        ];
      }
    }

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      // 🔥 ORDENAR PARA EL CMS TAMBIÉN
      DocumentoLegislativo.find(filters)
        .sort({ orden: 1, fechaIngreso: sortOrder, _id: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('creadoPor', 'email profile')
        .populate('actualizadoPor', 'email profile')
        .populate('eliminadoPor', 'email profile')
        .lean(),
      DocumentoLegislativo.countDocuments(filters)
    ]);

    const documentos = docs.map(normalizarDocumento);

    res.json({
      success: true,
      data: { documentos, total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('❌ [getDocumentosAdmin]', error);
    res.status(500).json({ success: false, message: 'Error al obtener los documentos' });
  }
};

// ============================================
// 🔒 ADMIN - Obtener uno por ID
// ============================================
const getDocumentoById = async (req, res) => {
  try {
    const { tipo, id } = req.params;
    if (!esTipoValido(tipo)) {
      return res.status(400).json({ success: false, message: `Tipo inválido: ${tipo}` });
    }

    const doc = await DocumentoLegislativo.findOne({ _id: id, tipo })
      .populate('creadoPor', 'email profile')
      .populate('actualizadoPor', 'email profile')
      .populate('eliminadoPor', 'email profile');

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    }

    res.json({ success: true, data: doc });
  } catch (error) {
    console.error('❌ [getDocumentoById]', error);
    res.status(500).json({ success: false, message: 'Error al obtener el documento' });
  }
};

// ============================================
// 🔒 ADMIN - Crear
// ============================================
const createDocumento = async (req, res) => {
  try {
    const { tipo } = req.params;
    if (!esTipoValido(tipo)) {
      return res.status(400).json({ success: false, message: `Tipo inválido: ${tipo}` });
    }

    const bodyLimpio = sanitizarBody(req.body);

    const vEstado = validarEstadoVsTipo(tipo, bodyLimpio.estadoLey);
    if (!vEstado.ok) {
      return res.status(400).json({ success: false, message: vEstado.mensaje });
    }

    const errores = validarObligatorios(bodyLimpio, tipo);
    if (errores.length > 0) {
      return res.status(400).json({ success: false, message: errores.join('. '), errores });
    }

    const vDestinatario = await validarTipoDestinatario(bodyLimpio.tipoDestinatario);
    if (!vDestinatario.ok) {
      return res.status(400).json({ success: false, message: vDestinatario.mensaje });
    }

    const vNumeroLey = await validarNumeroLeyUnico(bodyLimpio.numeroLey);
    if (!vNumeroLey.ok) {
      return res.status(409).json({ success: false, message: vNumeroLey.mensaje });
    }

    const datos = extraerCamposDelTipo(bodyLimpio, tipo, 'create');

    const doc = new DocumentoLegislativo({
      ...datos,
      tipo,
      creadoPor: req.user._id,
      actualizadoPor: req.user._id
    });

    await doc.save();

    console.log(`✅ [createDocumento] ${tipo} #${doc.numero} creado por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Documento creado exitosamente',
      data: doc
    });
  } catch (error) {
    console.error('❌ [createDocumento]', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'campo';
      if (field === 'numeroLey') {
        return res.status(409).json({
          success: false,
          message: `Ya existe un documento con numeroLey ${error.keyValue?.numeroLey}.`
        });
      }
      return res.status(409).json({
        success: false,
        message: `Conflicto de datos únicos (${field}).`
      });
    }

    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: mensajes.join('. '), errores: mensajes });
    }

    res.status(500).json({ success: false, message: 'Error al crear el documento' });
  }
};

// ============================================
// 🔒 ADMIN - Actualizar
// ============================================
const updateDocumento = async (req, res) => {
  try {
    const { tipo, id } = req.params;
    if (!esTipoValido(tipo)) {
      return res.status(400).json({ success: false, message: `Tipo inválido: ${tipo}` });
    }

    const doc = await DocumentoLegislativo.findOne({ _id: id, tipo });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    }

    if (doc.eliminado) {
      return res.status(400).json({
        success: false,
        message: 'No se puede editar un documento eliminado. Restáuralo primero.'
      });
    }

    const config = getConfigTipo(tipo);
    const bodyLimpio = sanitizarBody(req.body);

    config.camposBloqueadosEnEdicion.forEach((campo) => delete bodyLimpio[campo]);

    const estadoNuevo = bodyLimpio.estadoLey;
    const hayCambioEstado =
      estadoNuevo !== undefined &&
      estadoNuevo !== null &&
      estadoNuevo !== '' &&
      estadoNuevo !== doc.estadoLey;

    if (hayCambioEstado) {
      if (!esTipoOrigenTransicion(tipo)) {
        return res.status(400).json({
          success: false,
          message: `No se puede cambiar el estado desde el tipo "${tipo}". Solo desde "proyecto-ley-tratamiento-senado" o "proyecto-ley-revision-diputados".`
        });
      }

      const vTransicion = validarTransicion(tipo, estadoNuevo);
      if (!vTransicion.ok) {
        return res.status(400).json({ success: false, message: vTransicion.mensaje });
      }

      const tipoNuevo = vTransicion.tipoNuevo;

      const combinado = {
        ...doc.toObject(),
        ...bodyLimpio,
        tipo: tipoNuevo,
        estadoLey: estadoNuevo
      };

      const errores = validarObligatorios(combinado, tipoNuevo);
      if (errores.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Faltan campos obligatorios: ${errores.join('. ')}`,
          errores
        });
      }

      const vDestinatario = await validarTipoDestinatario(combinado.tipoDestinatario);
      if (!vDestinatario.ok) {
        return res.status(400).json({ success: false, message: vDestinatario.mensaje });
      }

      const vNumeroLey = await validarNumeroLeyUnico(combinado.numeroLey, doc._id);
      if (!vNumeroLey.ok) {
        return res.status(409).json({ success: false, message: vNumeroLey.mensaje });
      }

      const datosNuevos = extraerCamposDelTipo(combinado, tipoNuevo, 'update');

      doc.tipo = tipoNuevo;
      Object.keys(datosNuevos).forEach((campo) => {
        doc[campo] = datosNuevos[campo];
      });
      doc.actualizadoPor = req.user._id;

      await doc.save();

      console.log(
        `🔄 [updateDocumento] #${doc.numero} cambió de "${tipo}" a "${tipoNuevo}" (estado: ${estadoNuevo})`
      );

      return res.json({
        success: true,
        message: `Documento migrado a "${tipoNuevo}" con estado "${estadoNuevo}".`,
        data: doc
      });
    }

    const datos = extraerCamposDelTipo(bodyLimpio, tipo, 'update');

    if (datos.tipoDestinatario !== undefined) {
      const vDestinatario = await validarTipoDestinatario(datos.tipoDestinatario);
      if (!vDestinatario.ok) {
        return res.status(400).json({ success: false, message: vDestinatario.mensaje });
      }
    }

    if (datos.numeroLey !== undefined) {
      const vNumeroLey = await validarNumeroLeyUnico(datos.numeroLey, doc._id);
      if (!vNumeroLey.ok) {
        return res.status(409).json({ success: false, message: vNumeroLey.mensaje });
      }
    }

    Object.keys(datos).forEach((campo) => {
      doc[campo] = datos[campo];
    });

    doc.actualizadoPor = req.user._id;
    await doc.save();

    console.log(`✅ [updateDocumento] ${tipo} #${doc.numero} actualizado por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Documento actualizado exitosamente',
      data: doc
    });
  } catch (error) {
    console.error('❌ [updateDocumento]', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'campo';
      if (field === 'numeroLey') {
        return res.status(409).json({
          success: false,
          message: `Ya existe un documento con numeroLey ${error.keyValue?.numeroLey}.`
        });
      }
      return res.status(409).json({
        success: false,
        message: `Conflicto de datos únicos (${field}).`
      });
    }

    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: mensajes.join('. '), errores: mensajes });
    }

    res.status(500).json({ success: false, message: 'Error al actualizar el documento' });
  }
};

// ============================================
// 🔥 SOFT DELETE
// ============================================
const deleteDocumento = async (req, res) => {
  try {
    const { tipo, id } = req.params;
    const { motivo } = req.body || {};

    if (!esTipoValido(tipo)) {
      return res.status(400).json({ success: false, message: `Tipo inválido: ${tipo}` });
    }

    const doc = await DocumentoLegislativo.findOne({ _id: id, tipo });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    }
    if (doc.eliminado) {
      return res.status(400).json({ success: false, message: 'El documento ya fue eliminado previamente' });
    }

    doc.eliminado = true;
    doc.eliminadoPor = req.user._id;
    doc.fechaEliminacion = new Date();
    doc.motivoEliminacion = (motivo || '').trim().substring(0, 500);
    doc.actualizadoPor = req.user._id;
    await doc.save();

    console.log(`🗑️ [SOFT DELETE] ${tipo} #${doc.numero} eliminado por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Documento eliminado correctamente. Los datos se conservan para auditoría.',
      data: {
        _id: doc._id,
        numero: doc.numero,
        codigo: doc.codigo,
        eliminado: true,
        fechaEliminacion: doc.fechaEliminacion,
        motivoEliminacion: doc.motivoEliminacion
      }
    });
  } catch (error) {
    console.error('❌ [deleteDocumento]', error);
    res.status(500).json({ success: false, message: 'Error al eliminar el documento' });
  }
};

// ============================================
// 🔒 SUPER_ADMIN - Restaurar
// ============================================
const restoreDocumento = async (req, res) => {
  try {
    const { tipo, id } = req.params;
    if (!esTipoValido(tipo)) {
      return res.status(400).json({ success: false, message: `Tipo inválido: ${tipo}` });
    }

    const doc = await DocumentoLegislativo.findOne({ _id: id, tipo, eliminado: true });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Documento eliminado no encontrado' });
    }

    doc.eliminado = false;
    doc.eliminadoPor = null;
    doc.fechaEliminacion = null;
    doc.motivoEliminacion = '';
    doc.actualizadoPor = req.user._id;
    await doc.save();

    console.log(`♻️ [RESTORE] ${tipo} #${doc.numero} restaurado por ${req.user.email}`);

    res.json({ success: true, message: 'Documento restaurado exitosamente', data: doc });
  } catch (error) {
    console.error('❌ [restoreDocumento]', error);
    res.status(500).json({ success: false, message: 'Error al restaurar el documento' });
  }
};

// ============================================
// 📤 Upload PDF
// ============================================
const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se subió ningún PDF' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const pdfUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;

    console.log(`📄 [uploadPDF] ${req.file.originalname} → ${pdfUrl}`);

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
    console.error('❌ [uploadPDF]', error);
    res.status(500).json({ success: false, message: 'Error al subir el PDF' });
  }
};

// ============================================
// 🆕 Upload Imagen de portada
// ============================================
const uploadImagen = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se subió ninguna imagen' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imagenUrl = `${baseUrl}/uploads/images/${req.file.filename}`;

    console.log(`🖼️ [uploadImagen] ${req.file.originalname} → ${imagenUrl}`);

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
    console.error('❌ [uploadImagen]', error);
    res.status(500).json({ success: false, message: 'Error al subir la imagen' });
  }
};

// ============================================
// 📊 Stats
// ============================================
const getStats = async (req, res) => {
  try {
    const { tipo } = req.params;
    if (!esTipoValido(tipo)) {
      return res.status(400).json({ success: false, message: `Tipo inválido: ${tipo}` });
    }

    const baseFilter = { tipo, eliminado: false };

    // 🔥 Soporte de gestión por fecha de carga (createdAt) en los contadores
    const { creadoDesde, creadoHasta } = req.query;
    if (creadoDesde || creadoHasta) {
      const rango = {};
      if (creadoDesde) {
        const desde = parsearFecha(creadoDesde);
        if (desde) rango.$gte = desde;
      }
      if (creadoHasta) {
        const hasta = parsearFecha(creadoHasta);
        if (hasta) rango.$lt = hasta;
      }
      if (Object.keys(rango).length > 0) {
        baseFilter.createdAt = rango;
      }
    }

    const [total, activos, eliminados] = await Promise.all([
      DocumentoLegislativo.countDocuments(baseFilter),
      DocumentoLegislativo.countDocuments({ ...baseFilter, activo: true }),
      DocumentoLegislativo.countDocuments({ tipo, eliminado: true })
    ]);

    res.json({ success: true, data: { total, activos, eliminados } });
  } catch (error) {
    console.error('❌ [getStats]', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
};

// ============================================
// 📋 Config del tipo
// ============================================
const getConfigDelTipo = async (req, res) => {
  try {
    const { tipo } = req.params;
    if (!esTipoValido(tipo)) {
      return res.status(400).json({ success: false, message: `Tipo inválido: ${tipo}` });
    }

    const config = getConfigTipo(tipo);

    const tiposDestinatarioDB = await TipoDestinatario
      .find({ activo: true })
      .sort({ orden: 1 })
      .select('nombre -_id')
      .lean();

    res.json({
      success: true,
      data: {
        tipo,
        ...config,
        tiposDestinatario: tiposDestinatarioDB.map((t) => t.nombre)
      }
    });
  } catch (error) {
    console.error('❌ [getConfigDelTipo]', error);
    res.status(500).json({ success: false, message: 'Error al obtener la configuración' });
  }
};

// ============================================
// 📋 Listar tipos disponibles
// ============================================
const getTiposDisponibles = async (req, res) => {
  try {
    const tipos = Object.entries(TIPOS_DOCUMENTO).map(([key, value]) => ({
      tipo: key,
      label: value.label,
      bloque: value.bloque,
      prefijoCodigo: value.prefijoCodigo,
      estadoRequerido: value.estadoRequerido || null
    }));

    res.json({ success: true, data: tipos });
  } catch (error) {
    console.error('❌ [getTiposDisponibles]', error);
    res.status(500).json({ success: false, message: 'Error al obtener los tipos' });
  }
};

// ============================================
// EXPORTAR
// ============================================
module.exports = {
  getDocumentosPublicos,
  getPeticionariosPorTipo,    // 🔥 GENERALIZADO (antes getPeticionariosPIE)
  getMarcoNormativo,
  getDocumentosAdmin,
  getDocumentoById,
  createDocumento,
  updateDocumento,
  deleteDocumento,
  restoreDocumento,
  uploadPDF,
  uploadImagen,
  getStats,
  getConfigDelTipo,
  getTiposDisponibles
};