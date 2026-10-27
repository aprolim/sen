// src/scripts/importarPIE.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const DocumentoLegislativo = require('../models/DocumentoLegislativo');
const User = require('../models/User');
const TipoDestinatario = require('../models/TipoDestinatario');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const PDFS_RAW_DIR = path.join(__dirname, '..', '..', 'uploads', 'documents', 'pie-raw');
const PDFS_FINAL_DIR = path.join(__dirname, '..', '..', 'uploads', 'documents');
const BACKEND_URL = 'https://demoback.senado.gob.bo';

// Función para convertir fechas
function parsearFecha(fechaStr) {
  if (!fechaStr || fechaStr.trim() === '' || fechaStr.trim() === '-') return null;
  const partes = fechaStr.trim().split('/');
  if (partes.length !== 3) return null;
  const date = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
  return isNaN(date.getTime()) ? null : date;
}

// Parser CSV nativo
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
      // Ignorar
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

// 🔥 BUSCAR Y MOVER PDF (Versión Mejorada)
function buscarYAsociarPDF(nro, nroPIE) {
  if (!nro) return null;
  
  // Extraemos el número puro (ej: si nroPIE es "01/2025-2026", sacamos el 1)
  // Si no hay nroPIE, usamos el número de fila (nro)
  let numLimpio = nro;
  if (nroPIE) {
    const match = nroPIE.match(/^(\d+)/);
    if (match) numLimpio = parseInt(match[1]);
  }

  // Formateamos a 3 dígitos (ej: 1 -> 001)
  const numeroFormateado = String(numLimpio).padStart(3, '0');

  try {
    const archivos = fs.readdirSync(PDFS_RAW_DIR);
    
    // Buscamos el archivo que contenga "Nř 001-2025-2026", "N° 001-2025-2026" o "001-2025-2026"
    const archivosEncontrados = archivos.filter(f => {
      // Si el nombre del archivo incluye el número formateado
      if (f.includes(`Nř ${numeroFormateado}-2025-2026`) || 
          f.includes(`N° ${numeroFormateado}-2025-2026`) ||
          f.includes(`Nro ${numeroFormateado}-2025-2026`) ||
          f.includes(`N° ${numeroFormateado}-`)) {
        return true;
      }
      // Caso especial: si el archivo empieza con el número (ej: "001-2025...")
      if (f.trim().startsWith(`${numeroFormateado}-`)) return true;
      
      return false;
    });

    if (archivosEncontrados.length === 0) return null;

    // Preferimos el que dice RESPUESTA, si no, el primero
    let archivoElegido = archivosEncontrados.find(f => f.includes('RESPUESTA')) || archivosEncontrados[0];

    const origen = path.join(PDFS_RAW_DIR, archivoElegido);
    
    // Generar nombre único
    const ext = path.extname(archivoElegido);
    const basename = path.basename(archivoElegido, ext).toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const nuevoNombre = `${basename}-${uniqueSuffix}${ext}`;
    const destino = path.join(PDFS_FINAL_DIR, nuevoNombre);
    
    // Mover archivo
    fs.renameSync(origen, destino);
    
    return {
      url: `${BACKEND_URL}/uploads/documents/${nuevoNombre}`,
      filename: nuevoNombre,
      originalName: archivoElegido,
      size: fs.statSync(destino).size
    };
  } catch (err) {
    return null;
  }
}

async function importar() {
  console.log('\n' + '═'.repeat(70));
  console.log('🚀 IMPORTADOR MASIVO DE P.I.E.');
  console.log('═'.repeat(70) + '\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado a MongoDB\n');

    // 🔥 Para que funcione, los PDFs NO deben haber sido borrados de pie-raw
    // Si ya los borraste, tendrás que volver a subirlos.
    if (!fs.existsSync(PDFS_RAW_DIR)) {
      console.error(`❌ ERROR: No existe la carpeta de PDFs: ${PDFS_RAW_DIR}`);
      console.log('   Necesitas volver a subir los PDFs a pie-raw/ para asociarlos.\n');
      process.exit(1);
    }

    const archivosCSV = fs.readdirSync(DATA_DIR).filter(f => 
      f.toLowerCase().startsWith('pie') && f.toLowerCase().endsWith('.csv')
    );

    let adminUser = await User.findOne({ role: 'SUPER_ADMIN' }) || await User.findOne({ role: 'ADMIN' });
    const tiposDB = await TipoDestinatario.find({ activo: true });
    const tiposNombres = tiposDB.map(t => t.nombre);

    let globalInsertados = 0;
    let globalPDFs = 0;

    for (const archivo of archivosCSV) {
      console.log(`📄 Procesando: ${archivo}`);
      const csvPath = path.join(DATA_DIR, archivo);
      
      const buffer = fs.readFileSync(csvPath);
      const contenido = buffer.toString('latin1');
      
      const records = parsearCSV(contenido);

      for (const row of records) {
        try {
          const nroStr = row['N�'] || row['Nº'] || row['N°'];
          const nroPIE = row['N� PIE'] || row['Nº PIE'] || row['N° PIE'];
          
          const fechaIngresoStr = row['FECHA DE INGRESO USCLy R'];
          const peticionarioStr = row['PETICIONARIO'];
          const asuntoStr = row['ASUNTO'];
          const destinatarioStr = row['DESTINATARIO'];
          const tipoDestinatarioStr = row['TIPO DE DESTINATARIO'];
          
          const fechaRemisionDestStr = row['FECHA DE REMISION AL DESTINATARIO'];
          const fechaRespuestaStr = row['FECHA INGRESO DE RESPUESTA A USCLyR'];
          const fechaRemisionPetStr = row['FECHA DE REMISION AL PETICIONARIO'];
          
          const conminatoriaStr = row['CONMINATORIA'];
          const observacionStr = row['OBSERVACION'];

          const nro = parseInt(nroStr);
          if (!nro || isNaN(nro)) continue;

          const existe = await DocumentoLegislativo.findOne({ tipo: 'peticion-informe-escrito', numero: nro });
          if (existe) {
            // Si ya existe, salteamos la creación pero NO el PDF (si lo necesitas).
            // Para esta importación, asumimos que si ya existe, lo ignoramos.
            continue; 
          }

          const codigo = `P.I.E. N° ${nroPIE || nro}`;
          const asuntoLimpio = asuntoStr ? asuntoStr.replace(/\r?\n|\r/g, ' ').replace(/"/g, '').trim() : '';

          // 🔥 LE PASAMOS EL NÚMERO DE FILA Y EL NRO PIE
          const archivoData = buscarYAsociarPDF(nro, nroPIE);
          if (archivoData) globalPDFs++;

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
          globalInsertados++;
          console.log(`   ✅ ${codigo} ${archivoData ? '📄 [CON PDF]' : '❌ [SIN PDF]'}`);

        } catch (err) {
          // Silencio
        }
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log(`🎉 COMPLETADO: ${globalInsertados} insertados, ${globalPDFs} PDFs asociados.`);
    console.log('═'.repeat(70) + '\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

importar();