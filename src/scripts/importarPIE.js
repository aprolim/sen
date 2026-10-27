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

// Parser CSV nativo con auto-detección de separador
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

// Buscar y mover PDF
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
    return null;
  }
}

// Obtener valor del row (ignorando tildes y símbolos raros)
function getValorSeguro(row, posiblesNombres) {
  for (const nombre of posiblesNombres) {
    // Buscamos la llave en el objeto, normalizando a minúsculas y quitando caracteres raros
    const key = Object.keys(row).find(k => {
      const kLimpia = k.toLowerCase().replace(/[^a-z]/g, '');
      const nombreLimpio = nombre.toLowerCase().replace(/[^a-z]/g, '');
      return kLimpia.includes(nombreLimpio) || nombreLimpio.includes(kLimpia);
    });
    if (key && row[key]) return row[key];
  }
  return null;
}

async function importar() {
  console.log('\n' + '═'.repeat(70));
  console.log('🚀 IMPORTADOR MASIVO DE P.I.E.');
  console.log('═'.repeat(70) + '\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado a MongoDB\n');

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
      
      // 🔥 LEER COMO LATIN-1 Y CONVERTIR A UTF-8 (Arregla el error "N�")
      const buffer = fs.readFileSync(csvPath);
      const contenido = buffer.toString('latin1'); 
      
      const records = parsearCSV(contenido);

      for (const row of records) {
        try {
          // Al leer en latin1, ahora la columna se llama "Nº" correctamente
          const nroStr = getValorSeguro(row, ['Nº', 'N°', 'Nro', 'No']);
          const nroPIE = getValorSeguro(row, ['Nº PIE', 'N° PIE', 'Nro PIE']);
          
          const fechaIngresoStr = getValorSeguro(row, ['FECHA DE INGRESO USCLy R', 'FECHA DE INGRESO USCLyR']);
          const peticionarioStr = getValorSeguro(row, ['PETICIONARIO']);
          const asuntoStr = getValorSeguro(row, ['ASUNTO']);
          const destinatarioStr = getValorSeguro(row, ['DESTINATARIO']);
          const tipoDestinatarioStr = getValorSeguro(row, ['TIPO DE DESTINATARIO']);
          const fechaRemisionDestStr = getValorSeguro(row, ['FECHA DE REMISION AL DESTINATARIO']);
          const fechaRespuestaStr = getValorSeguro(row, ['FECHA INGRESO DE RESPUESTA A USCLyR', 'FECHA DE RESPUESTA']);
          const fechaRemisionPetStr = getValorSeguro(row, ['FECHA DE REMISION AL PETICIONARIO']);
          const conminatoriaStr = getValorSeguro(row, ['CONMINATORIA']);
          const observacionStr = getValorSeguro(row, ['OBSERVACION', 'OBSERVACIONES']);

          const nro = parseInt(nroStr);
          if (!nro || isNaN(nro)) continue;

          const existe = await DocumentoLegislativo.findOne({ tipo: 'peticion-informe-escrito', numero: nro });
          if (existe) continue;

          const codigo = `P.I.E. N° ${nroPIE || nro}`;
          const asuntoLimpio = asuntoStr ? asuntoStr.replace(/\r?\n|\r/g, ' ').replace(/"/g, '').trim() : '';

          const archivoData = buscarYAsociarPDF(nroPIE);
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
          // Silencio los errores para no llenar la consola
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