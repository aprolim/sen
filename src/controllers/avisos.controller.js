// src/controllers/avisos.controller.js
const Aviso = require('../models/Aviso');
const Comunicado = require('../models/Comunicado');

// ============================================
// 📡 PÚBLICO - Obtener todos los avisos activos
// ============================================
const getAvisos = async (req, res) => {
  try {
    console.log('\n📢 [PUBLICO] Obteniendo avisos...');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { tipo, search } = req.query;

    const filters = { activo: true };

    if (tipo && tipo !== 'todos') {
      filters.tipo = tipo;
    }

    if (search) {
      filters.$or = [
        { titulo: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (page - 1) * limit;

    // 🔥 Ordenar: primero los de origen "manual" con prioridad, luego los de "comunicado"
    const [avisos, total] = await Promise.all([
      Aviso.find(filters)
        .sort({
          origen: -1, // manual (1) primero, comunicado (0) después
          createdAt: -1
        })
        .skip(skip)
        .limit(limit)
        .populate('creadoPor', 'email profile')
        .populate('actualizadoPor', 'email profile')
        .lean(),
      Aviso.countDocuments(filters)
    ]);

    console.log(`   ✅ Encontrados ${avisos.length} avisos`);

    // 🔥 Agregar etiqueta de origen
    const avisosConOrigen = avisos.map(aviso => ({
      ...aviso,
      esComunicado: aviso.origen === 'comunicado',
      etiqueta: aviso.origen === 'comunicado' ? 'COMUNICADO' : 'AVISO'
    }));

    res.json({
      success: true,
      data: {
        avisos: avisosConOrigen,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error en getAvisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener avisos'
    });
  }
};

// ============================================
// 🔐 ADMIN - Obtener todos los avisos (con inactivos)
// ============================================
const getAvisosAdmin = async (req, res) => {
  try {
    console.log('\n📢 [ADMIN] Obteniendo avisos...');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { tipo, origen, search, incluirInactivos } = req.query;

    const filters = {};

    if (incluirInactivos !== 'true') {
      filters.activo = true;
    }

    if (tipo && tipo !== 'todos') {
      filters.tipo = tipo;
    }

    if (origen && origen !== 'todos') {
      filters.origen = origen;
    }

    if (search) {
      filters.$or = [
        { titulo: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [avisos, total] = await Promise.all([
      Aviso.find(filters)
        .sort({ origen: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('creadoPor', 'email profile')
        .populate('actualizadoPor', 'email profile')
        .populate('comunicadoId', 'titulo fechaLanzamiento')
        .lean(),
      Aviso.countDocuments(filters)
    ]);

    console.log(`   ✅ Encontrados ${avisos.length} avisos`);

    res.json({
      success: true,
      data: {
        avisos,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error en getAvisosAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener avisos'
    });
  }
};

// ============================================
// 🔐 ADMIN - Obtener aviso por ID
// ============================================
const getAvisoById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`\n📢 [ADMIN] Obteniendo aviso ID: ${id}`);

    const aviso = await Aviso.findById(id)
      .populate('creadoPor', 'email profile')
      .populate('actualizadoPor', 'email profile')
      .populate('comunicadoId', 'titulo fechaLanzamiento fechaDesactivacion');

    if (!aviso) {
      return res.status(404).json({
        success: false,
        message: 'Aviso no encontrado'
      });
    }

    res.json({
      success: true,
      data: aviso
    });
  } catch (error) {
    console.error('❌ Error en getAvisoById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener aviso'
    });
  }
};

// ============================================
// 🔐 ADMIN - Crear aviso manual
// ============================================
const createAviso = async (req, res) => {
  try {
    console.log('\n📢 [ADMIN] Creando aviso manual...');
    console.log('   👤 Usuario:', req.user.email);
    console.log('   📝 Título:', req.body.titulo);

    const {
      titulo,
      descripcion,
      tipo,
      fecha,
      tags,
      imagen,
      pdf,
      activo
    } = req.body;

    const aviso = new Aviso({
      titulo,
      descripcion,
      tipo: tipo || 'Normal',
      fecha: fecha || new Date().toLocaleDateString('es-ES'),
      tags: tags || [],
      imagen: imagen || null,
      pdf: pdf || null,
      origen: 'manual',
      comunicadoId: null,
      activo: activo !== undefined ? activo : true,
      creadoPor: req.user._id,
      actualizadoPor: req.user._id
    });

    await aviso.save();

    console.log(`   ✅ Aviso creado ID: ${aviso._id}`);

    res.status(201).json({
      success: true,
      message: 'Aviso creado exitosamente',
      data: aviso
    });
  } catch (error) {
    console.error('❌ Error en createAviso:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al crear aviso'
    });
  }
};

// ============================================
// 🔐 ADMIN - Actualizar aviso
// ============================================
const updateAviso = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`\n📢 [ADMIN] Actualizando aviso ID: ${id}`);
    console.log('   👤 Usuario:', req.user.email);

    const aviso = await Aviso.findById(id);

    if (!aviso) {
      return res.status(404).json({
        success: false,
        message: 'Aviso no encontrado'
      });
    }

    // Si es un aviso de comunicado, no permitir editar ciertos campos
    if (aviso.origen === 'comunicado') {
      const { titulo, descripcion, imagen, pdf, tags, tipo, activo } = req.body;

      if (titulo !== undefined) aviso.titulo = titulo;
      if (descripcion !== undefined) aviso.descripcion = descripcion;
      if (imagen !== undefined) aviso.imagen = imagen;
      if (pdf !== undefined) aviso.pdf = pdf;
      if (tags !== undefined) aviso.tags = tags;
      if (tipo !== undefined) aviso.tipo = tipo;
      if (activo !== undefined) aviso.activo = activo;

    } else {
      // Aviso manual - se pueden editar todos los campos
      const {
        titulo,
        descripcion,
        tipo,
        fecha,
        tags,
        imagen,
        pdf,
        activo
      } = req.body;

      if (titulo !== undefined) aviso.titulo = titulo;
      if (descripcion !== undefined) aviso.descripcion = descripcion;
      if (tipo !== undefined) aviso.tipo = tipo;
      if (fecha !== undefined) aviso.fecha = fecha;
      if (tags !== undefined) aviso.tags = tags;
      if (imagen !== undefined) aviso.imagen = imagen;
      if (pdf !== undefined) aviso.pdf = pdf;
      if (activo !== undefined) aviso.activo = activo;
    }

    aviso.actualizadoPor = req.user._id;
    await aviso.save();

    console.log(`   ✅ Aviso actualizado`);

    res.json({
      success: true,
      message: 'Aviso actualizado exitosamente',
      data: aviso
    });
  } catch (error) {
    console.error('❌ Error en updateAviso:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar aviso'
    });
  }
};

// ============================================
// 🔐 ADMIN - Cambiar estado (activo/inactivo)
// ============================================
const toggleActivo = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    console.log(`\n🔄 [ADMIN] Cambiando estado de aviso ID: ${id}`);
    console.log(`   📊 Nuevo estado: ${activo ? 'ACTIVO' : 'INACTIVO'}`);

    const aviso = await Aviso.findById(id);

    if (!aviso) {
      return res.status(404).json({
        success: false,
        message: 'Aviso no encontrado'
      });
    }

    aviso.activo = activo;
    aviso.actualizadoPor = req.user._id;
    await aviso.save();

    res.json({
      success: true,
      message: `Aviso ${activo ? 'activado' : 'desactivado'}`,
      data: aviso
    });
  } catch (error) {
    console.error('❌ Error en toggleActivo:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al cambiar estado'
    });
  }
};

// ============================================
// 🔐 ADMIN - Eliminar aviso
// ============================================
const deleteAviso = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`\n🗑️ [ADMIN] Eliminando aviso ID: ${id}`);

    const aviso = await Aviso.findById(id);

    if (!aviso) {
      return res.status(404).json({
        success: false,
        message: 'Aviso no encontrado'
      });
    }

    // No permitir eliminar avisos de comunicados
    if (aviso.origen === 'comunicado') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un aviso generado automáticamente desde un comunicado'
      });
    }

    await Aviso.findByIdAndDelete(id);

    console.log(`   ✅ Aviso eliminado: "${aviso.titulo}"`);

    res.json({
      success: true,
      message: 'Aviso eliminado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error en deleteAviso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar aviso'
    });
  }
};

// ============================================
// 🔐 ADMIN - Obtener estadísticas
// ============================================
const getStats = async (req, res) => {
  try {
    console.log('\n📊 [ADMIN] Obteniendo estadísticas de avisos...');

    const [total, activos, manuales, comunicados] = await Promise.all([
      Aviso.countDocuments(),
      Aviso.countDocuments({ activo: true }),
      Aviso.countDocuments({ origen: 'manual' }),
      Aviso.countDocuments({ origen: 'comunicado' })
    ]);

    res.json({
      success: true,
      data: { total, activos, manuales, comunicados }
    });
  } catch (error) {
    console.error('❌ Error en getStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

// ============================================
// 🔐 ADMIN - Tipos disponibles
// ============================================
const getTipos = async (req, res) => {
  const tipos = [
    { value: 'Urgente', label: 'Urgente', color: 'red' },
    { value: 'Importante', label: 'Importante', color: 'yellow' },
    { value: 'Informativo', label: 'Informativo', color: 'blue' },
    { value: 'Normal', label: 'Normal', color: 'green' }
  ];

  res.json({
    success: true,
    data: tipos
  });
};

// ============================================
// EXPORTAR OBJETO PLANO (sin clase, sin this)
// ============================================
module.exports = {
  // Público
  getAvisos,
  getTipos,
  // Admin
  getAvisosAdmin,
  getAvisoById,
  createAviso,
  updateAviso,
  toggleActivo,
  deleteAviso,
  getStats
};