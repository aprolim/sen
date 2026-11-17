// src/scripts/importarMarcoNormativoDestacados.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const DocumentoLegislativo = require('../models/DocumentoLegislativo');
const User = require('../models/User');

// ============================================
// 🔥 CONFIGURACIÓN DE RUTAS (AJUSTA SI ES NECESARIO)
// ============================================
// Ruta donde están tus PDFs originales de Marco Normativo
const PDFS_RAW_DIR = "/var/www/sen/uploads/documents/publicado en la web/MARCO NORMATIVO"; 
// Ruta donde están las 6 imágenes (1.jpg, 2.jpg, etc.)
const IMAGENES_RAW_DIR = "/var/www/sen/uploads/documents/publicado en la web/MARCO NORMATIVO/portadas"; 

const PDFS_FINAL_DIR = path.join(__dirname, '..', '..', 'uploads', 'documents');
const BACKEND_URL = 'https://demoback.senado.gob.bo';

// ============================================
// DATA EXACTA DE TUS 6 DESTACADOS
// ============================================
const DATA = [
  { orden: 1, numero: 1001, codigo: 'CONSTITUCIÓN POLÍTICA DEL ESTADO', asunto: 'Constitución Política del Estado Plurinacional de Bolivia', fecha: '2009-02-07', archivo: 'Constitución Politica Del Estado Plurinacional de Bolivia.pdf', imagen: '1.jpg' },
  { orden: 2, numero: 1002, codigo: 'REGLAMENTO GENERAL DE LA CÁMARA DE SENADORES', asunto: 'Reglamento General de la Cámara de Senadores', fecha: '2024-01-01', archivo: 'Reglamento General de la Cámara de Senadores.pdf', imagen: '2.jpg' },
  { orden: 3, numero: 1003, codigo: 'REGLAMENTO DE PARTICIPACIÓN CIUDADANA', asunto: 'Reglamento de Participación Ciudadana y Deliberación Pública', fecha: '2012-01-01', archivo: 'Reglamento de Participación Ciudadana y Deliberación Pública.pdf', imagen: '3.jpg' },
  { orden: 4, numero: 1004, codigo: 'REGLAMENTO DE HOMENAJES CAMARALES', asunto: 'Reglamento Específico de Homenajes Camarales', fecha: '2024-01-01', archivo: 'Reglamento Específico de Homenajes Camarales.pdf', imagen: '4.jpg' },
  { orden: 5, numero: 1005, codigo: 'REGLAMENTO DE CONDECORACIONES', asunto: 'Reglamento de Condecoraciones', fecha: '2022-01-01', archivo: 'Reglamento de Condecoraciones.pdf', imagen: '5.jpg' },
  { orden: 6, numero: 1006, codigo: 'REGLAMENTO DE ÉTICA', asunto: 'Reglamento de Ética', fecha: '2014-01-01', archivo: 'Reglamento de Ética.pdf', imagen: '6.jpg' }
];

// Helper para copiar archivos
function copiarArchivo(origenDir, nombre, prefijo) {
  try {
    const origen = path.join(origenDir, nombre);
    if (!fs.existsSync(origen)) {
      console.log(`   ⚠️ No se encontró: ${nombre}`);
      return null;
    }
    const ext = path.extname(nombre);
    const base = path.basename(nombre, ext).toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
    const nuevoNombre = `${prefijo}-${base}-${Date.now()}${ext}`;
    const destino = path.join(PDFS_FINAL_DIR, nuevoNombre);
    fs.copyFileSync(origen, destino);
    return { nombre: nuevoNombre, size: fs.statSync(destino).size };
  } catch (e) {
    console.error(`   ❌ Error copiando ${nombre}:`, e.message);
    return null;
  }
}

async function run() {
  console.log('\n' + '═'.repeat(60));
  console.log('📚 IMPORTANDO 6 DESTACADOS DEL MARCO NORMATIVO');
  console.log('═'.repeat(60) + '\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    const admin = await User.findOne({ role: 'SUPER_ADMIN' }) || await User.findOne({ role: 'ADMIN' });
    if (!admin) { console.error('❌ No hay usuario admin.'); process.exit(1); }

    for (const d of DATA) {
      const existe = await DocumentoLegislativo.findOne({ codigo: d.codigo });
      if (existe) {
        console.log(`   ⏭️ Saltando: ${d.codigo} (ya existe)`);
        continue;
      }

      const pdf = copiarArchivo(PDFS_RAW_DIR, d.archivo, 'doc');
      const img = copiarArchivo(IMAGENES_RAW_DIR, d.imagen, 'portada');

      await DocumentoLegislativo.create({
        tipo: 'proyecto-ley-aprobados', // Tipo asignado para destacados
        numero: d.numero,
        codigo: d.codigo,
        asunto: d.asunto,
        fechaIngreso: new Date(d.fecha),
        fechaAprobacion: new Date(d.fecha),
        fechaRemisionDiputados: new Date(d.fecha),
        estadoLey: 'APROBADO',
        peticionario: ['Cámara de Senadores'],
        orden: d.orden,
        imagen: img ? `${BACKEND_URL}/uploads/documents/${img.nombre}` : null,
        archivo: pdf ? { url: `${BACKEND_URL}/uploads/documents/${pdf.nombre}`, filename: pdf.nombre, originalName: d.archivo, size: pdf.size } : null,
        creadoPor: admin._id,
        actualizadoPor: admin._id
      });

      console.log(`   ✅ Insertado: ${d.codigo} [Orden ${d.orden}] ${img ? '🖼️ [Con Imagen]' : '❌ [Sin Imagen]'}`);
    }

    console.log('\n✅ COMPLETADO\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

run();