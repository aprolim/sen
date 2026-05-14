// backend/src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorios si no existen
const uploadDirs = {
  images: 'uploads/images',
  documents: 'uploads/documents',
  legisladores: 'uploads/legisladores',
  content: 'uploads/content',
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Directorio creado: ${dir}`);
  }
});

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('📂 Destination - req.baseUrl:', req.baseUrl);
    console.log('📂 Destination - file.mimetype:', file.mimetype);
    
    let folder = 'uploads/images';
    
    if (file.mimetype.startsWith('image/')) {
      folder = uploadDirs.images;
    } else if (file.mimetype === 'application/pdf') {
      folder = uploadDirs.documents;
    } else if (req.baseUrl && req.baseUrl.includes('legisladores')) {
      folder = uploadDirs.legisladores;
    } else if (req.baseUrl && req.baseUrl.includes('content')) {
      folder = uploadDirs.content;
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

// Filtrar tipos de archivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];
  
  console.log('🔍 FileFilter - tipo:', file.mimetype);
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, WEBP, GIF).'), false);
  }
};

// Configurar multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

module.exports = {
  upload,
  uploadDirs,
};