// src/controllers/comunicados.controller.js
const Comunicado = require('../models/Comunicado');
const Aviso = require('../models/Aviso');

// ============================================
// 🔧 FUNCIONES AUXILIARES
// ============================================

/**
 * Actualiza estados automáticamente:
 * - programado → activo (cuando llega fechaActivacion)
 * - activo → inactivo (cuando pasa fechaDesactivacion, si tiene)
 */
async function actualizarEstados() {
  try {
    const ahora = new Date();
    let actualizados = 0;

    // 1. Programados → Activos
    const programados = await Comunicado.find({
      estado: 'programado',
      fechaActivacion: { $lte: ahora, $ne: null }
    });

    for (const comunicado of programados) {
      comunicado.estado = 'activo';
      comunicado.activadoEn = ahora;
      await comunicado.save();
      actualizados++;
      console.log(`   🔄 "${comunicado.titulo}" → ACTIVO (programación cumplida)`);
    }

    // 2. Activos → Inactivos (solo si tienen fechaDesactivacion)
    const activos = await Comunicado.find({
      estado: 'activo',
      fechaDesactivacion: { $lte: ahora, $ne: null }
    });

    for (const comunicado of activos) {
      comunicado.estado = 'inactivo';
      comunicado.desactivadoEn = ahora;
      await comunicado.save();
      actualizados++;
      console.log(`   🔄 "${comunicado.titulo}" → INACTIVO (fecha de desactivación cumplida)`);

      // Crear aviso automáticamente cuando expira
      await crearAvisoDesdeComunicado(comunicado);
    }

    if (actualizados > 0) {
      console.log(`   ✅ ${actualizados} comunicados actualizados automáticamente`);
    }

    return actualizados;
  } catch (error) {
    console.error('❌ Error en actualizarEstados:', error);
    return 0;
  }
}

/**
 * Crea un aviso a partir de un comunicado expirado
 */
async function crearAvisoDesdeComunicado(comunicado) {
  try {
    console.log(`   📝 Creando aviso desde comunicado: "${comunicado.titulo}"`);

    const existe = await Aviso.findOne({
      comunicadoId: comunicado._id,
      origen: 'comunicado'
    });

    if (existe) {
      console.log(`   ⚠️ El aviso ya existe para este comunicado`);
      return;
    }

    const aviso = new Aviso({
      titulo: comunicado.titulo,
      descripcion: comunicado.contenido.substring(0, 500),
      tipo: 'Normal',
      fecha: comunicado.fechaLanzamiento.toLocaleDateString('es-ES'),
      tags: ['Comunicado Oficial'],
      imagen: comunicado.imagen?.url || null,
      pdf: comunicado.pdf || null,
      origen: 'comunicado',
      comunicadoId: comunicado._id,
      fechaLanzamiento: comunicado.fechaLanzamiento,
      activo: true,
      creadoPor: comunicado.creadoPor,
      actualizadoPor: comunicado.actualizadoPor
    });

    await aviso.save();
    console.log(`   ✅ Aviso creado desde comunicado: "${aviso.titulo}"`);
  } catch (error) {
    console.error('   ❌ Error al crear aviso desde comunicado:', error.message);
  }
}

/**
 * 🔥 NUEVA: Valida las reglas de negocio para programación/activación
 * @returns {{ valido: boolean, mensaje?: string, estadoFinal: string, fechaActivacion: Date|null, fechaDesactivacion: Date|null }}
 */
function validarReglasDeEstado(estado, fechaActivacion, fechaDesactivacion) {
  const ahora = new Date();
  let estadoFinal = estado;
  let fa = fechaActivacion ? new Date(fechaActivacion) : null;
  let fd = fechaDesactivacion ? new Date(fechaDesactivacion) : null;

  // 1. No se permite crear inactivo → forzar a programado
  if (estadoFinal === 'inactivo') {
    estadoFinal = 'programado';
    console.log('   ⚠️ No se permite crear "inactivo" → forzando a "programado"');
  }

  // 2. Estado PROGRAMADO → requiere ambas fechas y fecha inicio futura
  if (estadoFinal === 'programado') {
    if (!fa || !fd) {
      return {
        valido: false,
        mensaje: 'Un comunicado programado requiere fecha de activación Y fecha de desactivación'
      };
    }
    if (fa >= fd) {
      return {
        valido: false,
        mensaje: 'La fecha de activación debe ser anterior a la fecha de desactivación'
      };
    }
    if (fa <= ahora) {
      return {
        valido: false,
        mensaje: 'Para programar, la fecha de activación debe ser FUTURA. Si quieres que aparezca ahora, usa "Activo".'
      };
    }
    return { valido: true, estadoFinal, fechaActivacion: fa, fechaDesactivacion: fd };
  }

  // 3. Estado ACTIVO → aparece ahora, fecha desactivación OPCIONAL
  if (estadoFinal === 'activo') {
    // Si no hay fecha activación, se activa ahora
    if (!fa || fa > ahora) {
      fa = ahora;
    }
    // Si hay fecha desactivación, validar que sea futura
    if (fd && fd <= ahora) {
      return {
        valido: false,
        mensaje: 'Si especificas fecha de desactivación, debe ser futura'
      };
    }
    return { valido: true, estadoFinal, fechaActivacion: fa, fechaDesactivacion: fd };
  }

  return { valido: false, mensaje: 'Estado inválido' };
}

// ============================================
// 📡 PÚBLICO
// ============================================

const getComunicadoActivo = async (req, res) => {
  try {
    console.log('\n📢 [PUBLICO] Obteniendo comunicado activo para modal...');

    await actualizarEstados();

    const comunicado = await Comunicado.findOne({
      estado: 'activo'
    }).sort({ prioridad: -1, createdAt: -1 });

    if (!comunicado) {
      console.log('   ℹ️ No hay comunicado activo');
      return res.json({
        success: true,
        data: null
      });
    }

    console.log(`   ✅ Comunicado activo: "${comunicado.titulo}"`);

    res.json({
      success: true,
      data: {
        id: comunicado._id,
        titulo: comunicado.titulo,
        contenido: comunicado.contenido,
        imagen: comunicado.imagen,
        pdf: comunicado.pdf,
        fechaLanzamiento: comunicado.fechaLanzamiento,
        fechaDesactivacion: comunicado.fechaDesactivacion
      }
    });
  } catch (error) {
    console.error('❌ Error en getComunicadoActivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comunicado activo'
    });
  }
};

const getComunicadosExpirados = async (req, res) => {
  try {
    console.log('\n📢 [PUBLICO] Obteniendo comunicados expirados...');

    await actualizarEstados();

    const comunicados = await Comunicado.find({
      estado: 'inactivo',
      fechaDesactivacion: { $lte: new Date(), $ne: null }
    })
      .sort({ fechaLanzamiento: -1 })
      .select('titulo contenido imagen pdf fechaLanzamiento fechaDesactivacion createdAt');

    console.log(`   ✅ Encontrados ${comunicados.length} comunicados expirados`);

    res.json({
      success: true,
      data: comunicados
    });
  } catch (error) {
    console.error('❌ Error en getComunicadosExpirados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comunicados expirados'
    });
  }
};

// ============================================
// 🔐 ADMIN - CRUD
// ============================================

const getComunicados = async (req, res) => {
  try {
    console.log('\n📢 [ADMIN] Obteniendo comunicados...');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { estado, search } = req.query;

    await actualizarEstados();

    const filters = {};
    if (estado && estado !== 'todos') filters.estado = estado;
    if (search) {
      filters.$or = [
        { titulo: { $regex: search, $options: 'i' } },
        { contenido: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [comunicados, total] = await Promise.all([
      Comunicado.find(filters)
        .sort({ prioridad: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('creadoPor', 'email profile')
        .populate('actualizadoPor', 'email profile')
        .lean(),
      Comunicado.countDocuments(filters)
    ]);

    console.log(`   ✅ Encontrados ${comunicados.length} comunicados`);

    res.json({
      success: true,
      data: {
        comunicados,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error en getComunicados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comunicados'
    });
  }
};

const getComunicadoById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`\n📢 [ADMIN] Obteniendo comunicado ID: ${id}`);

    const comunicado = await Comunicado.findById(id)
      .populate('creadoPor', 'email profile')
      .populate('actualizadoPor', 'email profile');

    if (!comunicado) {
      return res.status(404).json({
        success: false,
        message: 'Comunicado no encontrado'
      });
    }

    res.json({
      success: true,
      data: comunicado
    });
  } catch (error) {
    console.error('❌ Error en getComunicadoById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comunicado'
    });
  }
};

/**
 * 🔥 CREAR COMUNICADO - Con nuevas reglas
 * - No se permite crear como "inactivo" → forzar a "programado"
 * - Programado → requiere ambas fechas y fecha inicio futura
 * - Activo → aparece ahora, fecha fin opcional
 */
const createComunicado = async (req, res) => {
  try {
    console.log('\n📢 [ADMIN] Creando comunicado...');
    console.log('   👤 Usuario:', req.user.email);
    console.log('   📝 Título:', req.body.titulo);
    console.log('   📊 Estado solicitado:', req.body.estado);
    console.log('   📅 fechaActivacion:', req.body.fechaActivacion);
    console.log('   📅 fechaDesactivacion:', req.body.fechaDesactivacion);

    const {
      titulo,
      contenido,
      imagen,
      pdf,
      estado = 'programado',
      fechaActivacion,
      fechaDesactivacion,
      prioridad
    } = req.body;

    // Validar imagen
    if (!imagen || !imagen.url) {
      return res.status(400).json({
        success: false,
        message: 'La imagen es requerida'
      });
    }

    // 🔥 Aplicar reglas de negocio
    const validacion = validarReglasDeEstado(estado, fechaActivacion, fechaDesactivacion);

    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        message: validacion.mensaje
      });
    }

    const ahora = new Date();

    const comunicado = new Comunicado({
      titulo,
      contenido,
      imagen,
      pdf: pdf || null,
      estado: validacion.estadoFinal,
      fechaActivacion: validacion.fechaActivacion,
      fechaDesactivacion: validacion.fechaDesactivacion,
      prioridad: prioridad || 0,
      fechaLanzamiento: ahora,
      creadoPor: req.user._id,
      actualizadoPor: req.user._id
    });

    if (validacion.estadoFinal === 'activo') {
      comunicado.activadoEn = ahora;
    }

    await comunicado.save();

    console.log(`   ✅ Comunicado creado ID: ${comunicado._id}`);
    console.log(`   📊 Estado final: ${comunicado.estado}`);
    console.log(`   📅 Activación: ${comunicado.fechaActivacion}`);
    console.log(`   📅 Desactivación: ${comunicado.fechaDesactivacion || 'Sin fecha fin'}`);

    res.status(201).json({
      success: true,
      message: 'Comunicado creado exitosamente',
      data: comunicado
    });
  } catch (error) {
    console.error('❌ Error en createComunicado:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al crear comunicado'
    });
  }
};

/**
 * 🔥 ACTUALIZAR COMUNICADO - Aquí SÍ se permite inactivar
 * - Programado → requiere ambas fechas y fecha inicio futura (o igual a ahora)
 * - Activo → fecha fin opcional
 * - Inactivo → permitido (para desactivar manualmente)
 */
const updateComunicado = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`\n📢 [ADMIN] Actualizando comunicado ID: ${id}`);
    console.log('   👤 Usuario:', req.user.email);

    const comunicado = await Comunicado.findById(id);

    if (!comunicado) {
      return res.status(404).json({
        success: false,
        message: 'Comunicado no encontrado'
      });
    }

    const {
      titulo,
      contenido,
      imagen,
      pdf,
      estado,
      fechaActivacion,
      fechaDesactivacion,
      prioridad
    } = req.body;

    // Actualizar campos básicos
    if (titulo !== undefined) comunicado.titulo = titulo;
    if (contenido !== undefined) comunicado.contenido = contenido;
    if (imagen !== undefined) comunicado.imagen = imagen;
    if (pdf !== undefined) comunicado.pdf = pdf;
    if (prioridad !== undefined) comunicado.prioridad = prioridad;

    // Si se está cambiando el estado, validar reglas
    if (estado !== undefined) {
      const validacion = validarReglasDeEstado(
        estado,
        fechaActivacion !== undefined ? fechaActivacion : comunicado.fechaActivacion,
        fechaDesactivacion !== undefined ? fechaDesactivacion : comunicado.fechaDesactivacion
      );

      if (!validacion.valido) {
        return res.status(400).json({
          success: false,
          message: validacion.mensaje
        });
      }

      const estadoAnterior = comunicado.estado;
      const ahora = new Date();

      comunicado.estado = validacion.estadoFinal;
      comunicado.fechaActivacion = validacion.fechaActivacion;
      comunicado.fechaDesactivacion = validacion.fechaDesactivacion;

      // Registrar cambios de estado
      if (validacion.estadoFinal === 'activo' && estadoAnterior !== 'activo') {
        comunicado.activadoEn = ahora;
        comunicado.desactivadoEn = null; // limpiar si se reactiva
      }

      if (validacion.estadoFinal === 'inactivo' && estadoAnterior === 'activo') {
        comunicado.desactivadoEn = ahora;
      }
    } else {
      // No se cambió el estado, pero puede que se cambien las fechas
      if (fechaActivacion !== undefined) {
        comunicado.fechaActivacion = fechaActivacion ? new Date(fechaActivacion) : null;
      }
      if (fechaDesactivacion !== undefined) {
        comunicado.fechaDesactivacion = fechaDesactivacion ? new Date(fechaDesactivacion) : null;
      }

      // Validar que si quedó programado, tenga ambas fechas
      if (comunicado.estado === 'programado') {
        if (!comunicado.fechaActivacion || !comunicado.fechaDesactivacion) {
          return res.status(400).json({
            success: false,
            message: 'Un comunicado programado requiere ambas fechas'
          });
        }
        if (comunicado.fechaActivacion >= comunicado.fechaDesactivacion) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de activación debe ser anterior a la fecha de desactivación'
          });
        }
      }
    }

    comunicado.actualizadoPor = req.user._id;
    await comunicado.save();

    console.log(`   ✅ Comunicado actualizado`);
    console.log(`   📊 Estado: ${comunicado.estado}`);
    console.log(`   📅 Activación: ${comunicado.fechaActivacion}`);
    console.log(`   📅 Desactivación: ${comunicado.fechaDesactivacion || 'Sin fecha fin'}`);

    const comunicadoActualizado = await Comunicado.findById(id)
      .populate('creadoPor', 'email profile')
      .populate('actualizadoPor', 'email profile');

    res.json({
      success: true,
      message: 'Comunicado actualizado exitosamente',
      data: comunicadoActualizado
    });
  } catch (error) {
    console.error('❌ Error en updateComunicado:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar comunicado'
    });
  }
};

/**
 * PATCH /api/comunicados/:id/estado
 * Cambia solo el estado (activo/inactivo/programado)
 */
const changeEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    console.log(`\n🔄 [ADMIN] Cambiando estado de comunicado ID: ${id}`);
    console.log(`   📊 Nuevo estado: ${estado}`);

    if (!estado || !['activo', 'inactivo', 'programado'].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Use: activo, inactivo o programado'
      });
    }

    const comunicado = await Comunicado.findById(id);

    if (!comunicado) {
      return res.status(404).json({
        success: false,
        message: 'Comunicado no encontrado'
      });
    }

    // Validar según el nuevo estado
    const validacion = validarReglasDeEstado(
      estado,
      comunicado.fechaActivacion,
      comunicado.fechaDesactivacion
    );

    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        message: validacion.mensaje
      });
    }

    const estadoAnterior = comunicado.estado;
    const ahora = new Date();

    comunicado.estado = validacion.estadoFinal;
    comunicado.fechaActivacion = validacion.fechaActivacion;
    comunicado.fechaDesactivacion = validacion.fechaDesactivacion;

    if (validacion.estadoFinal === 'activo' && estadoAnterior !== 'activo') {
      comunicado.activadoEn = ahora;
      comunicado.desactivadoEn = null;
    }
    if (validacion.estadoFinal === 'inactivo' && estadoAnterior === 'activo') {
      comunicado.desactivadoEn = ahora;
    }

    comunicado.actualizadoPor = req.user._id;
    await comunicado.save();

    console.log(`   ✅ Estado cambiado de ${estadoAnterior} a ${comunicado.estado}`);

    res.json({
      success: true,
      message: `Estado cambiado a ${estado}`,
      data: comunicado
    });
  } catch (error) {
    console.error('❌ Error en changeEstado:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al cambiar estado'
    });
  }
};

const deleteComunicado = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`\n🗑️ [ADMIN] Eliminando comunicado ID: ${id}`);

    const comunicado = await Comunicado.findById(id);

    if (!comunicado) {
      return res.status(404).json({
        success: false,
        message: 'Comunicado no encontrado'
      });
    }

    if (comunicado.estaExpirado()) {
      const avisoEliminado = await Aviso.findOneAndDelete({
        comunicadoId: comunicado._id,
        origen: 'comunicado'
      });
      if (avisoEliminado) {
        console.log(`   🗑️ Aviso asociado eliminado: "${avisoEliminado.titulo}"`);
      }
    }

    await Comunicado.findByIdAndDelete(id);

    console.log(`   ✅ Comunicado eliminado: "${comunicado.titulo}"`);

    res.json({
      success: true,
      message: 'Comunicado eliminado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error en deleteComunicado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar comunicado'
    });
  }
};

const getStats = async (req, res) => {
  try {
    console.log('\n📊 [ADMIN] Obteniendo estadísticas de comunicados...');

    await actualizarEstados();

    const [total, activos, inactivos, programados] = await Promise.all([
      Comunicado.countDocuments(),
      Comunicado.countDocuments({ estado: 'activo' }),
      Comunicado.countDocuments({ estado: 'inactivo' }),
      Comunicado.countDocuments({ estado: 'programado' })
    ]);

    const expirados = await Comunicado.countDocuments({
      estado: 'inactivo',
      fechaDesactivacion: { $lte: new Date(), $ne: null }
    });

    console.log(`   ✅ Stats: Total=${total}, Activos=${activos}, Inactivos=${inactivos}, Programados=${programados}, Expirados=${expirados}`);

    res.json({
      success: true,
      data: {
        total,
        activos,
        inactivos,
        programados,
        expirados
      }
    });
  } catch (error) {
    console.error('❌ Error en getStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

const forceUpdateEstados = async (req, res) => {
  try {
    console.log('\n🔄 [ADMIN] Forzando actualización de estados...');

    const actualizados = await actualizarEstados();

    res.json({
      success: true,
      message: `Estados actualizados: ${actualizados} comunicados modificados`,
      data: { actualizados }
    });
  } catch (error) {
    console.error('❌ Error en forceUpdateEstados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estados'
    });
  }
};

// ============================================
// 📤 ADMIN - Uploads
// ============================================

const uploadImage = async (req, res) => {
  try {
    console.log('\n📸 [ADMIN] Subiendo imagen de comunicado...');
    console.log('   👤 Usuario:', req.user?.email);
    console.log('   📦 Archivo:', req.file?.originalname);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ninguna imagen',
        code: 'NO_FILE'
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/images/${req.file.filename}`;

    console.log(`   ✅ Imagen subida: ${imageUrl}`);

    res.json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: {
        url: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('❌ Error en uploadImage:', error);

    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    res.status(500).json({
      success: false,
      message: 'Error al subir la imagen',
      code: 'UPLOAD_ERROR'
    });
  }
};

const uploadPDF = async (req, res) => {
  try {
    console.log('\n📄 [ADMIN] Subiendo PDF de comunicado...');
    console.log('   👤 Usuario:', req.user?.email);
    console.log('   📦 Archivo:', req.file?.originalname);
    console.log('   📊 Tamaño:', req.file ? (req.file.size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ningún PDF',
        code: 'NO_FILE'
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const pdfUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;

    console.log(`   ✅ PDF subido: ${pdfUrl}`);

    res.json({
      success: true,
      message: 'PDF subido exitosamente',
      data: {
        url: pdfUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        sizeMB: (req.file.size / 1024 / 1024).toFixed(2),
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('❌ Error en uploadPDF:', error);

    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    res.status(500).json({
      success: false,
      message: 'Error al subir el PDF',
      code: 'UPLOAD_ERROR'
    });
  }
};

// ============================================
// EXPORTAR
// ============================================
module.exports = {
  // Público
  getComunicadoActivo,
  getComunicadosExpirados,
  // Admin - CRUD
  getComunicados,
  getComunicadoById,
  createComunicado,
  updateComunicado,
  changeEstado,
  deleteComunicado,
  getStats,
  forceUpdateEstados,
  // Uploads
  uploadImage,
  uploadPDF
};