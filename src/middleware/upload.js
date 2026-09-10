// src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// ✅ Filtro mixto (imágenes + PDF) - el que se usa por defecto
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

// Upload mixto (imágenes + PDF)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
    fieldSize: 50 * 1024 * 1024
  },
});

// Upload solo imágenes
const uploadImage = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    fieldSize: 10 * 1024 * 1024
  },
});

// Upload solo PDFs
const uploadPDF = multer({
  storage: storage,
  fileFilter: pdfFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
    fieldSize: 20 * 1024 * 1024
  },
});

// ============================================
// Exportar
// ============================================
module.exports = {
  upload,        // mixto (imágenes + PDF)
  uploadImage,   // solo imágenes
  uploadPDF,     // solo PDFs
  uploadDirs,
};