// src/scripts/importarMarcoNormativo.js
//
// Importa los documentos de Marco Normativo al modelo NUEVO (MarcoNormativo).
//
// ⚠️ NO toca DocumentoLegislativo ni los documentos ya existentes.
//    Solo crea registros en la colección `marconormativos`.
//
// USO:
//   node src/scripts/importarMarcoNormativo.js           → importa (salta los que ya existen)
//   node src/scripts/importarMarcoNormativo.js --dry-run  → solo muestra qué haría
//
// Los PDFs y portadas se buscan en:
//   /var/www/sen/uploads/documents/publicado en la web/MARCO NORMATIVO
//   /var/www/sen/uploads/documents/publicado en la web/MARCO NORMATIVO/portadas
// y se enlazan por nombre de archivo (no se copian), porque ya están en el servidor.

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const MarcoNormativo = require('../models/MarcoNormativo');

// ============================================
// CONFIGURACIÓN
// ============================================
const DRY_RUN = process.argv.includes('--dry-run');

const BACKEND_URL = process.env.BACKEND_URL || 'https://demoback.senado.gob.bo';

const PDFS_RAW_DIR =
  process.env.MARCO_NORMATIVO_DIR ||
  '/var/www/sen/uploads/documents/publicado en la web/MARCO NORMATIVO';
const IMAGENES_RAW_DIR = path.join(PDFS_RAW_DIR, 'portadas');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
const DOCS_DIR = path.join(UPLOADS_DIR, 'documents');
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');

// ============================================
// 📌 DESTACADOS (6 tarjetas superiores)
// ============================================
const DESTACADOS = [
  { orden: 1, nombre: 'Constitución Política del Estado Plurinacional de Bolivia', codigo: 'CONSTITUCIÓN POLÍTICA DEL ESTADO', gestion: 2009, archivo: 'Constitución Politica Del Estado Plurinacional de Bolivia.pdf', imagen: '1.jpg' },
  { orden: 2, nombre: 'Reglamento General de la Cámara de Senadores', codigo: 'REGLAMENTO GENERAL DE LA CÁMARA DE SENADORES', gestion: 2024, archivo: 'Reglamento General de la Cámara de Senadores.pdf', imagen: '2.jpg' },
  { orden: 3, nombre: 'Reglamento de Participación Ciudadana y Deliberación Pública', codigo: 'REGLAMENTO DE PARTICIPACIÓN CIUDADANA', gestion: 2012, archivo: 'Reglamento de Participación Ciudadana y Deliberación Pública.pdf', imagen: '3.jpg' },
  { orden: 4, nombre: 'Reglamento Específico de Homenajes Camarales', codigo: 'REGLAMENTO DE HOMENAJES CAMARALES', gestion: 2024, archivo: 'Reglamento Específico de Homenajes Camarales.pdf', imagen: '4.jpg' },
  { orden: 5, nombre: 'Reglamento de Condecoraciones', codigo: 'REGLAMENTO DE CONDECORACIONES', gestion: 2022, archivo: 'Reglamento de Condecoraciones.pdf', imagen: '5.jpg' },
  { orden: 6, nombre: 'Reglamento de Ética', codigo: 'REGLAMENTO DE ÉTICA', gestion: 2014, archivo: 'Reglamento de Ética.pdf', imagen: '6.jpg' }
];

// ============================================
// 📌 ACORDEÓN (16 documentos, categoría única)
// ============================================
const CATEGORIA_ACORDEON = 'Normativa Administrativa';

const ACORDEON = [
  { orden: 1,  nombre: 'Manual de Organización y Funciones', codigo: 'MANUAL DE ORGANIZACIÓN Y FUNCIONES', gestion: 2020, archivo: 'Manual de Organización y Funciones.pdf' },
  { orden: 2,  nombre: 'Reglamento Interno de Personal', codigo: 'REGLAMENTO INTERNO DE PERSONAL', gestion: 2020, archivo: 'Reglamento Interno de Personal.pdf' },
  { orden: 3,  nombre: 'Código de Ética', codigo: 'CÓDIGO DE ÉTICA', gestion: 2020, archivo: 'Código de Ética.pdf' },
  { orden: 4,  nombre: 'Reglamento Específico del Sistema Contabilidad Integrada', codigo: 'REGLAMENTO SISTEMA CONTABILIDAD INTEGRADA', gestion: 2020, archivo: 'Reglamento Específico del Sistema Contabilidad Integrada.pdf' },
  { orden: 5,  nombre: 'Reglamento Específico del Sistema de Administración de Personal', codigo: 'REGLAMENTO SISTEMA ADMINISTRACIÓN DE PERSONAL', gestion: 2020, archivo: 'Reglamento Específico del Sistema de Administración de Personal.pdf' },
  { orden: 6,  nombre: 'Reglamento Específico del Sistema de Organización Administrativa', codigo: 'REGLAMENTO SISTEMA ORGANIZACIÓN ADMINISTRATIVA', gestion: 2020, archivo: 'Reglamento Específico del Sistema de Organización Administrativa.pdf' },
  { orden: 7,  nombre: 'Reglamento Específico del Sistema de Programación de Operaciones', codigo: 'REGLAMENTO SISTEMA PROGRAMACIÓN DE OPERACIONES', gestion: 2020, archivo: 'Reglamento Específico del Sistema de Programación de Operaciones.pdf' },
  { orden: 8,  nombre: 'Reglamento Específico Sistema de Tesorería', codigo: 'REGLAMENTO SISTEMA DE TESORERÍA', gestion: 2020, archivo: 'Reglamento Específico Sistema de Tesorería.pdf' },
  { orden: 9,  nombre: 'Manual de Procesos y Procedimientos del Sistema de Presupuestos', codigo: 'MANUAL PROCESOS SISTEMA DE PRESUPUESTOS', gestion: 2020, archivo: 'Manual de Procesos y Procedimientos del Sistema de Presupuestos.pdf' },
  { orden: 10, nombre: 'Reglamento para el cumplimiento de Declaración Jurada de Bienes y Servicios', codigo: 'REGLAMENTO DECLARACIÓN JURADA DE BIENES', gestion: 2020, archivo: 'Reglamento para el cumplimiento de Declaración Jurada de Bienes y Servicios.pdf' },
  { orden: 11, nombre: 'Reglamento Específico del Sistema de Administración de Bienes y Servicios', codigo: 'REGLAMENTO SISTEMA ADMINISTRACIÓN DE BIENES Y SERVICIOS', gestion: 2020, archivo: 'Reglamento Específico del Sistema de Administración de Bienes y Servicios.pdf' },
  { orden: 12, nombre: 'Reglamento Específico del Sistema de Presupuestos', codigo: 'REGLAMENTO SISTEMA DE PRESUPUESTOS', gestion: 2020, archivo: 'Reglamento Específico del Sistema de Presupuestos.pdf' },
  { orden: 13, nombre: 'Reglamento Procesos Sumarios', codigo: 'REGLAMENTO PROCESOS SUMARIOS', gestion: 2026, archivo: 'REGLAMENTO PROCESOS SUMARIOS.pdf' },
  { orden: 14, nombre: 'Reglamento Interno Unidad de Transparencia y Lucha Contra la Corrupción', codigo: 'REGLAMENTO INTERNO UTLCC', gestion: 2025, archivo: 'Reglamento Interno UTLCC.pdf' },
  { orden: 15, nombre: 'Manual de Administración de Activos Fijos', codigo: 'MANUAL ADMINISTRACIÓN DE ACTIVOS FIJOS', gestion: 2020, archivo: 'Manual de Administración de Activos Fijos.pdf' },
  { orden: 16, nombre: 'Manual de Administración de Almacenes', codigo: 'MANUAL ADMINISTRACIÓN DE ALMACENES', gestion: 2020, archivo: 'Manual de Administración de Almacenes.pdf' }
];

// ============================================
// HELPERS
// ============================================
const slug = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);

/** Busca un archivo en un directorio de forma tolerante a tildes/espacios. */
function buscarArchivo(dir, nombre) {
  try {
    if (!fs.existsSync(dir)) return null;

    const exacto = path.join(dir, nombre);
    if (fs.existsSync(exacto)) return exacto;

    const objetivo = slug(nombre);
    const base = path.basename(nombre, path.extname(nombre));

    for (const f of fs.readdirSync(dir)) {
      const ext = path.extname(f);
      if (ext.toLowerCase() !== path.extname(nombre).toLowerCase()) continue;
      if (slug(path.basename(f, ext)) === objetivo) return path.join(dir, f);
      if (slug(path.basename(f, ext)).startsWith(slug(base))) return path.join(dir, f);
    }
    return null;
  } catch {
    return null;
  }
}

/** Si el PDF ya está en subidas, lo enlaza. Si no, lo copia desde el origen. */
function resolverPDF(nombre) {
  const enDestino = buscarArchivo(DOCS_DIR, nombre);
  if (enDestino) {
    return {
      url: `${BACKEND_URL}/uploads/documents/${path.basename(enDestino)}`,
      filename: path.basename(enDestino),
      originalName: nombre,
      size: fs.statSync(enDestino).size
    };
  }

  const enOrigen = buscarArchivo(PDFS_RAW_DIR, nombre);
  if (!enOrigen) return null;

  const ext = path.extname(enOrigen);
  const nuevoNombre = `marco-${slug(path.basename(nombre, ext))}-${Date.now()}${ext}`;

  if (!DRY_RUN) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
    fs.copyFileSync(enOrigen, path.join(DOCS_DIR, nuevoNombre));
  }

  return {
    url: `${BACKEND_URL}/uploads/documents/${nuevoNombre}`,
    filename: nuevoNombre,
    originalName: nombre,
    size: fs.statSync(enOrigen).size
  };
}

/** Resuelve la portada y devuelve su URL absoluta. */
function resolverImagen(nombre) {
  const enDestino = buscarArchivo(IMAGES_DIR, nombre);
  if (enDestino) {
    return `${BACKEND_URL}/uploads/images/${path.basename(enDestino)}`;
  }

  const enOrigen = buscarArchivo(IMAGENES_RAW_DIR, nombre);
  if (!enOrigen) return null;

  const ext = path.extname(enOrigen);
  const nuevoNombre = `marco-portada-${slug(path.basename(nombre, ext))}-${Date.now()}${ext}`;

  if (!DRY_RUN) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    fs.copyFileSync(enOrigen, path.join(IMAGES_DIR, nuevoNombre));
  }

  return `${BACKEND_URL}/uploads/images/${nuevoNombre}`;
}

async function insertar({ item, categoria, destacado, etiqueta }) {
  const existente = await MarcoNormativo.findOne({ codigo: item.codigo });
  if (existente) {
    console.log(`   ⏭️  Saltando: ${item.codigo} (ya existe)`);
    return { insertado: false, saltado: true };
  }

  const archivo = resolverPDF(item.archivo);
  const imagen = destacado ? resolverImagen(item.imagen) : null;

  if (!archivo) {
    console.log(`   ⚠️  Sin PDF, se omite: ${item.codigo} (buscado: ${item.archivo})`);
    return { insertado: false, saltado: false };
  }
  if (destacado && !imagen) {
    console.log(`   ⚠️  Sin portada, se omite: ${item.codigo} (buscado: ${item.imagen})`);
    return { insertado: false, saltado: false };
  }

  console.log(
    `   ${DRY_RUN ? '🔎' : '✅'} ${etiqueta} ${item.orden}. ${item.nombre}` +
      (destacado ? ' [con portada]' : '')
  );

  if (DRY_RUN) return { insertado: true, saltado: false };

  await MarcoNormativo.create({
    nombre: item.nombre,
    codigo: item.codigo,
    gestion: item.gestion ?? null,
    fechaDocumento: item.gestion ? new Date(`${item.gestion}-01-01`) : null,
    categoria: categoria,
    destacado: Boolean(destacado),
    orden: item.orden,
    imagen: imagen,
    archivo: archivo
  });

  return { insertado: true, saltado: false };
}

// ============================================
// MAIN
// ============================================
async function run() {
  console.log('\n' + '═'.repeat(64));
  console.log('📚 IMPORTACIÓN DE MARCO NORMATIVO (modelo Independiente)');
  console.log('═'.repeat(64));
  console.log(`   Destino          : colección "marconormativos"`);
  console.log(`   PDFs origen      : ${PDFS_RAW_DIR}`);
  console.log(`   Portadas origen  : ${IMAGENES_RAW_DIR}`);
  console.log(`   BACKEND_URL      : ${BACKEND_URL}`);
  console.log(`   Modo             : ${DRY_RUN ? 'DRY-RUN (no escribe nada)' : 'ESCRITURA'}`);
  console.log('═'.repeat(64) + '\n');

  let insertados = 0;
  let saltados = 0;
  let fallidos = 0;

  try {
    if (!DRY_RUN) {
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        console.error('❌ MONGODB_URI no definida en .env');
        process.exit(1);
      }
      await mongoose.connect(uri);
      console.log('🔌 Conectado a MongoDB\n');
    }

    console.log('🟦 DESTACADOS (tarjetas superiores)');
    for (const item of DESTACADOS) {
      const r = await insertar({
        item,
        categoria: null,
        destacado: true,
        etiqueta: 'Tarjeta'
      });
      if (r.insertado) insertados++;
      else if (r.saltado) saltados++;
      else fallidos++;
    }

    console.log(`\n🟦 ACORDEÓN — categoría "${CATEGORIA_ACORDEON}"`);
    for (const item of ACORDEON) {
      const r = await insertar({
        item,
        categoria: CATEGORIA_ACORDEON,
        destacado: false,
        etiqueta: 'Fila   '
      });
      if (r.insertado) insertados++;
      else if (r.saltado) saltados++;
      else fallidos++;
    }

    console.log('\n' + '═'.repeat(64));
    console.log(`📊 RESUMEN → insertados: ${insertados} | ya existían: ${saltados} | fallidos: ${fallidos}`);
    if (DRY_RUN) {
      console.log('   (DRY-RUN: no se escribió nada. Ejecuta sin --dry-run para aplicar)');
    }
    console.log('═'.repeat(64) + '\n');

    if (!DRY_RUN) await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fatal:', error);
    if (!DRY_RUN) await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

run();
