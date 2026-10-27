// src/scripts/importarPIE.js
// Ejecutar SIEMPRE en el servidor: node src/scripts/importarPIE.js
// Este script lee TODOS los archivos .csv de la carpeta "data" que empiecen con "pie"
// Y ASOCIA AUTOMÁTICAMENTE LOS PDFs de la carpeta uploads/documents/pie-raw/

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

dotenv.config();

const DocumentoLegislativo = require('../models/DocumentoLegislativo');
const User = require('../models/User');
const TipoDestinatario = require('../models/TipoDestinatario');

// ============================================
// CONFIGURACIÓN DE RUTAS Y URL (FIJAS PARA PRODUCCIÓN)
// ============================================
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const PDFS_RAW_DIR = path.join(__dirname, '..', '..', 'uploads', 'documents', 'pie-raw');
const PDFS_FINAL_DIR = path.join(__dirname, '..', '..', 'uploads', 'documents');

// 🔥 URL fija del servidor de producción
const BACKEND_URL = 'https://demoback.senado.gob.bo';

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function parsearFecha(fechaStr) {
  if (!fechaStr || fechaStr.trim() === '' || fechaStr.trim() === '-') return null;
  const partes = fechaStr.trim().split('/');
  if (partes.length !== 3) return null;
  const date = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
  return isNaN(date.getTime()) ? null : date;
}

function getValor(row, posiblesNombres) {
  for (const nombre of posiblesNombres) {
    const key = Object.keys(row).find(k => 
      k.trim().toLowerCase() === nombre.trim().toLowerCase()
    );
    if (key && row[key]) return row[key];
  }
  return null;
}

// ============================================
// BUSCADOR Y MOVIDOR DE PDFs
// ============================================
function buscarYAsociarPDF(nroPIE) {
  if (!nroPIE) return null;

  // Extraemos los números del PIE (ej: "01/2025-2026" -> "01")
  const match = nroPIE.match(/^(\d+)/);
  if (!match) return null;
  
  // Formateamos a 3 dígitos (ej: "001")
  const numeroFormateado = match[1].padStart(3, '0');

  try {
    const archivos = fs.readdirSync(PDFS_RAW_DIR);
    
    // Buscamos el archivo que contenga "Nř 001-2025-2026" o sus variantes
    const archivosEncontrados = archivos.filter(f => 
      f.includes(`Nř ${numeroFormateado}-2025-2026`) || 
      f.includes(`N° ${numeroFormateado}-2025-2026`) ||
      f.includes(`Nro ${numeroFormateado}-2025-2026`)
    );

    if (archivosEncontrados.length === 0) return null;

    // Si hay varios (ej: el original y la respuesta), priorizamos el que dice RESPUESTA
    let archivoElegido = archivosEncontrados.find(f => f.includes('RESPUESTA')) || archivosEncontrados[0];

    const origen = path.join(PDFS_RAW_DIR, archivoElegido);
    
    // Generar nombre único (igual que el CMS)
    const ext = path.extname(archivoElegido);
    const basename = path.basename(archivoElegido, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .substring(0, 50);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const nuevoNombre = `${basename}-${uniqueSuffix}${ext}`;
    
    const destino = path.join(PDFS_FINAL_DIR, nuevoNombre);
    
    // Mover el archivo físico
    fs.renameSync(origen, destino);
    
    return {
      url: `${BACKEND_URL}/uploads/documents/${nuevoNombre}`,
      filename: nuevoNombre,
      originalName: archivoElegido,
      size: fs.statSync(destino).size
    };
  } catch (err) {
    console.error(`   ⚠️ Error buscando PDF para ${nroPIE}:`, err.message);
    return null;
  }
}

// ============================================
// SCRIPT PRINCIPAL
// ============================================
async function importar() {
  console.log('\n' + '═'.repeat(70));
  console.log('🚀 IMPORTADOR MASIVO DE P.I.E. + ASOCIACIÓN DE PDFs');
  console.log('🌐 URL Base: ' + BACKEND_URL);
  console.log('═'.repeat(70) + '\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado a MongoDB\n');

    // Validar carpetas
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(PDFS_RAW_DIR)) {
      console.error(`❌ ERROR: No existe la carpeta de PDFs: ${PDFS_RAW_DIR}`);
      console.log('   Asegúrate de haberlos subido por WinSCP.\n');
      process.exit(1);
    }

    const archivosCSV = fs.readdirSync(DATA_DIR).filter(f => 
      f.toLowerCase().startsWith('pie') && f.toLowerCase().endsWith('.csv')
    );

    if (archivosCSV.length === 0) {
      console.log('⚠️ No se encontraron archivos CSV que empiecen con "pie" en la carpeta data/');
      process.exit(0);
    }

    // Buscar usuario admin para auditoría
    let adminUser = await User.findOne({ role: 'SUPER_ADMIN' }) || await User.findOne({ role: 'ADMIN' });
    if (!adminUser) {
      console.error('❌ No hay usuarios admin en la base de datos.');
      process.exit(1);
    }

    const tiposDB = await TipoDestinatario.find({ activo: true });
    const tiposNombres = tiposDB.map(t => t.nombre);

    let globalInsertados = 0;
    let globalOmitidos = 0;
    let globalErrores = 0;
    let globalPDFsAsociados = 0;

    for (const archivo of archivosCSV) {
      console.log(`\n📄 Procesando archivo: ${archivo}`);
      const csvPath = path.join(DATA_DIR, archivo);
      const records = parse(fs.readFileSync(csvPath, 'utf8'), {
        columns: true, skip_empty_lines: true, trim: true, relax_column_count: true
      });

      let insertados = 0;
      let omitidos = 0;
      let errores = 0;

      for (const row of records) {
        try {
          const nroStr = getValor(row, ['Nº', 'N°', 'Nro', 'No']);
          const nroPIE = getValor(row, ['Nº PIE', 'N° PIE', 'Nro PIE']);
          const fechaIngresoStr = getValor(row, ['FECHA DE INGRESO USCLy R', 'FECHA DE INGRESO USCLyR']);
          const peticionarioStr = getValor(row, ['PETICIONARIO']);
          const asuntoStr = getValor(row, ['ASUNTO']);
          const destinatarioStr = getValor(row, ['DESTINATARIO']);
          const tipoDestinatarioStr = getValor(row, ['TIPO DE DESTINATARIO']);
          const fechaRemisionDestStr = getValor(row, ['FECHA DE REMISION AL DESTINATARIO']);
          const fechaRespuestaStr = getValor(row, ['FECHA INGRESO DE RESPUESTA A USCLyR', 'FECHA DE RESPUESTA']);
          const fechaRemisionPetStr = getValor(row, ['FECHA DE REMISION AL PETICIONARIO']);
          const conminatoriaStr = getValor(row, ['CONMINATORIA']);
          const observacionStr = getValor(row, ['OBSERVACION', 'OBSERVACIONES']);

          const nro = parseInt(nroStr);
          if (!nro || isNaN(nro)) { omitidos++; continue; }

          // Validar tipo de destinatario
          if (tipoDestinatarioStr && !tiposNombres.includes(tipoDestinatarioStr.trim())) {
            console.log(`   ⚠️ Nº ${nro}: Tipo "${tipoDestinatarioStr}" no existe. Omitido.`);
            omitidos++; continue;
          }

          // Evitar duplicados
          const existe = await DocumentoLegislativo.findOne({ tipo: 'peticion-informe-escrito', numero: nro });
          if (existe) { omitidos++; continue; }

          const codigo = `P.I.E. N° ${nroPIE || nro}`;
          const asuntoLimpio = asuntoStr ? asuntoStr.replace(/\r?\n|\r/g, ' ').replace(/"/g, '').trim() : '';

          // 🔥 BUSCAR Y MOVER EL PDF
          const archivoData = buscarYAsociarPDF(nroPIE);
          if (archivoData) globalPDFsAsociados++;

          // Crear el documento
          const nuevoDoc = new DocumentoLegislativo({
            tipo: 'peticion-informe-escrito',
            numero: nro,
            codigo: codigo,
            fechaIngreso: parsearFecha(fechaIngresoStr) || new Date(),
            peticionario: peticionarioStr ? [peticionarioStr.trim()] : [],
            asunto: asuntoLimpio,
            destinatario: destinatarioStr ? destinatarioStr.trim() : '',
            tipoDestinatario: tipoDestinatarioStr ? tipoDestinatarioStr.trim() : null,
            fechaRemisionDestinatario: parsearFecha(fechaRemisionDestStr),
            fechaRespuesta: parsearFecha(fechaRespuestaStr),
            fechaRemisionPeticionario: parsearFecha(fechaRemisionPetStr),
            conminatoria: conminatoriaStr ? conminatoriaStr.trim() : '',
            observacion: observacionStr ? observacionStr.trim() : '',
            
            // 🔥 GUARDAR LA RUTA DEL ARCHIVO
            archivo: archivoData || { url: null, filename: '', originalName: '', size: 0 },

            creadoPor: adminUser._id,
            actualizadoPor: adminUser._id
          });

          await nuevoDoc.save();
          insertados++;
          
          // Mostrar en consola si encontró el PDF o no
          const iconoPDF = archivoData ? '📄 [CON PDF]' : '❌ [SIN PDF]';
          console.log(`   ✅ ${codigo} ${iconoPDF}`);

        } catch (err) {
          console.error(`   ❌ Error en Nº ${getValor(row, ['Nº'])}:`, err.message);
          errores++;
        }
      }
      console.log(`   📊 Resultado archivo: ${insertados} insertados, ${omitidos} omitidos, ${errores} errores`);
      globalInsertados += insertados;
      globalOmitidos += omitidos;
      globalErrores += errores;
    }

    console.log('\n' + '═'.repeat(70));
    console.log('📊 RESUMEN GLOBAL');
    console.log(`   ✅ Insertados: ${globalInsertados}`);
    console.log(`   📄 PDFs asociados: ${globalPDFsAsociados}`);
    console.log(`   ⏭️  Omitidos: ${globalOmitidos}`);
    console.log(`   ❌ Errores: ${globalErrores}`);
    console.log('═'.repeat(70) + '\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

importar();