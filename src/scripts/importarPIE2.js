// src/scripts/importarPIE2.js
// Versión CORREGIDA - tolerante a headers con Nº, N°, NM-:, espacios, BOM, latin1
// - Lee SOLO de data/nuevos/
// - Detecta duplicados por numero O codigo
// - Copia PDFs (no mueve)
// - Funciona con cualquier variante de header

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const DocumentoLegislativo = require('../models/DocumentoLegislativo');
const User = require('../models/User');
const TipoDestinatario = require('../models/TipoDestinatario');

// ============================================
// 🔑 CONFIGURACIÓN DE RUTAS
// ============================================
const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'nuevos');
const PDFS_FINAL_DIR = path.join(__dirname, '..', '..', 'uploads', 'documents');
const BACKEND_URL = 'https://demoback.senado.gob.bo';
const PDFS_RAW_DIR =
  '/var/www/sen/uploads/documents/publicado en la web/FISCALIZACIÓN 2025-2026/P.I.E.s 2025-2026';

// ============================================
// 🎛️ CLI ARGS
// ============================================
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SOLO_ARCHIVO = (() => {
  const idx = args.indexOf('--solo-archivo');
  return idx !== -1 ? args[idx + 1] : null;
})();

// ============================================
// 🔧 HELPERS DE TEXTO
// ============================================
function limpiarTexto(texto) {
  if (!texto) return '';
  return String(texto)
    .replace(/[\u0080-\u00FF]/g, (char) => {
      if (char === '\x95') return '-';
      if (['\xE1','\xE9','\xED','\xF3','\xFA','\xF1','\xC1','\xC9','\xCD','\xD3','\xDA','\xD1'].includes(char)) {
        return char;
      }
      return '-';
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function parsearFecha(fechaStr) {
  if (!fechaStr || String(fechaStr).trim() === '' || String(fechaStr).trim() === '-') return null;
  const partes = String(fechaStr).trim().split('/');
  if (partes.length !== 3) return null;
  const date = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
  return isNaN(date.getTime()) ? null : date;
}

// ============================================
// 🔧 NORMALIZACIÓN DE HEADERS
// Convierte cualquier variante a un nombre canónico:
//   N°, Nº, NM-:, N., Nro  → "NRO"
//   N° PIE, Nº PIE, ...     → "NRO_PIE"
//   PETICIONARIO (con espacios) → "PETICIONARIO"
// ============================================
function normalizarHeader(h) {
  if (!h) return '';
  let s = String(h);
  // Quitar BOM
  s = s.replace(/^\uFEFF/, '');
  // Quitar caracteres invisibles
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, '');
  // Convertir ordinal º y grado ° y cualquier cosa similar
  s = s.replace(/[\u00BA\u00B0\u02DA\u2070]/g, '');
  // Quitar puntuación rara (puntos, dos puntos, guiones al inicio)
  s = s.replace(/[\.\:\-]+/g, ' ');
  // Colapsar espacios
  s = s.replace(/\s+/g, ' ');
  // Trim y uppercase
  s = s.trim().toUpperCase();

  // Mapear variantes conocidas a nombre canónico
  const map = {
    'N': 'NRO',
    'NO': 'NRO',
    'NRO': 'NRO',
    'NUMERO': 'NRO',
    'NUM': 'NRO',
    'NM': 'NRO',        // por si quedó NM del NM-:

    'N PIE': 'NRO_PIE',
    'NO PIE': 'NRO_PIE',
    'NRO PIE': 'NRO_PIE',
    'NUMERO PIE': 'NRO_PIE',
    'NM PIE': 'NRO_PIE',
    'PIE': 'NRO_PIE',

    'FECHA DE INGRESO USCLY R': 'FECHA_INGRESO',
    'FECHA DE INGRESO USCLYR': 'FECHA_INGRESO',
    'FECHA DE INGRESO': 'FECHA_INGRESO',
    'FECHA INGRESO': 'FECHA_INGRESO',

    'PETICIONARIO': 'PETICIONARIO',
    'PETICIONARIA': 'PETICIONARIO',
    'PETICIONARIO/AS': 'PETICIONARIO',
    'PROYECTISTA': 'PETICIONARIO',

    'ASUNTO': 'ASUNTO',
    'DESTINATARIO': 'DESTINATARIO',

    'TIPO DE DESTINATARIO': 'TIPO_DESTINATARIO',
    'TIPO DESTINATARIO': 'TIPO_DESTINATARIO',

    'FECHA DE REMISION AL DESTINATARIO': 'FECHA_REMISION_DEST',
    'FECHA REMISION DESTINATARIO': 'FECHA_REMISION_DEST',

    'FECHA INGRESO DE RESPUESTA A USCLYR': 'FECHA_RESPUESTA',
    'FECHA DE RESPUESTA': 'FECHA_RESPUESTA',
    'FECHA RESPUESTA': 'FECHA_RESPUESTA',

    'FECHA DE REMISION AL PETICIONARIO': 'FECHA_REMISION_PET',
    'FECHA REMISION PETICIONARIO': 'FECHA_REMISION_PET',

    'CONMINATORIA': 'CONMINATORIA',
    'CONMINATORIAS': 'CONMINATORIA',

    'OBSERVACION': 'OBSERVACION',
    'OBSERVACIONES': 'OBSERVACION',
    'OBS': 'OBSERVACION',
  };

  return map[s] || s;
}

// ============================================
// 🔧 PARSER CSV (mismo que el original, robusto)
// ============================================
function parsearCSV(contenido) {
  const primeraLinea = contenido.split('\n')[0];
  const separador = primeraLinea.includes(';') ? ';' : ',';

  const lineas = [];
  let lineaActual = [];
  let campoActual = '';
  let dentroDeComillas = false;

  for (let i = 0; i < contenido.length; i++) {
    const char = contenido[i];
    const nextChar = contenido[i + 1];

    if (char === '"') {
      if (dentroDeComillas && nextChar === '"') {
        campoActual += '"';
        i++;
      } else {
        dentroDeComillas = !dentroDeComillas;
      }
    } else if (char === separador && !dentroDeComillas) {
      lineaActual.push(campoActual.trim());
      campoActual = '';
    } else if (char === '\n' && !dentroDeComillas) {
      lineaActual.push(campoActual.trim());
      if (lineaActual.length > 1 || lineaActual[0] !== '') {
        lineas.push(lineaActual);
      }
      lineaActual = [];
      campoActual = '';
    } else if (char === '\r' && !dentroDeComillas) {
      // skip
    } else {
      campoActual += char;
    }
  }

  if (campoActual !== '' || lineaActual.length > 0) {
    lineaActual.push(campoActual.trim());
    lineas.push(lineaActual);
  }

  // Headers originales
  const headersOriginales = lineas[0] || [];
  // Headers normalizados
  const headersNorm = headersOriginales.map(h => normalizarHeader(h));

  const resultados = [];

  for (let i = 1; i < lineas.length; i++) {
    const fila = lineas[i];
    const obj = {};
    for (let j = 0; j < headersNorm.length; j++) {
      obj[headersNorm[j]] = fila[j] || '';
    }
    resultados.push(obj);
  }

  return { resultados, headersOriginales, headersNorm };
}

// ============================================
// 📄 BUSCAR Y COPIAR PDF
// ============================================
function buscarYAsociarPDF(nro, nroPIE) {
  if (!nro) return null;

  let numLimpio = nro;
  if (nroPIE) {
    const match = String(nroPIE).match(/^(\d+)/);
    if (match) numLimpio = parseInt(match[1]);
  }

  const numeroFormateado = String(numLimpio).padStart(3, '0');

  try {
    if (!fs.existsSync(PDFS_RAW_DIR)) return null;
    const archivos = fs.readdirSync(PDFS_RAW_DIR);

    const candidatos = archivos.filter(f => {
      const name = f.toUpperCase();
      return (
        name.includes(`N° ${numeroFormateado}-`) ||
        name.includes(`Nº ${numeroFormateado}-`) ||
        name.includes(`N ${numeroFormateado}-`) ||
        name.includes(`NRO ${numeroFormateado}-`) ||
        name.trim().startsWith(`${numeroFormateado}-`)
      );
    });

    if (candidatos.length === 0) return null;

    const archivoElegido =
      candidatos.find(f => f.toUpperCase().includes('RESPUESTA')) || candidatos[0];

    const origen = path.join(PDFS_RAW_DIR, archivoElegido);
    const ext = path.extname(archivoElegido);
    const basename = path
      .basename(archivoElegido, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .substring(0, 50);

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const nuevoNombre = `${basename}-${uniqueSuffix}${ext}`;
    const destino = path.join(PDFS_FINAL_DIR, nuevoNombre);

    fs.copyFileSync(origen, destino);

    return {
      url: `${BACKEND_URL}/uploads/documents/${nuevoNombre}`,
      filename: nuevoNombre,
      originalName: archivoElegido,
      size: fs.statSync(destino).size
    };
  } catch (err) {
    console.error(`   ⚠️  Error con PDF: ${err.message}`);
    return null;
  }
}

// ============================================
// 📁 LISTAR ARCHIVOS
// ============================================
function listarArchivosPIE() {
  if (!fs.existsSync(DATA_DIR)) return [];

  const todos = fs.readdirSync(DATA_DIR).filter(f => {
    const lower = f.toLowerCase();
    return lower.startsWith('pie') && lower.endsWith('.csv');
  });

  const ordenados = todos.sort((a, b) => {
    const na = parseInt((a.match(/(\d+)/) || [])[1] || '0', 10);
    const nb = parseInt((b.match(/(\d+)/) || [])[1] || '0', 10);
    return na - nb;
  });

  if (SOLO_ARCHIVO) return ordenados.filter(f => f === SOLO_ARCHIVO);
  return ordenados;
}

// ============================================
// 🚀 MAIN
// ============================================
async function importar() {
  console.log('\n' + '═'.repeat(72));
  console.log('🚀 IMPORTACIÓN P.I.E. — SOLO ARCHIVOS NUEVOS');
  console.log('   📁 Lee únicamente de: data/nuevos/');
  console.log('   🔒 pie-1.csv NO se toca');
  if (DRY_RUN) console.log('   🔍 MODO DRY-RUN');
  if (SOLO_ARCHIVO) console.log(`   📄 Solo archivo: ${SOLO_ARCHIVO}`);
  console.log('═'.repeat(72) + '\n');

  try {
    if (!fs.existsSync(DATA_DIR)) {
      console.error(`❌ No existe la carpeta: ${DATA_DIR}`);
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado a MongoDB\n');

    if (!fs.existsSync(PDFS_RAW_DIR)) {
      console.warn(`⚠️  La carpeta de PDFs NO existe: ${PDFS_RAW_DIR}`);
      console.warn('   Los registros se insertarán SIN PDF.\n');
    }

    if (!fs.existsSync(PDFS_FINAL_DIR)) {
      fs.mkdirSync(PDFS_FINAL_DIR, { recursive: true });
    }

    const archivosCSV = listarArchivosPIE();
    if (archivosCSV.length === 0) {
      console.error(`❌ No hay archivos pie-*.csv en ${DATA_DIR}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`📁 Archivos a procesar (${archivosCSV.length}):`);
    archivosCSV.forEach(f => console.log(`   - ${f}`));
    console.log('');

    let adminUser = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!adminUser) adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) adminUser = await User.findOne({});
    if (!adminUser) {
      console.error('❌ No se encontró usuario.');
      await mongoose.disconnect();
      process.exit(1);
    }
    console.log(`👤 Usuario asignado: ${adminUser.email}\n`);

    const tiposDB = await TipoDestinatario.find({ activo: true }).lean();
    const tiposValidos = new Set(tiposDB.map(t => t.nombre));

    const totalAntes = await DocumentoLegislativo.countDocuments({
      tipo: 'peticion-informe-escrito',
      eliminado: { $ne: true }
    });
    const maxNumeroAntes = await DocumentoLegislativo
      .findOne({ tipo: 'peticion-informe-escrito', eliminado: { $ne: true } })
      .sort({ numero: -1 })
      .select('numero')
      .lean();

    console.log('📊 ESTADO ACTUAL EN MONGODB:');
    console.log(`   Total P.I.E. activos: ${totalAntes}`);
    console.log(`   N° máximo actual:     ${maxNumeroAntes ? maxNumeroAntes.numero : 'N/A'}`);
    console.log(`   → Los nuevos deben empezar en N° ${(maxNumeroAntes ? maxNumeroAntes.numero : 0) + 1}\n`);

    const stats = {
      totalFilas: 0,
      insertados: 0,
      conPDF: 0,
      sinPDF: 0,
      duplicados: 0,
      errores: 0,
      sinNumero: 0,
      tipoDestInvalido: 0
    };

    const resumenPorArchivo = [];

    for (const archivo of archivosCSV) {
      console.log('─'.repeat(72));
      console.log(`📄 Procesando: ${archivo}`);
      console.log('─'.repeat(72));

      const buffer = fs.readFileSync(path.join(DATA_DIR, archivo));
      const contenido = buffer.toString('latin1');
      const { resultados: records, headersOriginales, headersNorm } = parsearCSV(contenido);

      // DEBUG: mostrar headers detectados
      console.log('🔍 Headers detectados (original → normalizado):');
      headersOriginales.forEach((h, i) => {
        console.log(`   [${i}] "${h}" → "${headersNorm[i]}"`);
      });
      console.log('');

      const statsArchivo = {
        archivo,
        totalFilas: records.length,
        insertados: 0,
        conPDF: 0,
        sinPDF: 0,
        duplicados: 0,
        errores: 0,
        sinNumero: 0,
        tipoDestInvalido: 0
      };

      for (const row of records) {
        stats.totalFilas++;

        try {
          const nroStr = row['NRO'];
          const nroPIE = row['NRO_PIE'];

          const fechaIngresoStr = row['FECHA_INGRESO'];
          const peticionarioStr = limpiarTexto(row['PETICIONARIO']);
          const asuntoStr = limpiarTexto(row['ASUNTO']);
          const destinatarioStr = limpiarTexto(row['DESTINATARIO']);
          const tipoDestinatarioStr = limpiarTexto(row['TIPO_DESTINATARIO']);
          const conminatoriaStr = limpiarTexto(row['CONMINATORIA']);
          const observacionStr = limpiarTexto(row['OBSERVACION']);

          const fechaRemisionDestStr = row['FECHA_REMISION_DEST'];
          const fechaRespuestaStr = row['FECHA_RESPUESTA'];
          const fechaRemisionPetStr = row['FECHA_REMISION_PET'];

          const nro = parseInt(nroStr);
          if (!nro || isNaN(nro)) {
            stats.sinNumero++;
            statsArchivo.sinNumero++;
            continue;
          }

          const codigoBusqueda = `P.I.E. N° ${nroPIE || nro}`;

          const existe = await DocumentoLegislativo.findOne({
            tipo: 'peticion-informe-escrito',
            $or: [
              { numero: nro },
              { codigo: codigoBusqueda }
            ],
            eliminado: { $ne: true }
          });

          if (existe) {
            stats.duplicados++;
            statsArchivo.duplicados++;
            console.log(`   ⏭️  N° ${nro} ya existe (saltado)`);
            continue;
          }

          if (tipoDestinatarioStr && tiposValidos.size > 0 && !tiposValidos.has(tipoDestinatarioStr)) {
            stats.tipoDestInvalido++;
            statsArchivo.tipoDestInvalido++;
            console.warn(`   ⚠️  N° ${nro} tipoDestinatario fuera de catálogo: "${tipoDestinatarioStr}"`);
          }

          if (DRY_RUN) {
            console.log(`   🔍 [DRY-RUN] ${codigoBusqueda} → se insertaría`);
            stats.insertados++;
            statsArchivo.insertados++;
            continue;
          }

          const archivoData = buscarYAsociarPDF(nro, nroPIE);

          const nuevoDoc = new DocumentoLegislativo({
            tipo: 'peticion-informe-escrito',
            numero: nro,
            codigo: codigoBusqueda,
            fechaIngreso: parsearFecha(fechaIngresoStr) || new Date(),
            peticionario: peticionarioStr ? [peticionarioStr] : [],
            asunto: asuntoStr,
            destinatario: destinatarioStr,
            tipoDestinatario: tipoDestinatarioStr || null,
            fechaRemisionDestinatario: parsearFecha(fechaRemisionDestStr),
            fechaRespuesta: parsearFecha(fechaRespuestaStr),
            fechaRemisionPeticionario: parsearFecha(fechaRemisionPetStr),
            conminatoria: conminatoriaStr,
            observacion: observacionStr,
            archivo: archivoData || { url: null, filename: '', originalName: '', size: 0 },
            creadoPor: adminUser._id,
            actualizadoPor: adminUser._id
          });

          await nuevoDoc.save();

          stats.insertados++;
          statsArchivo.insertados++;

          if (archivoData) {
            stats.conPDF++;
            statsArchivo.conPDF++;
            console.log(`   ✅ ${codigoBusqueda} 📄 [CON PDF]`);
          } else {
            stats.sinPDF++;
            statsArchivo.sinPDF++;
            console.log(`   ✅ ${codigoBusqueda} ❌ [SIN PDF]`);
          }
        } catch (err) {
          stats.errores++;
          statsArchivo.errores++;
          console.error(`   ❌ Error en fila: ${err.message}`);
        }
      }

      resumenPorArchivo.push(statsArchivo);
      console.log('');
    }

    console.log('\n' + '═'.repeat(72));
    console.log('📊 RESUMEN POR ARCHIVO');
    console.log('═'.repeat(72));
    resumenPorArchivo.forEach(s => {
      console.log(`\n📄 ${s.archivo}`);
      console.log(`   Filas:                   ${s.totalFilas}`);
      console.log(`   Insertados:              ${s.insertados}`);
      console.log(`   Con PDF:                 ${s.conPDF}`);
      console.log(`   Sin PDF:                 ${s.sinPDF}`);
      console.log(`   Duplicados (saltados):   ${s.duplicados}`);
      console.log(`   Sin número (saltados):   ${s.sinNumero}`);
      console.log(`   Errores:                 ${s.errores}`);
      console.log(`   TipoDest fuera de cat.:  ${s.tipoDestInvalido}`);
    });

    const totalDespues = await DocumentoLegislativo.countDocuments({
      tipo: 'peticion-informe-escrito',
      eliminado: { $ne: true }
    });

    console.log('\n' + '═'.repeat(72));
    console.log('🎉 TOTAL GENERAL');
    console.log('═'.repeat(72));
    console.log(`   Filas procesadas:        ${stats.totalFilas}`);
    console.log(`   Insertados:              ${stats.insertados}`);
    console.log(`   Con PDF:                 ${stats.conPDF}`);
    console.log(`   Sin PDF:                 ${stats.sinPDF}`);
    console.log(`   Duplicados (saltados):   ${stats.duplicados}`);
    console.log(`   Sin número (saltados):   ${stats.sinNumero}`);
    console.log(`   Errores:                 ${stats.errores}`);
    console.log(`   TipoDest fuera de cat.:  ${stats.tipoDestInvalido}`);
    console.log('');
    console.log(`   📊 MongoDB ANTES:        ${totalAntes} P.I.E.`);
    console.log(`   📊 MongoDB DESPUÉS:      ${totalDespues} P.I.E.`);
    console.log(`   📈 Diferencia:           +${totalDespues - totalAntes}`);
    if (DRY_RUN) console.log('\n   🔍 DRY-RUN: no se insertó nada realmente.');
    console.log('═'.repeat(72) + '\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

importar();