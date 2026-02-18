const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

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
  }
});

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'uploads/';
    
    if (file.mimetype.startsWith('image/')) {
      folder = uploadDirs.images;
    } else if (file.mimetype === 'application/pdf') {
      folder = uploadDirs.documents;
    } else if (req.baseUrl.includes('legisladores')) {
      folder = uploadDirs.legisladores;
    } else if (req.baseUrl.includes('content')) {
      folder = uploadDirs.content;
    }
    
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .substring(0, 50);
    
    cb(null, name + '-' + uniqueSuffix + ext);
  }
});

// Filtrar tipos de archivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/webp': true,
    'image/gif': true,
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
  };
  
  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes y documentos PDF/DOC.'), false);
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

// Procesador de imágenes
const processImage = async (filePath, options = {}) => {
  try {
    const {
      width = 1200,
      height,
      quality = 80,
      format = 'webp'
    } = options;
    
    const outputPath = filePath.replace(/\.[^/.]+$/, '') + `.${format}`;
    
    let processor = sharp(filePath);
    
    if (width || height) {
      processor = processor.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    if (format === 'webp') {
      processor = processor.webp({ quality });
    } else if (format === 'jpeg') {
      processor = processor.jpeg({ quality });
    } else if (format === 'png') {
      processor = processor.png({ quality });
    }
    
    await processor.toFile(outputPath);
    
    // Eliminar archivo original si se convirtió
    if (format !== path.extname(filePath).replace('.', '')) {
      fs.unlinkSync(filePath);
    }
    
    return path.basename(outputPath);
  } catch (error) {
    console.error('Error procesando imagen:', error);
    return path.basename(filePath);
  }
};

// Generar thumbnails
const generateThumbnails = async (filePath) => {
  const baseName = path.basename(filePath, path.extname(filePath));
  const dirName = path.dirname(filePath);
  
  const sizes = [
    { name: 'thumbnail', width: 150, height: 150 },
    { name: 'small', width: 300 },
    { name: 'medium', width: 600 },
    { name: 'large', width: 1200 },
  ];
  
  const thumbnails = {};
  
  for (const size of sizes) {
    const outputPath = path.join(dirName, `${baseName}-${size.name}.webp`);
    
    await sharp(filePath)
      .resize(size.width, size.height, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 })
      .toFile(outputPath);
    
    thumbnails[size.name] = path.basename(outputPath);
  }
  
  return thumbnails;
};

module.exports = {
  upload,
  processImage,
  generateThumbnails,
  uploadDirs,
};