// src/controllers/auditoria.controller.js
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const AuditoriaCategoria = require('../models/AuditoriaCategoria');
const AuditoriaDocumento = require('../models/AuditoriaDocumento');
const AuditoriaPOA = require('../models/AuditoriaPOA');

// ============================================
// CONSTANTES
// ============================================
const MODULOS_VALIDOS = ['poa-uai', 'auditorias-ejecutadas', 'informes-actividades', 'otras-actividades'];
const MODULOS_CON_CATEGORIAS = ['auditorias-ejecutadas', 'informes-actividades', 'otras-actividades'];

const validarModulo = (modulo) => MODULOS_VALIDOS.includes(modulo);
const esModuloConCategorias = (modulo) => MODULOS_CON_CATEGORIAS.includes(modulo);

// ============================================
// 📡 PÚBLICO - Listar documentos + categorías
// ============================================
const getDocumentosPublicos = async (req, res) => {
  try {
    const { modulo } = req.params;

    console.log(`\n📂 [PUBLICO] Obteniendo documentos del módulo: ${modulo}`);

    if (!validarModulo(modulo)) {
      return res.status(400).json({
        success: false,
        message: `Módulo inválido: ${modulo}`
      });
    }

    // ============================================
    // 🔥 CASO ESPECIAL: POA-UAI (sin categorías)
    // ============================================
    if (modulo === 'poa-uai') {
      const poas = await AuditoriaPOA.find({ estado: { $ne: 'Borrador' } })
        .sort({ anio: -1 })
        .lean();

      console.log(`   ✅ ${poas.length} POAs encontrados`);

      return res.json({
        success: true,
        data: {
          categorias: [],
          documentos: poas
        }
      });
    }

    // ============================================
    // MÓDULOS CON CATEGORÍAS/TABS
    // ============================================
    const [categorias, documentos] = await Promise.all([
      AuditoriaCategoria.find({ modulo, activo: true })
        .sort({ orden: 1 })
        .lean(),
      AuditoriaDocumento.find({ modulo, activo: true })
        .sort({ gestion: -1, orden: 1 })
        .lean()
    ]);

    console.log(`   ✅ ${categorias.length} categorías, ${documentos.length} documentos`);

    res.json({
      success: true,
      data: {
        categorias: categorias.map(c => ({
          key: c.key,
          nombre: c.nombre,
          icono: c.icono
        })),
        documentos: documentos.map(d => ({
          id: d._id,
          titulo: d.titulo,
          descripcion: d.descripcion,
          gestion: d.gestion,
          url: d.url,
          categoria: d.categoria,
          estado: d.estado
        }))
      }
    });

  } catch (error) {
    console.error(`❌ Error en getDocumentosPublicos:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos'
    });
  }
};

// ============================================
// 🔐 ADMIN - Listar documentos (con inactivos)
// ============================================
const getDocumentosAdmin = async (req, res) => {
  try {
    const { modulo } = req.params;
    const { categoria, gestion, search, incluirInactivos } = req.query;

    console.log(`\n📂 [ADMIN] Obteniendo documentos de: ${modulo}`);

    if (!validarModulo(modulo)) {
      return res.status(400).json({ success: false, message: 'Módulo inválido' });
    }

    if (modulo === 'poa-uai') {
      const poas = await AuditoriaPOA.find({})
        .sort({ anio: -1 })
        .populate('creadoPor', 'email profile')
        .populate('actualizadoPor', 'email profile')
        .lean();

      return res.json({
        success: true,
        data: { documentos: poas, total: poas.length }
      });
    }

    const filters = { modulo };
    if (incluirInactivos !== 'true') filters.activo = true;
    if (categoria && categoria !== 'todas') filters.categoria = categoria;
    if (gestion) filters.gestion = parseInt(gestion);
    if (search) {
      filters.$or = [
        { titulo: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } }
      ];
    }

    const documentos = await AuditoriaDocumento.find(filters)
      .sort({ gestion: -1, orden: 1 })
      .populate('creadoPor', 'email profile')
      .populate('actualizadoPor', 'email profile')
      .lean();

    res.json({
      success: true,
      data: { documentos, total: documentos.length }
    });

  } catch (error) {
    console.error(`❌ Error en getDocumentosAdmin:`, error);
    res.status(500).json({ success: false, message: 'Error al obtener documentos' });
  }
};

// ============================================
// 🔐 ADMIN - Obtener documento por ID
// ============================================
const getDocumentoById = async (req, res) => {
  try {
    const { modulo, id } = req.params;

    if (!validarModulo(modulo)) {
      return res.status(400).json({ success: false, message: 'Módulo inválido' });
    }

    const Model = modulo === 'poa-uai' ? AuditoriaPOA : AuditoriaDocumento;
    const documento = await Model.findById(id)
      .populate('creadoPor', 'email profile')
      .populate('actualizadoPor', 'email profile');

    if (!documento) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    }

    res.json({ success: true, data: documento });
  } catch (error) {
    console.error(`❌ Error en getDocumentoById:`, error);
    res.status(500).json({ success: false, message: 'Error al obtener documento' });
  }
};

// ============================================
// 🔐 ADMIN - Crear documento
// ============================================
const createDocumento = async (req, res) => {
  try {
    const { modulo } = req.params;

    console.log(`\n➕ [ADMIN] Creando documento en: ${modulo}`);
    console.log(`   👤 Usuario: ${req.user.email}`);

    if (!validarModulo(modulo)) {
      return res.status(400).json({ success: false, message: 'Módulo inválido' });
    }

    // POA-UAI
    if (modulo === 'poa-uai') {
      const { anio, titulo, fecha, estado, activo, pdfUrl } = req.body;

      if (!anio) {
        return res.status(400).json({ success: false, message: 'El año es requerido' });
      }

      const existe = await AuditoriaPOA.findOne({ anio });
      if (existe) {
        return res.status(400).json({ success: false, message: `Ya existe un POA para el año ${anio}` });
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
      return res.status(201).json({ success: true, message: 'POA creado exitosamente', data: poa });
    }

    // MÓDULOS CON CATEGORÍAS
    const { categoria, titulo, descripcion, gestion, url, estado, activo, orden } = req.body;

    if (!categoria || !titulo || !gestion) {
      return res.status(400).json({
        success: false,
        message: 'Categoría, título y gestión son requeridos'
      });
    }

    const categoriaExiste = await AuditoriaCategoria.findOne({ modulo, key: categoria, activo: true });
    if (!categoriaExiste) {
      return res.status(400).json({
        success: false,
        message: `La categoría "${categoria}" no existe en el módulo ${modulo}`
      });
    }

    const documento = new AuditoriaDocumento({
      modulo,
      categoria,
      titulo,
      descripcion: descripcion || '',
      gestion,
      url: url || null,
      estado: estado || 'Publicado',
      activo: activo !== undefined ? activo : true,
      orden: orden || 0,
      creadoPor: req.user._id,
      actualizadoPor: req.user._id
    });

    await documento.save();
    res.status(201).json({ success: true, message: 'Documento creado exitosamente', data: documento });

  } catch (error) {
    console.error(`❌ Error en createDocumento:`, error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================
// 🔐 ADMIN - Actualizar documento
// ============================================
const updateDocumento = async (req, res) => {
  try {
    const { modulo, id } = req.params;

    console.log(`\n✏️ [ADMIN] Actualizando documento: ${id} en ${modulo}`);

    if (!validarModulo(modulo)) {
      return res.status(400).json({ success: false, message: 'Módulo inválido' });
    }

    const Model = modulo === 'poa-uai' ? AuditoriaPOA : AuditoriaDocumento;
    const documento = await Model.findById(id);

    if (!documento) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    }

    const allowedFields = modulo === 'poa-uai'
      ? ['anio', 'titulo', 'fecha', 'estado', 'activo', 'pdfUrl']
      : ['categoria', 'titulo', 'descripcion', 'gestion', 'url', 'estado', 'activo', 'orden'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        documento[field] = req.body[field];
      }
    });

    documento.actualizadoPor = req.user._id;
    await documento.save();

    res.json({ success: true, message: 'Documento actualizado exitosamente', data: documento });

  } catch (error) {
    console.error(`❌ Error en updateDocumento:`, error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================
// 🔐 ADMIN - Eliminar documento
// ============================================
const deleteDocumento = async (req, res) => {
  try {
    const { modulo, id } = req.params;

    console.log(`\n🗑️ [ADMIN] Eliminando documento: ${id} en ${modulo}`);

    if (!validarModulo(modulo)) {
      return res.status(400).json({ success: false, message: 'Módulo inválido' });
    }

    const Model = modulo === 'poa-uai' ? AuditoriaPOA : AuditoriaDocumento;
    const documento = await Model.findByIdAndDelete(id);

    if (!documento) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    }

    res.json({ success: true, message: 'Documento eliminado exitosamente' });

  } catch (error) {
    console.error(`❌ Error en deleteDocumento:`, error);
    res.status(500).json({ success: false, message: 'Error al eliminar documento' });
  }
};

// ============================================
// 🔐 ADMIN - CATEGORÍAS
// ============================================
const getCategorias = async (req, res) => {
  try {
    const { modulo } = req.params;
    const { incluirInactivos } = req.query;

    if (!esModuloConCategorias(modulo)) {
      return res.status(400).json({ success: false, message: 'Módulo no soporta categorías' });
    }

    const filters = { modulo };
    if (incluirInactivos !== 'true') filters.activo = true;

    const categorias = await AuditoriaCategoria.find(filters)
      .sort({ orden: 1 })
      .lean();

    const categoriasConCount = await Promise.all(
      categorias.map(async (cat) => {
        const count = await AuditoriaDocumento.countDocuments({
          modulo,
          categoria: cat.key,
          activo: true
        });
        return { ...cat, documentosCount: count };
      })
    );

    res.json({ success: true, data: categoriasConCount });
  } catch (error) {
    console.error(`❌ Error en getCategorias:`, error);
    res.status(500).json({ success: false, message: 'Error al obtener categorías' });
  }
};

const createCategoria = async (req, res) => {
  try {
    const { modulo } = req.params;
    const { key, nombre, icono, orden } = req.body;

    console.log(`\n➕ [ADMIN] Creando categoría en: ${modulo}`);

    if (!esModuloConCategorias(modulo)) {
      return res.status(400).json({ success: false, message: 'Módulo no soporta categorías' });
    }

    if (!key || !nombre) {
      return res.status(400).json({ success: false, message: 'Key y nombre son requeridos' });
    }

    const existe = await AuditoriaCategoria.findOne({ modulo, key });
    if (existe) {
      return res.status(400).json({ success: false, message: `Ya existe la categoría "${key}" en este módulo` });
    }

    const categoria = new AuditoriaCategoria({
      modulo,
      key,
      nombre,
      icono: icono || 'mdi:file-document',
      orden: orden || 0,
      creadoPor: req.user._id,
      actualizadoPor: req.user._id
    });

    await categoria.save();
    res.status(201).json({ success: true, message: 'Categoría creada exitosamente', data: categoria });

  } catch (error) {
    console.error(`❌ Error en createCategoria:`, error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateCategoria = async (req, res) => {
  try {
    const { modulo, key } = req.params;

    console.log(`\n✏️ [ADMIN] Actualizando categoría: ${key} en ${modulo}`);

    if (!esModuloConCategorias(modulo)) {
      return res.status(400).json({ success: false, message: 'Módulo no soporta categorías' });
    }

    const categoria = await AuditoriaCategoria.findOne({ modulo, key });
    if (!categoria) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }

    const allowedFields = ['nombre', 'icono', 'orden', 'activo'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        categoria[field] = req.body[field];
      }
    });

    categoria.actualizadoPor = req.user._id;
    await categoria.save();

    res.json({ success: true, message: 'Categoría actualizada', data: categoria });

  } catch (error) {
    console.error(`❌ Error en updateCategoria:`, error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteCategoria = async (req, res) => {
  try {
    const { modulo, key } = req.params;

    console.log(`\n🗑️ [ADMIN] Eliminando categoría: ${key} en ${modulo}`);

    if (!esModuloConCategorias(modulo)) {
      return res.status(400).json({ success: false, message: 'Módulo no soporta categorías' });
    }

    const docsCount = await AuditoriaDocumento.countDocuments({
      modulo,
      categoria: key,
      activo: true
    });

    if (docsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar: ${docsCount} documentos activos usan esta categoría`
      });
    }

    const categoria = await AuditoriaCategoria.findOneAndUpdate(
      { modulo, key },
      { activo: false, actualizadoPor: req.user._id },
      { new: true }
    );

    if (!categoria) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }

    res.json({ success: true, message: 'Categoría desactivada exitosamente' });

  } catch (error) {
    console.error(`❌ Error en deleteCategoria:`, error);
    res.status(500).json({ success: false, message: 'Error al eliminar categoría' });
  }
};

// ============================================
// 📤 ADMIN - Subir PDF (para cualquier módulo)
// ============================================
const uploadPDF = async (req, res) => {
  try {
    console.log('\n📄 [ADMIN] Subiendo PDF de auditoría...');
    console.log(`   👤 Usuario: ${req.user?.email}`);
    console.log(`   📦 Archivo: ${req.file?.originalname}`);
    console.log(`   📊 Tamaño: ${req.file ? (req.file.size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}`);

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

    // Headers CORS manuales
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
// 📊 ADMIN - Estadísticas
// ============================================
const getStats = async (req, res) => {
  try {
    const { modulo } = req.params;

    if (!validarModulo(modulo)) {
      return res.status(400).json({ success: false, message: 'Módulo inválido' });
    }

    if (modulo === 'poa-uai') {
      const [total, activos, publicados, enRevision, borradores] = await Promise.all([
        AuditoriaPOA.countDocuments(),
        AuditoriaPOA.countDocuments({ activo: true }),
        AuditoriaPOA.countDocuments({ estado: 'Publicado' }),
        AuditoriaPOA.countDocuments({ estado: 'En Revisión' }),
        AuditoriaPOA.countDocuments({ estado: 'Borrador' })
      ]);
      return res.json({ success: true, data: { total, activos, publicados, enRevision, borradores } });
    }

    const [total, categorias, publicados, enRevision, migrados] = await Promise.all([
      AuditoriaDocumento.countDocuments({ modulo, activo: true }),
      AuditoriaCategoria.countDocuments({ modulo, activo: true }),
      AuditoriaDocumento.countDocuments({ modulo, activo: true, estado: 'Publicado' }),
      AuditoriaDocumento.countDocuments({ modulo, activo: true, estado: 'En Revisión' }),
      AuditoriaDocumento.countDocuments({ modulo, activo: true, migrado: true })
    ]);

    res.json({ success: true, data: { total, categorias, publicados, enRevision, migrados } });

  } catch (error) {
    console.error(`❌ Error en getStats:`, error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
};

// ============================================
// 🔥 ADMIN - Migrar PDFs externos al backend
// ============================================
const migrarPDFs = async (req, res) => {
  try {
    console.log('\n🚚 [ADMIN] Iniciando migración de PDFs...');

    const documentos = await AuditoriaDocumento.find({
      migrado: false,
      url: { $ne: null }
    });

    console.log(`   📊 ${documentos.length} documentos pendientes de migrar`);

    const resultados = {
      total: documentos.length,
      migrados: 0,
      fallidos: 0,
      omitidos: 0,
      detalles: []
    };

    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'documents');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    for (const doc of documentos) {
      // Si la URL ya es local, marcarlo como migrado
      if (doc.url && doc.url.includes('demoback.senado.gob.bo')) {
        doc.migrado = true;
        await doc.save();
        resultados.omitidos++;
        resultados.detalles.push({ titulo: doc.titulo, status: 'ya_local' });
        continue;
      }

      try {
        // Descargar el PDF desde la URL original
        const fileName = `auditoria-${doc.modulo}-${doc._id}-${Date.now()}.pdf`;
        const filePath = path.join(uploadsDir, fileName);

        await downloadFile(doc.url, filePath);

        // Actualizar el documento con la nueva URL
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        doc.urlOriginal = doc.urlOriginal || doc.url;
        doc.url = `${baseUrl}/uploads/documents/${fileName}`;
        doc.migrado = true;
        await doc.save();

        resultados.migrados++;
        resultados.detalles.push({ titulo: doc.titulo, status: 'migrado' });
        console.log(`   ✅ Migrado: ${doc.titulo}`);
      } catch (err) {
        console.error(`   ❌ Falló: ${doc.titulo} — ${err.message}`);
        doc.migrado = true; // Marcamos para no reintentar
        doc.estado = 'En Revisión';
        await doc.save();
        resultados.fallidos++;
        resultados.detalles.push({ titulo: doc.titulo, status: 'fallido', error: err.message });
      }
    }

    console.log(`\n   ✅ Migración completada: ${resultados.migrados} OK, ${resultados.fallidos} fallidos, ${resultados.omitidos} omitidos`);

    res.json({
      success: true,
      message: 'Migración completada',
      data: resultados
    });

  } catch (error) {
    console.error('❌ Error en migrarPDFs:', error);
    res.status(500).json({ success: false, message: 'Error en la migración' });
  }
};

/**
 * Helper: Descarga un archivo de una URL a un path local
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    const request = client.get(url, (response) => {
      // Seguir redirecciones
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode}`));
      }

      const file = fs.createWriteStream(dest);
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });

      file.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    });

    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Timeout de descarga'));
    });
  });
}

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
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  uploadPDF,
  getStats,
  migrarPDFs
};