// src/scripts/importarPIE-nuevos.js
// Versión BLINDADA para importar SOLO archivos nuevos (pie-2.csv, pie-3.csv, ...)
// - Lee SOLO de data/nuevos/  → pie-1.csv NUNCA se toca
// - findOne por $or de numero/codigo + filtro eliminado  → evita duplicados aunque editen desde CMS
// - copyFileSync  → conserva los PDFs originales en la carpeta raw
// - Reporta duplicados, errores y resumen por archivo
// - Soporta --dry-run y --solo-archivo

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
// ⚠️ CAMBIO CLAVE: solo lee de data/nuevos/
const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'nuevos');

// Carpeta destino final de los PDFs (dentro del proyecto)
const PDFS_FINAL_DIR = path.join(__dirname, '..', '..', 'uploads', 'documents');

// URL base del backend (para construir las URLs de los PDFs)
const BACKEND_URL = 'https://demoback.senado.gob.bo';

// Carpeta raw donde están los PDFs originales (fuera del proyecto)
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
// 🛠️ HELPERS (mismos que el original)
// ============================================
function limpiarTexto(texto) {
  if (!texto) return '';
  return texto
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
  if (!fechaStr || fechaStr.trim() === '' || fechaStr.trim() === '-') return null;
  const partes = fechaStr.trim().split('/');
  if (partes.length !== 3) return null;
  const date = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
  return isNaN(date.getTime()) ? null : date;
}

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

  const headers = lineas[0].map(h => h.trim());
  const resultados = [];

  for (let i = 1; i < lineas.length; i++) {
    const fila = lineas[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = fila[j] || '';
    }
    resultados.push(obj);
  }

  return resultados;
}

/**
 * Busca el PDF y lo COPIA (no lo mueve) a uploads/documents/.
 * Busca por número a 3 dígitos (ej: 044) usando el primer campo N°.
 * Si no lo encuentra, intenta con N° PIE.
 */
function buscarYAsociarPDF(nro, nroPIE) {
  if (!nro) return null;

  let numLimpio = nro;
  if (nroPIE) {
    const match = nroPIE.match(/^(\d+)/);
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
        name.includes(`N ${numeroFormateado}-`) ||
        name.includes(`NRO ${numeroFormateado}-`) ||
        name.trim().startsWith(`${numeroFormateado}-`)
      );
    });

    if (candidatos.length === 0) return null;

    // Preferir el que tenga "RESPUESTA" en el nombre
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

    // 🔒 COPIAR, no mover → el original queda en la carpeta raw
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

/**
 * Lista los pie-*.csv dentro de data/nuevos/, ordenados por número.
 */
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

  if (SOLO_ARCHIVO) {
    return ordenados.filter(f => f === SOLO_ARCHIVO);
  }
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
  if (DRY_RUN) console.log('   🔍 MODO DRY-RUN (no se inserta nada)');
  if (SOLO_ARCHIVO) console.log(`   📄 Solo archivo: ${SOLO_ARCHIVO}`);
  console.log('═'.repeat(72) + '\n');

  try {
    // 1. Verificar carpeta de CSV nuevos
    if (!fs.existsSync(DATA_DIR)) {
      console.error(`❌ No existe la carpeta: ${DATA_DIR}`);
      console.error(`   Créala con: mkdir -p ${DATA_DIR}`);
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado a MongoDB\n');

    // 2. Verificar carpeta de PDFs raw
    if (!fs.existsSync(PDFS_RAW_DIR)) {
      console.warn(`⚠️  La carpeta de PDFs NO existe: ${PDFS_RAW_DIR}`);
      console.warn('   Los registros se insertarán SIN PDF.\n');
    }

    // 3. Verificar carpeta destino de PDFs
    if (!fs.existsSync(PDFS_FINAL_DIR)) {
      fs.mkdirSync(PDFS_FINAL_DIR, { recursive: true });
      console.log(`📁 Carpeta creada: ${PDFS_FINAL_DIR}\n`);
    }

    // 4. Listar archivos CSV
    const archivosCSV = listarArchivosPIE();
    if (archivosCSV.length === 0) {
      console.error(`❌ No hay archivos pie-*.csv en ${DATA_DIR}`);
      console.error('   Ejemplo: crea data/nuevos/pie-2.csv y vuelve a ejecutar.');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`📁 Archivos a procesar (${archivosCSV.length}):`);
    archivosCSV.forEach(f => console.log(`   - ${f}`));
    console.log('');

    // 5. Usuario admin
    let adminUser = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!adminUser) adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) adminUser = await User.findOne({});
    if (!adminUser) {
      console.error('❌ No se encontró usuario para asignar como creador.');
      await mongoose.disconnect();
      process.exit(1);
    }
    console.log(`👤 Usuario asignado: ${adminUser.email}\n`);

    // 6. Catálogo de tipos de destinatario (informativo)
    const tiposDB = await TipoDestinatario.find({ activo: true }).lean();
    const tiposValidos = new Set(tiposDB.map(t => t.nombre));
    if (tiposValidos.size > 0) {
      console.log(`📋 Tipos de destinatario válidos (${tiposValidos.size}):`);
      [...tiposValidos].forEach(t => console.log(`   - ${t}`));
      console.log('');
    }

    // 7. Estado actual en MongoDB (para comparar al final)
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

    // 8. Estadísticas globales
    const stats = {
      totalFilas: 0,
      insertados: 0,
      conPDF: 0,
      sinPDF: 0,
      duplicados: 0,
      errores: 0,
      tipoDestInvalido: 0
    };

    const resumenPorArchivo = [];

    // 9. Procesar cada CSV
    for (const archivo of archivosCSV) {
      console.log('─'.repeat(72));
      console.log(`📄 Procesando: ${archivo}`);
      console.log('─'.repeat(72));

      const buffer = fs.readFileSync(path.join(DATA_DIR, archivo));
      const contenido = buffer.toString('latin1');
      const records = parsearCSV(contenido);

      const statsArchivo = {
        archivo,
        totalFilas: records.length,
        insertados: 0,
        conPDF: 0,
        sinPDF: 0,
        duplicados: 0,
        errores: 0,
        tipoDestInvalido: 0
      };

      for (const row of records) {
        stats.totalFilas++;

        try {
          // ============================================
          // MAPEO DE CAMPOS (idéntico al original)
          // ============================================
          const nroStr = row['Nï¿½'] || row['NÂº'] || row['N°'];
          const nroPIE = row['Nï¿½ PIE'] || row['NÂº PIE'] || row['N° PIE'];

          const fechaIngresoStr = row['FECHA DE INGRESO USCLy R'];
          const peticionarioStr = limpiarTexto(row['PETICIONARIO']);
          const asuntoStr = limpiarTexto(row['ASUNTO']);
          const destinatarioStr = limpiarTexto(row['DESTINATARIO']);
          const tipoDestinatarioStr = limpiarTexto(row['TIPO DE DESTINATARIO']);
          const conminatoriaStr = limpiarTexto(row['CONMINATORIA']);
          const observacionStr = limpiarTexto(row['OBSERVACION']);

          const fechaRemisionDestStr = row['FECHA DE REMISION AL DESTINATARIO'];
          const fechaRespuestaStr = row['FECHA INGRESO DE RESPUESTA A USCLyR'];
          const fechaRemisionPetStr = row['FECHA DE REMISION AL PETICIONARIO'];

          const nro = parseInt(nroStr);
          if (!nro || isNaN(nro)) {
            // fila vacía o sin número
            continue;
          }

          // ============================================
          // 🔒 BLINDAJE: detectar duplicado por numero O codigo
          // ============================================
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
            console.log(`   ⏭️  [${archivo}] ${codigoBusqueda} ya existe (saltado)`);
            continue;
          }

          // ============================================
          // ⚠️ Validar tipoDestinatario (solo advertir)
          // ============================================
          if (tipoDestinatarioStr && tiposValidos.size > 0 && !tiposValidos.has(tipoDestinatarioStr)) {
            stats.tipoDestInvalido++;
            statsArchivo.tipoDestInvalido++;
            console.warn(
              `   ⚠️  [${archivo}] N° ${nro} tipoDestinatario no está en el catálogo: "${tipoDestinatarioStr}"`
            );
          }

          // ============================================
          // 🔍 DRY-RUN
          // ============================================
          if (DRY_RUN) {
            console.log(`   🔍 [DRY-RUN] ${codigoBusqueda} → se insertaría`);
            stats.insertados++;
            statsArchivo.insertados++;
            continue;
          }

          // ============================================
          // PDF (copiar, no mover)
          // ============================================
          const archivoData = buscarYAsociarPDF(nro, nroPIE);

          // ============================================
          // Crear documento
          // ============================================
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
          console.error(`   ❌ [${archivo}] Error en fila: ${err.message}`);
        }
      }

      resumenPorArchivo.push(statsArchivo);
      console.log('');
    }

    // ============================================
    // 📊 RESUMEN FINAL
    // ============================================
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
      console.log(`   Errores:                 ${s.errores}`);
      console.log(`   TipoDest fuera de cat.:  ${s.tipoDestInvalido}`);
    });

    // Comparación antes/después
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