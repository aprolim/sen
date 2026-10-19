// src/controllers/documentosLegislativos.controller.js
const DocumentoLegislativo = require('../models/DocumentoLegislativo');
const {
  esTipoValido,
  getConfigTipo,
  TIPOS_DESTINATARIO,
  TIPOS_DOCUMENTO,
  esTipoOrigenTransicion,
  esTipoDestinoTransicion,
  validarTransicion,
  getTipoPorEstado
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
  'fechaIngreso',
  'fechaRemisionDestinatario',
  'fechaRespuesta',
  'fechaRemisionPeticionario',
  'fechaRealizacion',
  'fechaReprogramacion',
  'fechaRealizacionFinal',
  'fechaAprobacion',
  'fechaRemisionDiputados',
  'fechaSancion',
  'fechaRemisionEjecutivo',
  'fechaRechazo',
  'fechaRemisionComisionI',
  'fechaRemisionComisionII'
];

const CAMPOS_TEXTO = [
  'codigo',
  'peticionario',
  'asunto',
  'destinatario',
  'tipoDestinatario',
  'conminatoria',
  'observacion',
  'esNuevoOReReposicion',
  'plAnterior',
  'comisionI',
  'comisionII',
  'estadoLey'
];

const sanitizarBody = (body) => {
  const limpio = { ...body };

  CAMPOS_FECHA.forEach((campo) => {
    if (campo in limpio) limpio[campo] = parsearFecha(limpio[campo]);
  });

  CAMPOS_TEXTO.forEach((campo) => {
    if (typeof limpio[campo] === 'string') limpio[campo] = limpio[campo].trim();
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

// ============================================
// 📡 PÚBLICO - Listar documentos
// GET /api/legislativos/:tipo
// ============================================
const getDocumentosPublicos = async (req, res) => {
  try {
    const { tipo } = req.params;
    if (!esTipoValido(tipo)) {
      return res.status(400).json({ success: false, message: `Tipo inválido: ${tipo}` });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { search, gestion } = req.query;

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

    if (search && search.trim()) {
      const termino = search.trim();
      filters.$or = [
        { codigo: { $regex: termino, $options: 'i' } },
        { asunto: { $regex: termino, $options: 'i' } },
        { peticionario: { $regex: termino, $options: 'i' } },
        { destinatario: { $regex: termino, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [documentos, total] = await Promise.all([
      DocumentoLegislativo.find(filters).sort({ numero: 1 }).skip(skip).limit(limit).lean(),
      DocumentoLegislativo.countDocuments(filters)
    ]);

    res.json({
      success: true,
      data: { documentos, total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('❌ [getDocumentosPublicos]', error);
    res.status(500).json({ success: false, message: 'Error al obtener los documentos' });
  }
};

// ============================================
// 🔐 ADMIN - Listar
// GET /api/legislativos/:tipo/admin
// ============================================
const getDocumentosAdmin = async (req, res) => {
  try {
    const { tipo } = req.params;
    if (!esTipoValido(tipo)) {
      return res.status(400).json({ success: false, message: `Tipo inválido: ${tipo}` });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { search, gestion, incluirInactivos, incluirEliminados } = req.query;

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
      filters.$or = [
        { codigo: { $regex: termino, $options: 'i' } },
        { asunto: { $regex: termino, $options: 'i' } },
        { peticionario: { $regex: termino, $options: 'i' } },
        { destinatario: { $regex: termino, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [documentos, total] = await Promise.all([
      DocumentoLegislativo.find(filters)
        .sort({ numero: 1 })
        .skip(skip)
        .limit(limit)
        .populate('creadoPor', 'email profile')
        .populate('actualizadoPor', 'email profile')
        .populate('eliminadoPor', 'email profile')
        .lean(),
      DocumentoLegislativo.countDocuments(filters)
    ]);

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
// 🔐 ADMIN - Obtener uno por ID
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
// 🔐 ADMIN - Crear
// POST /api/legislativos/:tipo
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

    if (bodyLimpio.tipoDestinatario && !TIPOS_DESTINATARIO.includes(bodyLimpio.tipoDestinatario)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de destinatario inválido. Opciones: ${TIPOS_DESTINATARIO.join(', ')}`
      });
    }

    const yaExiste = await DocumentoLegislativo.findOne({ tipo, numero: bodyLimpio.numero });
    if (yaExiste) {
      return res.status(409).json({
        success: false,
        message: `Ya existe un documento con el número ${bodyLimpio.numero} en este tipo.`
      });
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
      return res.status(409).json({
        success: false,
        message: `Ya existe un registro con ese valor único (${field}).`
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
// 🔐 ADMIN - Actualizar
// PUT /api/legislativos/:tipo/:id
//
// 🔥 AQUÍ SE MANEJA EL CAMBIO DE ESTADO (y por ende, de tipo)
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

    // 🔒 Campos bloqueados (numero, codigo)
    config.camposBloqueadosEnEdicion.forEach((campo) => delete bodyLimpio[campo]);

    // ============================================
    // 🔥 DETECTAR SI HAY CAMBIO DE ESTADO
    // ============================================
    const estadoNuevo = bodyLimpio.estadoLey;
    const hayCambioEstado =
      estadoNuevo !== undefined &&
      estadoNuevo !== null &&
      estadoNuevo !== '' &&
      estadoNuevo !== doc.estadoLey;

    if (hayCambioEstado) {
      // Solo se permite desde los tipos origen
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

      // Combinar datos: los actuales + los nuevos que vienen
      const combinado = {
        ...doc.toObject(),
        ...bodyLimpio,
        tipo: tipoNuevo,
        estadoLey: estadoNuevo
      };

      // 1. Validar obligatorios del tipoNuevo (Solo el anexo es ESTRICTAMENTE obligatorio aquí)
      const errores = validarObligatorios(combinado, tipoNuevo);
      
      const erroresFiltrados = errores.filter(err => {
        // Si el error es por archivoAnexo, siempre es un error bloqueante
        if (err.includes('archivoAnexo')) return true;
        // Los demás campos (fechas, numeroLey) se ignoran en este paso
        return false;
      });

      if (erroresFiltrados.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Faltan campos obligatorios: ${erroresFiltrados.join('. ')}`,
          errores: erroresFiltrados
        });
      }

      // 2. archivoAnexo obligatorio para tipos destino
      if (esTipoDestinoTransicion(tipoNuevo)) {
        const anexos = combinado.archivoAnexo;
        if (!Array.isArray(anexos) || anexos.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Debe adjuntar al menos un archivo anexo (informe de comisión) para cambiar al estado "${estadoNuevo}".`
          });
        }
      }

      // 3. numeroLey único (excepto el propio)
      const vNumeroLey = await validarNumeroLeyUnico(combinado.numeroLey, doc._id);
      if (!vNumeroLey.ok) {
        return res.status(409).json({ success: false, message: vNumeroLey.mensaje });
      }

      // 4. Duplicado de número en el nuevo tipo
      const yaExiste = await DocumentoLegislativo.findOne({
        _id: { $ne: doc._id },
        tipo: tipoNuevo,
        numero: combinado.numero
      });
      if (yaExiste) {
        return res.status(409).json({
          success: false,
          message: `Ya existe un documento con el número ${combinado.numero} en "${tipoNuevo}".`
        });
      }

      // 5. Extraer campos válidos del tipoNuevo
      const datosNuevos = extraerCamposDelTipo(combinado, tipoNuevo, 'update');

      // 6. Aplicar TODO al doc
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

    // ============================================
    // 🔧 EDICIÓN NORMAL (sin cambio de estado)
    // ============================================
    const datos = extraerCamposDelTipo(bodyLimpio, tipo, 'update');

    // Validar tipoDestinatario si viene
    if (datos.tipoDestinatario && !TIPOS_DESTINATARIO.includes(datos.tipoDestinatario)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de destinatario inválido. Opciones: ${TIPOS_DESTINATARIO.join(', ')}`
      });
    }

    // Si es un tipo destino y se está editando, validar archivoAnexo obligatorio
    if (esTipoDestinoTransicion(tipo)) {
      const anexos = datos.archivoAnexo !== undefined ? datos.archivoAnexo : doc.archivoAnexo;
      if (!Array.isArray(anexos) || anexos.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El archivo anexo (informe de comisión) es obligatorio para este tipo de documento.'
        });
      }
    }

    // Validar numeroLey si viene (y único)
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
      return res.status(409).json({
        success: false,
        message: `Ya existe un registro con ese valor único (${field}).`
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
// 🔐 SUPER_ADMIN - Restaurar
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
// POST /api/legislativos/:tipo/upload-pdf
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
// 📊 Stats
// ============================================
const getStats = async (req, res) => {
  try {
    const { tipo } = req.params;
    if (!esTipoValido(tipo)) {
      return res.status(400).json({ success: false, message: `Tipo inválido: ${tipo}` });
    }

    const baseFilter = { tipo, eliminado: false };
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
    res.json({
      success: true,
      data: {
        tipo,
        ...config,
        tiposDestinatario: TIPOS_DESTINATARIO
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
  getDocumentosAdmin,
  getDocumentoById,
  createDocumento,
  updateDocumento,
  deleteDocumento,
  restoreDocumento,
  uploadPDF,
  getStats,
  getConfigDelTipo,
  getTiposDisponibles
};