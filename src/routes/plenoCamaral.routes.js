// src/routes/plenoCamaral.routes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const controller = require('../controllers/plenoCamaral.controller');
const { authenticate, authorize } = require('../middleware/auth');

console.log('✅ Cargando rutas de Pleno Camaral...');

// ============================================
// 📤 MULTER: almacenamiento temporal
//
// La foto se guarda primero en uploads/tmp y el controlador la mueve
// a public/senadores/... con el nombre definitivo.
// ============================================
const TMP_DIR = path.join(__dirname, '..', '..', 'uploads', 'tmp');
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

const imageFilter = (req, file, cb) => {
  const permitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (permitidos.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Solo se permiten imágenes (JPEG, PNG, WEBP, GIF).'), false);
};

const uploadTemp = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, TMP_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.png';
      cb(null, `tmp-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
  }),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB para una foto
});

// Envuelve multer para devolver JSON ante errores
const handleUpload = (req, res, next) => {
  uploadTemp.single('foto')(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'La imagen excede el máximo de 10 MB'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Error al subir la imagen: ${err.message}`
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || 'Error al procesar la imagen'
    });
  });
};

// ============================================
// 🔒 TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================
router.use(authenticate);

// Resumen
router.get(
  '/resumen',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  controller.getResumen
);

// Listado
router.get(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  controller.getSenadores
);

// Foto: va antes de '/:id' para no colisionar
router.post(
  '/:id/foto',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  handleUpload,
  controller.uploadFoto
);

router.delete(
  '/:id/foto',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  controller.eliminarFoto
);

// Detalle y actualización
router.get(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  controller.getSenadorById
);

router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  controller.updateSenador
);

console.log('✅ Rutas de Pleno Camaral configuradas');

module.exports = router;
