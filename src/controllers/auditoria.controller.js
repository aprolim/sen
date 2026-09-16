// src/controllers/auditoria.controller.js
const AuditoriaPOA = require('../models/AuditoriaPOA');

// ============================================
// 📡 PÚBLICO - Listar POAs
// ============================================
const getPOAsPublic = async (req, res) => {
  try {
    console.log('\n📂 [PUBLICO] Obteniendo POAs...');

    const poas = await AuditoriaPOA.find({
      estado: { $ne: 'Borrador' }
    })
      .sort({ anio: -1 })
      .lean();

    console.log(`   ✅ ${poas.length} POAs encontrados`);

    res.json({
      success: true,
      data: {
        documentos: poas.map(p => ({
          _id: p._id,
          anio: p.anio,
          titulo: p.titulo,
          fecha: p.fecha || '',
          estado: p.estado,
          activo: p.activo,
          pdfUrl: p.pdfUrl
        }))
      }
    });
  } catch (error) {
    console.error('❌ Error en getPOAsPublic:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los POAs'
    });
  }
};

// ============================================
// 🔐 ADMIN - Listar POAs (con borradores)
// ============================================
const getPOAsAdmin = async (req, res) => {
  try {
    console.log('\n📂 [ADMIN] Obteniendo POAs...');

    const poas = await AuditoriaPOA.find({})
      .sort({ anio: -1 })
      .populate('creadoPor', 'email profile')
      .populate('actualizadoPor', 'email profile')
      .lean();

    console.log(`   ✅ ${poas.length} POAs encontrados`);

    res.json({
      success: true,
      data: {
        documentos: poas,
        total: poas.length
      }
    });
  } catch (error) {
    console.error('❌ Error en getPOAsAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los POAs'
    });
  }
};

// ============================================
// 🔐 ADMIN - Obtener un POA por ID
// ============================================
const getPOAById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`\n📂 [ADMIN] Obteniendo POA ID: ${id}`);

    const poa = await AuditoriaPOA.findById(id)
      .populate('creadoPor', 'email profile')
      .populate('actualizadoPor', 'email profile');

    if (!poa) {
      return res.status(404).json({
        success: false,
        message: 'POA no encontrado'
      });
    }

    res.json({
      success: true,
      data: poa
    });
  } catch (error) {
    console.error('❌ Error en getPOAById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el POA'
    });
  }
};

// ============================================
// 🔐 ADMIN - Crear POA
// ============================================
const createPOA = async (req, res) => {
  try {
    console.log('\n➕ [ADMIN] Creando POA...');
    console.log(`   👤 Usuario: ${req.user.email}`);
    console.log(`   📝 Año: ${req.body.anio}`);

    const { anio, titulo, fecha, estado, activo, pdfUrl } = req.body;

    if (!anio) {
      return res.status(400).json({
        success: false,
        message: 'El año es requerido'
      });
    }

    // Verificar duplicado
    const existe = await AuditoriaPOA.findOne({ anio });
    if (existe) {
      return res.status(400).json({
        success: false,
        message: `Ya existe un POA para el año ${anio}`
      });
    }

    const poa = new AuditoriaPOA({
      anio,
      titulo: titulo || `Plan Operativo Anual - UAI ${anio}`,
      fecha: fecha || new Date().toLocaleDateString('es-ES'),
      estado: estado || 'Publicado',
      activo: activo || false,
      pdfUrl: pdfUrl || null,
      creadoPor: req.user._id,
      actualizadoPor: req.user._id
    });

    await poa.save();

    console.log(`   ✅ POA creado: ${poa._id}`);

    res.status(201).json({
      success: true,
      message: 'POA creado exitosamente',
      data: poa
    });
  } catch (error) {
    console.error('❌ Error en createPOA:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al crear POA'
    });
  }
};

// ============================================
// 🔐 ADMIN - Actualizar POA
// ============================================
const updatePOA = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`\n✏️ [ADMIN] Actualizando POA ID: ${id}`);
    console.log(`   👤 Usuario: ${req.user.email}`);

    const poa = await AuditoriaPOA.findById(id);

    if (!poa) {
      return res.status(404).json({
        success: false,
        message: 'POA no encontrado'
      });
    }

    // Campos permitidos
    const allowedFields = ['anio', 'titulo', 'fecha', 'estado', 'activo', 'pdfUrl'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        poa[field] = req.body[field];
      }
    });

    poa.actualizadoPor = req.user._id;
    await poa.save();

    console.log(`   ✅ POA actualizado`);

    res.json({
      success: true,
      message: 'POA actualizado exitosamente',
      data: poa
    });
  } catch (error) {
    console.error('❌ Error en updatePOA:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar POA'
    });
  }
};

// ============================================
// 🔐 ADMIN - Eliminar POA
// ============================================
const deletePOA = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`\n🗑️ [ADMIN] Eliminando POA ID: ${id}`);

    const poa = await AuditoriaPOA.findByIdAndDelete(id);

    if (!poa) {
      return res.status(404).json({
        success: false,
        message: 'POA no encontrado'
      });
    }

    console.log(`   ✅ POA eliminado: ${poa.titulo}`);

    res.json({
      success: true,
      message: 'POA eliminado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error en deletePOA:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar POA'
    });
  }
};

// ============================================
// 🔐 ADMIN - Toggle activo (solo uno puede estar activo)
// ============================================
const toggleActivo = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    console.log(`\n🔄 [ADMIN] Cambiando estado de POA ID: ${id}`);
    console.log(`   📊 Nuevo estado: ${activo ? 'ACTIVO' : 'INACTIVO'}`);

    const poa = await AuditoriaPOA.findById(id);

    if (!poa) {
      return res.status(404).json({
        success: false,
        message: 'POA no encontrado'
      });
    }

    poa.activo = activo;
    poa.actualizadoPor = req.user._id;
    await poa.save(); // El hook pre-save desmarca los demás

    console.log(`   ✅ Estado cambiado`);

    res.json({
      success: true,
      message: `POA ${activo ? 'activado' : 'desactivado'}`,
      data: poa
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
// 📤 ADMIN - Subir PDF
// ============================================
const uploadPDF = async (req, res) => {
  try {
    console.log('\n📄 [ADMIN] Subiendo PDF de POA...');
    console.log(`   👤 Usuario: ${req.user?.email}`);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ningún PDF'
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
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('❌ Error en uploadPDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir el PDF'
    });
  }
};

// ============================================
// 📊 ADMIN - Estadísticas
// ============================================
const getStats = async (req, res) => {
  try {
    console.log('\n📊 [ADMIN] Obteniendo estadísticas de POAs...');

    const [total, activos, publicados, enRevision, borradores] = await Promise.all([
      AuditoriaPOA.countDocuments(),
      AuditoriaPOA.countDocuments({ activo: true }),
      AuditoriaPOA.countDocuments({ estado: 'Publicado' }),
      AuditoriaPOA.countDocuments({ estado: 'En Revisión' }),
      AuditoriaPOA.countDocuments({ estado: 'Borrador' })
    ]);

    res.json({
      success: true,
      data: {
        total,
        activos,
        publicados,
        enRevision,
        borradores
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

// ============================================
// EXPORTAR
// ============================================
module.exports = {
  getPOAsPublic,
  getPOAsAdmin,
  getPOAById,
  createPOA,
  updatePOA,
  deletePOA,
  toggleActivo,
  uploadPDF,
  getStats
};