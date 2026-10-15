// src/controllers/documentosLegislativos.controller.js
const DocumentoLegislativo = require('../models/DocumentoLegislativo');
const { esTipoValido, getConfigTipo, TIPOS_DESTINATARIO } = require('../config/tiposDocumento');

// ============================================
// 🛠️ HELPERS
// ============================================

/**
 * Convierte strings vacíos o inválidos a null para fechas.
 * Así evitamos errores de Mongoose con strings vacíos en Date.
 */
const parsearFecha = (valor) => {
  if (!valor || valor === '' || valor === 'null' || valor === 'undefined') return null;
  const fecha = new Date(valor);
  return isNaN(fecha.getTime()) ? null : fecha;
};

/**
 * Sanitiza el objeto de datos recibido en el body: convierte strings vacíos
 * en null para campos de fecha, y limpia strings con trim.
 */
const sanitizarBody = (body) => {
  const camposFecha = [
    'fechaIngreso',
    'fechaRemisionDestinatario',
    'fechaRespuesta',
    'fechaRemisionPeticionario',
    'fechaRealizacion',
    'fechaReprogramacion',
    'fechaRealizacionFinal'
  ];

  const limpio = { ...body };

  camposFecha.forEach((campo) => {
    if (campo in limpio) {
      limpio[campo] = parsearFecha(limpio[campo]);
    }
  });

  // Campos de texto: trim y "" → ""
  const camposTexto = [
    'codigo',
    'peticionario',
    'asunto',
    'destinatario',
    'tipoDestinatario',
    'conminatoria',
    'observacion'
  ];

  camposTexto.forEach((campo) => {
    if (typeof limpio[campo] === 'string') {
      limpio[campo] = limpio[campo].trim();
    }
  });

  return limpio;
};

/**
 * Extrae solo los campos permitidos por la configuración del tipo.
 * Ignora campos que no pertenecen al tipo (evita "contaminación").
 */
const extraerCamposDelTipo = (body, tipo, modo = 'create') => {
  const config = getConfigTipo(tipo);
  if (!config) return {};

  const camposPermitidos = [...config.campos];

  // En create, agregamos 'numero' (obligatorio, lo ingresa el usuario)
  if (modo === 'create') {
    camposPermitidos.push('numero');
  }

  const resultado = {};
  camposPermitidos.forEach((campo) => {
    if (body[campo] !== undefined) {
      resultado[campo] = body[campo];
    }
  });

  return resultado;
};

/**
 * Valida que los campos obligatorios estén presentes según la config del tipo.
 */
const validarObligatorios = (body, tipo) => {
  const config = getConfigTipo(tipo);
  if (!config) return ['Tipo inválido'];

  const errores = [];
  config.camposObligatorios.forEach((campo) => {
    const valor = body[campo];
    const vacio =
      valor === undefined ||
      valor === null ||
      (typeof valor === 'string' && valor.trim() === '') ||
      (typeof valor === 'number' && valor <= 0);

    if (vacio) {
      errores.push(`El campo "${campo}" es obligatorio`);
    }
  });

  return errores;
};

// ============================================
// 📡 PÚBLICO - Listar documentos (paginado)
// GET /api/legislativos/:tipo
// ============================================
const getDocumentosPublicos = async (req, res) => {
  try {
    const { tipo } = req.params;

    if (!esTipoValido(tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo inválido: ${tipo}`
      });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { search, gestion } = req.query;

    // 🔥 Filtro base: solo del tipo solicitado y NO eliminados
    const filters = {
      tipo,
      eliminado: false,
      activo: true
    };

    // Filtro por gestión (año)
    if (gestion) {
      const year = parseInt(gestion);
      if (!isNaN(year)) {
        filters.fechaIngreso = {
          $gte: new Date(`${year}-01-01T00:00:00.000Z`),
          $lte: new Date(`${year}-12-31T23:59:59.999Z`)
        };
      }
    }

    // Búsqueda por texto
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
        .lean(),
      DocumentoLegislativo.countDocuments(filters)
    ]);

    res.json({
      success: true,
      data: {
        documentos,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ [getDocumentosPublicos]', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los documentos'
    });
  }
};

// ============================================
// 🔐 ADMIN - Listar (incluye inactivos y eliminados)
// GET /api/legislativos/:tipo/admin
// ============================================
const getDocumentosAdmin = async (req, res) => {
  try {
    const { tipo } = req.params;

    if (!esTipoValido(tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo inválido: ${tipo}`
      });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { search, gestion, incluirInactivos, incluirEliminados } = req.query;

    // Por defecto, la vista admin NO muestra eliminados ni inactivos.
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
      data: {
        documentos,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ [getDocumentosAdmin]', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los documentos'
    });
  }
};

// ============================================
// 🔐 ADMIN - Obtener uno por ID
// GET /api/legislativos/:tipo/:id
// ============================================
const getDocumentoById = async (req, res) => {
  try {
    const { tipo, id } = req.params;

    if (!esTipoValido(tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo inválido: ${tipo}`
      });
    }

    const doc = await DocumentoLegislativo.findOne({ _id: id, tipo })
      .populate('creadoPor', 'email profile')
      .populate('actualizadoPor', 'email profile')
      .populate('eliminadoPor', 'email profile');

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    res.json({ success: true, data: doc });
  } catch (error) {
    console.error('❌ [getDocumentoById]', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el documento'
    });
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
      return res.status(400).json({
        success: false,
        message: `Tipo inválido: ${tipo}`
      });
    }

    // 1. Sanitizar body (fechas, strings)
    const bodyLimpio = sanitizarBody(req.body);

    // 2. Validar obligatorios
    const errores = validarObligatorios(bodyLimpio, tipo);
    if (errores.length > 0) {
      return res.status(400).json({
        success: false,
        message: errores.join('. '),
        errores
      });
    }

    // 3. Validar tipo de destinatario
    if (
      bodyLimpio.tipoDestinatario &&
      !TIPOS_DESTINATARIO.includes(bodyLimpio.tipoDestinatario)
    ) {
      return res.status(400).json({
        success: false,
        message: `Tipo de destinatario inválido. Opciones: ${TIPOS_DESTINATARIO.join(', ')}`
      });
    }

    // 4. Verificar que no exista ya un documento con ese número
    //    dentro del mismo tipo (evita duplicados).
    const yaExiste = await DocumentoLegislativo.findOne({
      tipo,
      numero: bodyLimpio.numero
    });

    if (yaExiste) {
      return res.status(409).json({
        success: false,
        message: `Ya existe un documento con el número ${bodyLimpio.numero} en este tipo.`
      });
    }

    // 5. Extraer solo los campos válidos del tipo
    const datos = extraerCamposDelTipo(bodyLimpio, tipo, 'create');

    // 6. Crear documento
    const doc = new DocumentoLegislativo({
      ...datos,
      tipo,
      creadoPor: req.user._id,
      actualizadoPor: req.user._id
    });

    await doc.save();

    console.log(
      `✅ [createDocumento] ${tipo} #${doc.numero} creado por ${req.user.email}`
    );

    res.status(201).json({
      success: true,
      message: 'Documento creado exitosamente',
      data: doc
    });
  } catch (error) {
    console.error('❌ [createDocumento]', error);

    // Error de duplicado de Mongo (por si el índice único existiera)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un documento con esos datos.'
      });
    }

    // Error de validación de Mongoose
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: mensajes.join('. '),
        errores: mensajes
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
// PUT /api/legislativos/:tipo/:id
// ============================================
const updateDocumento = async (req, res) => {
  try {
    const { tipo, id } = req.params;

    if (!esTipoValido(tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo inválido: ${tipo}`
      });
    }

    const doc = await DocumentoLegislativo.findOne({ _id: id, tipo });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    if (doc.eliminado) {
      return res.status(400).json({
        success: false,
        message: 'No se puede editar un documento eliminado. Restáuralo primero.'
      });
    }

    const config = getConfigTipo(tipo);

    // 1. Sanitizar body
    const bodyLimpio = sanitizarBody(req.body);

    // 2. Ignorar campos bloqueados (ej: numero)
    config.camposBloqueadosEnEdicion.forEach((campo) => {
      delete bodyLimpio[campo];
    });

    // 3. Extraer solo los campos válidos del tipo
    const datos = extraerCamposDelTipo(bodyLimpio, tipo, 'update');

    // 4. Validar tipo de destinatario si viene
    if (
      datos.tipoDestinatario &&
      !TIPOS_DESTINATARIO.includes(datos.tipoDestinatario)
    ) {
      return res.status(400).json({
        success: false,
        message: `Tipo de destinatario inválido. Opciones: ${TIPOS_DESTINATARIO.join(', ')}`
      });
    }

    // 5. Aplicar cambios
    Object.keys(datos).forEach((campo) => {
      doc[campo] = datos[campo];
    });

    doc.actualizadoPor = req.user._id;

    await doc.save();

    console.log(
      `✅ [updateDocumento] ${tipo} #${doc.numero} actualizado por ${req.user.email}`
    );

    res.json({
      success: true,
      message: 'Documento actualizado exitosamente',
      data: doc
    });
  } catch (error) {
    console.error('❌ [updateDocumento]', error);

    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: mensajes.join('. '),
        errores: mensajes
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar el documento'
    });
  }
};

// ============================================
// 🔥 SOFT DELETE - No borra, solo oculta
// DELETE /api/legislativos/:tipo/:id
// ============================================
const deleteDocumento = async (req, res) => {
  try {
    const { tipo, id } = req.params;
    const { motivo } = req.body || {};

    if (!esTipoValido(tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo inválido: ${tipo}`
      });
    }

    const doc = await DocumentoLegislativo.findOne({ _id: id, tipo });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    if (doc.eliminado) {
      return res.status(400).json({
        success: false,
        message: 'El documento ya fue eliminado previamente'
      });
    }

    // 🔥 SOFT DELETE: no borramos el registro. Solo lo marcamos.
    doc.eliminado = true;
    doc.eliminadoPor = req.user._id;
    doc.fechaEliminacion = new Date();
    doc.motivoEliminacion = (motivo || '').trim().substring(0, 500);
    doc.actualizadoPor = req.user._id;

    await doc.save();

    console.log(
      `🗑️ [SOFT DELETE] ${tipo} #${doc.numero} eliminado por ${req.user.email}`
    );

    res.json({
      success: true,
      message:
        'Documento eliminado correctamente. Los datos se conservan para auditoría.',
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
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el documento'
    });
  }
};

// ============================================
// 🔐 SUPER_ADMIN - Restaurar
// PATCH /api/legislativos/:tipo/:id/restore
// ============================================
const restoreDocumento = async (req, res) => {
  try {
    const { tipo, id } = req.params;

    if (!esTipoValido(tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo inválido: ${tipo}`
      });
    }

    const doc = await DocumentoLegislativo.findOne({
      _id: id,
      tipo,
      eliminado: true
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Documento eliminado no encontrado'
      });
    }

    doc.eliminado = false;
    doc.eliminadoPor = null;
    doc.fechaEliminacion = null;
    doc.motivoEliminacion = '';
    doc.actualizadoPor = req.user._id;

    await doc.save();

    console.log(
      `♻️ [RESTORE] ${tipo} #${doc.numero} restaurado por ${req.user.email}`
    );

    res.json({
      success: true,
      message: 'Documento restaurado exitosamente',
      data: doc
    });
  } catch (error) {
    console.error('❌ [restoreDocumento]', error);
    res.status(500).json({
      success: false,
      message: 'Error al restaurar el documento'
    });
  }
};

// ============================================
// 📤 Upload PDF
// POST /api/legislativos/:tipo/upload-pdf
// ============================================
const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ningún PDF'
      });
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
    res.status(500).json({
      success: false,
      message: 'Error al subir el PDF'
    });
  }
};

// ============================================
// 📊 Stats (para contadores de la home)
// GET /api/legislativos/:tipo/stats
// ============================================
const getStats = async (req, res) => {
  try {
    const { tipo } = req.params;

    if (!esTipoValido(tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo inválido: ${tipo}`
      });
    }

    const baseFilter = { tipo, eliminado: false };

    const [total, activos, eliminados] = await Promise.all([
      DocumentoLegislativo.countDocuments(baseFilter),
      DocumentoLegislativo.countDocuments({ ...baseFilter, activo: true }),
      DocumentoLegislativo.countDocuments({ tipo, eliminado: true })
    ]);

    res.json({
      success: true,
      data: {
        total,
        activos,
        eliminados
      }
    });
  } catch (error) {
    console.error('❌ [getStats]', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

// ============================================
// 📋 Configuración del tipo (para el CMS)
// GET /api/legislativos/:tipo/config
// ============================================
const getConfigDelTipo = async (req, res) => {
  try {
    const { tipo } = req.params;

    if (!esTipoValido(tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo inválido: ${tipo}`
      });
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
    res.status(500).json({
      success: false,
      message: 'Error al obtener la configuración'
    });
  }
};

// ============================================
// 📋 Listar tipos disponibles
// GET /api/legislativos/tipos
// ============================================
const getTiposDisponibles = async (req, res) => {
  try {
    const { TIPOS_DOCUMENTO } = require('../config/tiposDocumento');

    const tipos = Object.entries(TIPOS_DOCUMENTO).map(([key, value]) => ({
      tipo: key,
      label: value.label,
      bloque: value.bloque,
      prefijoCodigo: value.prefijoCodigo
    }));

    res.json({
      success: true,
      data: tipos
    });
  } catch (error) {
    console.error('❌ [getTiposDisponibles]', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los tipos'
    });
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