// src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================
// 🔥 LÍMITE GLOBAL DE ARCHIVOS: 350 MB
// ============================================
const MAX_FILE_SIZE = 350 * 1024 * 1024; // 350 MB en bytes

// ============================================
// Crear directorios si no existen
// ============================================
const uploadDirs = {
  images: 'uploads/images',
  documents: 'uploads/documents',
  legisladores: 'uploads/legisladores',
  content: 'uploads/content',
  comunicados: 'uploads/comunicados',
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Directorio creado: ${dir}`);
  }
});

// ============================================
// Configuración de almacenamiento
// ============================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('📂 Destination - req.baseUrl:', req.baseUrl);
    console.log('📂 Destination - file.mimetype:', file.mimetype);

    let folder = uploadDirs.images;

    // Detectar tipo de archivo por la ruta
    if (file.mimetype.startsWith('image/')) {
      folder = uploadDirs.images;
    } else if (file.mimetype === 'application/pdf') {
      folder = uploadDirs.documents;
    } else if (req.baseUrl && req.baseUrl.includes('legisladores')) {
      folder = uploadDirs.legisladores;
    } else if (req.baseUrl && req.baseUrl.includes('content')) {
      folder = uploadDirs.content;
    } else if (req.baseUrl && req.baseUrl.includes('comunicados')) {
      folder = uploadDirs.comunicados;
    }

    console.log('📂 Guardando en:', folder);
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .substring(0, 50);

    const filename = name + '-' + uniqueSuffix + ext;
    console.log('📄 Nombre de archivo:', filename);
    cb(null, filename);
  }
});

// ============================================
// Filtros de archivo
// ============================================

// ✅ Filtro mixto (imágenes + PDF)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf'
  ];

  console.log('🔍 FileFilter - tipo:', file.mimetype);

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, WEBP, GIF) y PDFs.'), false);
  }
};

// ✅ Filtro solo para imágenes
const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPEG, PNG, WEBP, GIF).'), false);
  }
};

// ✅ Filtro solo para PDFs
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF.'), false);
  }
};

// ============================================
// Instancias de multer
// ============================================

// Upload mixto (imágenes + PDF) - LÍMITE 350 MB
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    fieldSize: MAX_FILE_SIZE
  },
});

// Upload solo imágenes - LÍMITE 50 MB (las imágenes no necesitan más)
const uploadImage = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
    fieldSize: 50 * 1024 * 1024
  },
});

// 🔥 Upload solo PDFs - LÍMITE 350 MB
const uploadPDF = multer({
  storage: storage,
  fileFilter: pdfFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    fieldSize: MAX_FILE_SIZE
  },
});

// ============================================
// 🔥 MIDDLEWARE: Manejo de errores de Multer
// Envuelve a Multer para convertir errores en respuestas JSON con CORS
// ============================================
const handleMulterError = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (!err) return next();

      // Headers CORS manuales por si acaso
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');

      if (err instanceof multer.MulterError) {
        console.error('❌ [MulterError]', err.code, err.message);

        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            message: `El archivo excede el tamaño máximo permitido (${MAX_FILE_SIZE / 1024 / 1024} MB)`,
            code: 'FILE_TOO_LARGE'
          });
        }

        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Se excedió el número máximo de archivos',
            code: 'TOO_MANY_FILES'
          });
        }

        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: `Campo de archivo inesperado: ${err.field}`,
            code: 'UNEXPECTED_FIELD'
          });
        }

        return res.status(400).json({
          success: false,
          message: `Error al subir archivo: ${err.message}`,
          code: err.code
        });
      }

      // Error del fileFilter (tipo no permitido)
      console.error('❌ [FileFilter Error]', err.message);
      return res.status(400).json({
        success: false,
        message: err.message || 'Error al procesar el archivo',
        code: 'INVALID_FILE_TYPE'
      });
    });
  };
};

// ============================================
// Exportar
// ============================================
module.exports = {
  upload,
  uploadImage,
  uploadPDF,
  uploadDirs,
  MAX_FILE_SIZE,
  handleMulterError
};