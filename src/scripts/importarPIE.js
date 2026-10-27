// src/scripts/importarPIE.js
// Ejecutar SIEMPRE en el servidor: node src/scripts/importarPIE.js
// Versión sin librerías externas (Parseo manual de CSV)

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const DocumentoLegislativo = require('../models/DocumentoLegislativo');
const User = require('../models/User');
const TipoDestinatario = require('../models/TipoDestinatario');

// ============================================
// CONFIGURACIÓN DE RUTAS Y URL
// ============================================
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const PDFS_RAW_DIR = path.join(__dirname, '..', '..', 'uploads', 'documents', 'pie-raw');
const PDFS_FINAL_DIR = path.join(__dirname, '..', '..', 'uploads', 'documents');

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

// Parser de CSV nativo (maneja comillas dobles y saltos de línea)
function parsearCSV(contenido) {
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
        i++; // Skip next quote
      } else {
        dentroDeComillas = !dentroDeComillas;
      }
    } else if (char === ';' && !dentroDeComillas) {
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
      // Ignorar retorno de carro
    } else {
      campoActual += char;
    }
  }
  
  if (campoActual !== '' || lineaActual.length > 0) {
    lineaActual.push(campoActual.trim());
    lineas.push(lineaActual);
  }

  // Convertir a objetos usando la primera fila como encabezado
  const headers = lineas[0].map(h => h.trim().toLowerCase());
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

// ============================================
// BUSCADOR Y MOVIDOR DE PDFs
// ============================================
function buscarYAsociarPDF(nroPIE) {
  if (!nroPIE) return null;
  const match = nroPIE.match(/^(\d+)/);
  if (!match) return null;
  
  const numeroFormateado = match[1].padStart(3, '0');

  try {
    const archivos = fs.readdirSync(PDFS_RAW_DIR);
    const archivosEncontrados = archivos.filter(f => 
      f.includes(`Nř ${numeroFormateado}-2025-2026`) || 
      f.includes(`N° ${numeroFormateado}-2025-2026`) ||
      f.includes(`Nro ${numeroFormateado}-2025-2026`)
    );

    if (archivosEncontrados.length === 0) return null;

    let archivoElegido = archivosEncontrados.find(f => f.includes('RESPUESTA')) || archivosEncontrados[0];
    const origen = path.join(PDFS_RAW_DIR, archivoElegido);
    
    const ext = path.extname(archivoElegido);
    const basename = path.basename(archivoElegido, ext).toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const nuevoNombre = `${basename}-${uniqueSuffix}${ext}`;
    const destino = path.join(PDFS_FINAL_DIR, nuevoNombre);
    
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
  console.log('🚀 IMPORTADOR MASIVO DE P.I.E. (Nativo)');
  console.log('🌐 URL Base: ' + BACKEND_URL);
  console.log('═'.repeat(70) + '\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado a MongoDB\n');

    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(PDFS_RAW_DIR)) {
      console.error(`❌ ERROR: No existe la carpeta de PDFs: ${PDFS_RAW_DIR}`);
      process.exit(1);
    }

    const archivosCSV = fs.readdirSync(DATA_DIR).filter(f => 
      f.toLowerCase().startsWith('pie') && f.toLowerCase().endsWith('.csv')
    );

    if (archivosCSV.length === 0) {
      console.log('⚠️ No se encontraron archivos CSV que empiecen con "pie" en la carpeta data/');
      process.exit(0);
    }

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
      const contenido = fs.readFileSync(csvPath, 'utf8');
      const records = parsearCSV(contenido);

      let insertados = 0;
      let omitidos = 0;
      let errores = 0;

      for (const row of records) {
        try {
          // Al parsear nativo, las llaves están en minúsculas
          const nroStr = row['nº'] || row['n°'] || row['nro'] || row['no'];
          const nroPIE = row['nº pie'] || row['n° pie'] || row['nro pie'];
          const fechaIngresoStr = row['fecha de ingreso uscly r'] || row['fecha de ingreso usclyr'];
          const peticionarioStr = row['peticionario'];
          const asuntoStr = row['asunto'];
          const destinatarioStr = row['destinatario'];
          const tipoDestinatarioStr = row['tipo de destinatario'];
          const fechaRemisionDestStr = row['fecha de remision al destinatario'];
          const fechaRespuestaStr = row['fecha ingreso de respuesta a usclyr'] || row['fecha de respuesta'];
          const fechaRemisionPetStr = row['fecha de remision al peticionario'];
          const conminatoriaStr = row['conminatoria'];
          const observacionStr = row['observacion'] || row['observaciones'];

          const nro = parseInt(nroStr);
          if (!nro || isNaN(nro)) { omitidos++; continue; }

          if (tipoDestinatarioStr && !tiposNombres.includes(tipoDestinatarioStr.trim())) {
            console.log(`   ⚠️ Nº ${nro}: Tipo "${tipoDestinatarioStr}" no existe. Omitido.`);
            omitidos++; continue;
          }

          const existe = await DocumentoLegislativo.findOne({ tipo: 'peticion-informe-escrito', numero: nro });
          if (existe) { omitidos++; continue; }

          const codigo = `P.I.E. N° ${nroPIE || nro}`;
          const asuntoLimpio = asuntoStr ? asuntoStr.replace(/\r?\n|\r/g, ' ').replace(/"/g, '').trim() : '';

          const archivoData = buscarYAsociarPDF(nroPIE);
          if (archivoData) globalPDFsAsociados++;

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
            archivo: archivoData || { url: null, filename: '', originalName: '', size: 0 },
            creadoPor: adminUser._id,
            actualizadoPor: adminUser._id
          });

          await nuevoDoc.save();
          insertados++;
          
          const iconoPDF = archivoData ? '📄 [CON PDF]' : '❌ [SIN PDF]';
          console.log(`   ✅ ${codigo} ${iconoPDF}`);

        } catch (err) {
          console.error(`   ❌ Error en fila:`, err.message);
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