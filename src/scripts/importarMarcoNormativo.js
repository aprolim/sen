// src/scripts/importarMarcoNormativo.js
//
// Importa los documentos de Marco Normativo al modelo MarcoNormativo.
//
// ⚠️ NO toca DocumentoLegislativo. Solo inserta en la colección `marconormativos`.
// ⚠️ NO borra nada. Solo lee archivos y hace `create`.
//
// Los PDFs y portadas viven en:
//   <backend>/public/marco-normativo/pdfs/{legislativa,administrativa,interna,transparencia}/
//   <backend>/public/marco-normativo/portadas/1..6.jpg
// y se sirven por Express en  /public/marco-normativo/...
//
// USO:
//   node src/scripts/importarMarcoNormativo.js --dry-run   → no conecta a Mongo ni escribe
//   node src/scripts/importarMarcoNormativo.js             → importa de verdad

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

// Carpeta estática servida por Express en /public
const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public', 'marco-normativo');
const PDFS_DIR = path.join(PUBLIC_DIR, 'pdfs');
const PORTADAS_DIR = path.join(PUBLIC_DIR, 'portadas');

// Prefijo público para construir las URLs
const PUBLIC_PREFIX = '/public/marco-normativo';

// ============================================
// 📌 DESTACADOS (6 tarjetas superiores) — con portada
// ============================================
const DESTACADOS = [
  { orden: 1, carpeta: 'legislativa', nombre: 'Constitución Política del Estado Plurinacional de Bolivia', codigo: 'CONSTITUCIÓN POLÍTICA DEL ESTADO', gestion: 2009, archivo: 'Constitución Politica Del Estado Plurinacional de Bolivia.pdf', imagen: '1.jpg' },
  { orden: 2, carpeta: 'legislativa', nombre: 'Reglamento General de la Cámara de Senadores', codigo: 'REGLAMENTO GENERAL DE LA CÁMARA DE SENADORES', gestion: 2024, archivo: 'Reglamento General de la Cámara de Senadores.pdf', imagen: '2.jpg' },
  { orden: 3, carpeta: 'legislativa', nombre: 'Reglamento de Participación Ciudadana y Deliberación Pública', codigo: 'REGLAMENTO DE PARTICIPACIÓN CIUDADANA', gestion: 2012, archivo: 'Reglamento de Participación Ciudadana y Deliberación Pública.pdf', imagen: '3.jpg' },
  { orden: 4, carpeta: 'legislativa', nombre: 'Reglamento Específico de Homenajes Camarales', codigo: 'REGLAMENTO DE HOMENAJES CAMARALES', gestion: 2024, archivo: 'Reglamento Específico de Homenajes Camarales.pdf', imagen: '4.jpg' },
  { orden: 5, carpeta: 'legislativa', nombre: 'Reglamento de Condecoraciones', codigo: 'REGLAMENTO DE CONDECORACIONES', gestion: 2022, archivo: 'Reglamento de Condecoraciones.pdf', imagen: '5.jpg' },
  { orden: 6, carpeta: 'legislativa', nombre: 'Reglamento de Ética', codigo: 'REGLAMENTO DE ÉTICA', gestion: 2014, archivo: 'Reglamento de Ética.pdf', imagen: '6.jpg' }
];

// ============================================
// 📌 ACORDEÓN (16 documentos, categoría única)
// ============================================
const CATEGORIA_ACORDEON = 'Normativa Administrativa';

const ACORDEON = [
  { orden: 1,  carpeta: 'administrativa', nombre: 'Manual de Organización y Funciones', codigo: 'MANUAL DE ORGANIZACIÓN Y FUNCIONES', gestion: 2020, archivo: 'Manual de Organización y Funciones.pdf' },
  { orden: 2,  carpeta: 'administrativa', nombre: 'Reglamento Interno de Personal', codigo: 'REGLAMENTO INTERNO DE PERSONAL', gestion: 2020, archivo: 'Reglamento Interno de Personal.pdf' },
  { orden: 3,  carpeta: 'interna',         nombre: 'Código de Ética', codigo: 'CÓDIGO DE ÉTICA', gestion: 2020, archivo: 'Código de Ética.pdf' },
  { orden: 4,  carpeta: 'administrativa', nombre: 'Reglamento Específico del Sistema Contabilidad Integrada', codigo: 'REGLAMENTO SISTEMA CONTABILIDAD INTEGRADA', gestion: 2020, archivo: 'Reglamento Específico del Sistema Contabilidad Integrada.pdf' },
  { orden: 5,  carpeta: 'administrativa', nombre: 'Reglamento Específico del Sistema de Administración de Personal', codigo: 'REGLAMENTO SISTEMA ADMINISTRACIÓN DE PERSONAL', gestion: 2020, archivo: 'Reglamento Específico del Sistema de Administración de Personal.pdf' },
  { orden: 6,  carpeta: 'administrativa', nombre: 'Reglamento Específico del Sistema de Organización Administrativa', codigo: 'REGLAMENTO SISTEMA ORGANIZACIÓN ADMINISTRATIVA', gestion: 2020, archivo: 'Reglamento Específico del Sistema de Organización Administrativa.pdf' },
  { orden: 7,  carpeta: 'administrativa', nombre: 'Reglamento Específico del Sistema de Programación de Operaciones', codigo: 'REGLAMENTO SISTEMA PROGRAMACIÓN DE OPERACIONES', gestion: 2020, archivo: 'Reglamento Específico del Sistema de Programación de Operaciones.pdf' },
  { orden: 8,  carpeta: 'administrativa', nombre: 'Reglamento Específico Sistema de Tesorería', codigo: 'REGLAMENTO SISTEMA DE TESORERÍA', gestion: 2020, archivo: 'Reglamento Específico Sistema de Tesorería.pdf' },
  { orden: 9,  carpeta: 'interna',         nombre: 'Manual de Procesos y Procedimientos del Sistema de Presupuestos', codigo: 'MANUAL PROCESOS SISTEMA DE PRESUPUESTOS', gestion: 2020, archivo: 'Manual de Procesos y Procedimientos del Sistema de Presupuestos.pdf' },
  { orden: 10, carpeta: 'administrativa', nombre: 'Reglamento para el cumplimiento de Declaración Jurada de Bienes y Servicios', codigo: 'REGLAMENTO DECLARACIÓN JURADA DE BIENES', gestion: 2020, archivo: 'Reglamento para el cumplimiento de Declaración Jurada de Bienes y Servicios.pdf' },
  { orden: 11, carpeta: 'administrativa', nombre: 'Reglamento Específico del Sistema de Administración de Bienes y Servicios', codigo: 'REGLAMENTO SISTEMA ADMINISTRACIÓN DE BIENES Y SERVICIOS', gestion: 2020, archivo: 'Reglamento Específico del Sistema de Administración de Bienes y Servicios.pdf' },
  { orden: 12, carpeta: 'administrativa', nombre: 'Reglamento Específico del Sistema de Presupuestos', codigo: 'REGLAMENTO SISTEMA DE PRESUPUESTOS', gestion: 2020, archivo: 'Reglamento Específico del Sistema de Presupuestos.pdf' },
  { orden: 13, carpeta: 'interna',         nombre: 'Reglamento Procesos Sumarios', codigo: 'REGLAMENTO PROCESOS SUMARIOS', gestion: 2026, archivo: 'REGLAMENTO PROCESOS SUMARIOS.pdf' },
  { orden: 14, carpeta: 'transparencia',   nombre: 'Reglamento Interno Unidad de Transparencia y Lucha Contra la Corrupción', codigo: 'REGLAMENTO INTERNO UTLCC', gestion: 2025, archivo: 'REGLAMENTO INTERNO UTLCC.pdf' },
  { orden: 15, carpeta: 'administrativa', nombre: 'Manual de Administración de Activos Fijos', codigo: 'MANUAL ADMINISTRACIÓN DE ACTIVOS FIJOS', gestion: 2020, archivo: 'Manual de Administración de Activos Fijos.pdf' },
  { orden: 16, carpeta: 'interna',         nombre: 'Manual de Administración de Almacenes', codigo: 'MANUAL ADMINISTRACIÓN DE ALMACENES', gestion: 2020, archivo: 'Manual de Administración de Almacenes.pdf' }
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
    .substring(0, 70);

/** Devuelve la ruta absoluta en disco y la URL pública de un PDF, o null. */
function resolverPDF(carpeta, nombreArchivo) {
  const absoluta = path.join(PDFS_DIR, carpeta, nombreArchivo);
  if (!fs.existsSync(absoluta)) return null;

  const relativa = `${PUBLIC_PREFIX}/pdfs/${carpeta}/${nombreArchivo}`;
  const url = `${BACKEND_URL}${encodeURI(relativa)}`;

  return {
    rutaDisco: absoluta,
    url,
    archivo: {
      url,
      filename: nombreArchivo,
      originalName: nombreArchivo,
      size: fs.statSync(absoluta).size
    }
  };
}

/** Devuelve la URL pública de una portada, o null. */
function resolverPortada(nombreArchivo) {
  const absoluta = path.join(PORTADAS_DIR, nombreArchivo);
  if (!fs.existsSync(absoluta)) return null;

  const relativa = `${PUBLIC_PREFIX}/portadas/${nombreArchivo}`;
  return `${BACKEND_URL}${encodeURI(relativa)}`;
}

async function insertar({ item, categoria, destacado, etiqueta }) {
  // En dry-run no hay conexión a Mongo: no se comprueban duplicados.
  if (!DRY_RUN) {
    const existente = await MarcoNormativo.findOne({ codigo: item.codigo });
    if (existente) {
      console.log(`   ⏭️  Saltando: ${item.codigo} (ya existe)`);
      return { insertado: false, saltado: true, fallido: false };
    }
  }

  const pdf = resolverPDF(item.carpeta, item.archivo);
  if (!pdf) {
    console.log(`   ❌ Sin PDF: ${item.codigo}`);
    console.log(`      buscado en: pdfs/${item.carpeta}/${item.archivo}`);
    return { insertado: false, saltado: false, fallido: true };
  }

  let imagen = null;
  if (destacado) {
    imagen = resolverPortada(item.imagen);
    if (!imagen) {
      console.log(`   ❌ Sin portada: ${item.codigo}`);
      console.log(`      buscado en: portadas/${item.imagen}`);
      return { insertado: false, saltado: false, fallido: true };
    }
  }

  const pesoMB = (pdf.archivo.size / 1024 / 1024).toFixed(2);
  console.log(
    `   ${DRY_RUN ? '🔎' : '✅'} ${etiqueta} ${String(item.orden).padStart(2, '0')}. ` +
      `${item.nombre.substring(0, 55)} [${pesoMB} MB]` +
      (destacado ? ' 🖼️' : '')
  );

  if (DRY_RUN) return { insertado: true, saltado: false, fallido: false };

  await MarcoNormativo.create({
    nombre: item.nombre,
    codigo: item.codigo,
    gestion: item.gestion ?? null,
    fechaDocumento: item.gestion ? new Date(`${item.gestion}-01-01`) : null,
    categoria: categoria,
    destacado: Boolean(destacado),
    orden: item.orden,
    imagen: imagen,
    archivo: pdf.archivo
  });

  return { insertado: true, saltado: false, fallido: false };
}

// ============================================
// MAIN
// ============================================
async function run() {
  console.log('\n' + '═'.repeat(70));
  console.log('📚 IMPORTACIÓN DE MARCO NORMATIVO');
  console.log('═'.repeat(70));
  console.log(`   Destino        : colección "marconormativos"`);
  console.log(`   Assets         : ${PUBLIC_DIR}`);
  console.log(`   BACKEND_URL    : ${BACKEND_URL}`);
  console.log(`   Modo           : ${DRY_RUN ? 'DRY-RUN (no conecta ni escribe)' : 'ESCRITURA'}`);
  console.log('═'.repeat(70));

  // Diagnóstico de carpetas
  for (const sub of ['legislativa', 'administrativa', 'interna', 'transparencia']) {
    const d = path.join(PDFS_DIR, sub);
    const n = fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.toLowerCase().endsWith('.pdf')).length : 0;
    console.log(`   pdfs/${sub.padEnd(15)} ${String(n).padStart(3)} archivos`);
  }
  const nPortadas = fs.existsSync(PORTADAS_DIR)
    ? fs.readdirSync(PORTADAS_DIR).filter((f) => /\.jpe?g$/i.test(f)).length
    : 0;
  console.log(`   portadas${' '.repeat(16)} ${String(nPortadas).padStart(3)} archivos`);
  console.log('═'.repeat(70) + '\n');

  let insertados = 0;
  let saltados = 0;
  let fallidos = 0;

  const acumular = (r) => {
    if (r.insertado) insertados++;
    else if (r.saltado) saltados++;
    else fallidos++;
  };

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
      acumular(await insertar({ item, categoria: null, destacado: true, etiqueta: 'Tarjeta' }));
    }

    console.log(`\n🟦 ACORDEÓN — categoría "${CATEGORIA_ACORDEON}"`);
    for (const item of ACORDEON) {
      acumular(await insertar({ item, categoria: CATEGORIA_ACORDEON, destacado: false, etiqueta: 'Fila   ' }));
    }

    console.log('\n' + '═'.repeat(70));
    console.log(`📊 RESUMEN → insertados: ${insertados} | ya existían: ${saltados} | fallidos: ${fallidos}`);
    if (DRY_RUN) {
      console.log('   (DRY-RUN: no se escribió nada. Ejecuta sin --dry-run para aplicar)');
    }
    console.log('═'.repeat(70) + '\n');

    if (!DRY_RUN) await mongoose.disconnect();
    process.exit(fallidos > 0 ? 2 : 0);
  } catch (error) {
    console.error('❌ Error fatal:', error);
    if (!DRY_RUN) await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

run();
