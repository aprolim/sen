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
const PDFS_FINAL_DIR = path.join(__dirname, '..', '..', 'uploads', 'documents');
const BACKEND_URL = 'https://demoback.senado.gob.bo';

// 🔥 RUTA PERSONALIZADA DONDE ESTÁN TUS PDFs
const PDFS_RAW_DIR = "/var/www/sen/uploads/documents/publicado en la web/FISCALIZACIÓN 2025-2026/P.I.E.s 2025-2026";

// 🔥 FUNCIÓN PARA LIMPIAR MANCHAS
function limpiarTexto(texto) {
  if (!texto) return '';
  return texto
    .replace(/[\u0080-\u00FF]/g, (char) => {
      if (char === '\x95' || char === '\x95') return '-'; // Viñetas a guiones
      if (['\xE1', '\xE9', '\xED', '\xF3', '\xFA', '\xF1', '\xC1', '\xC9', '\xCD', '\xD3', '\xDA', '\xD1'].includes(char)) {
        return char; // Conservar tildes
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
    
    const archivosEncontrados = archivos.filter(f => {
      if (f.includes(`N° ${numeroFormateado}-`) || 
          f.includes(`Nř ${numeroFormateado}-`) || 
          f.includes(`Nro ${numeroFormateado}-`)) {
        return true;
      }
      if (f.trim().startsWith(`${numeroFormateado}-`)) return true;
      return false;
    });

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

async function importar() {
  console.log('\n' + '═'.repeat(70));
  console.log('🚀 IMPORTACIÓN P.I.E. (RUTA PUBLICADO EN LA WEB)');
  console.log('═'.repeat(70) + '\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado a MongoDB\n');

    const archivosCSV = fs.readdirSync(DATA_DIR).filter(f => 
      f.toLowerCase().startsWith('pie') && f.toLowerCase().endsWith('.csv')
    );

    if (archivosCSV.length === 0) {
      console.error(`❌ ERROR: No hay CSV en la carpeta data/`);
      process.exit(1);
    }

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
          if (!nro || isNaN(nro)) continue;

          const existe = await DocumentoLegislativo.findOne({ tipo: 'peticion-informe-escrito', numero: nro });
          if (existe) continue;

          const codigo = `P.I.E. N° ${nroPIE || nro}`;

          const archivoData = buscarYAsociarPDF(nro, nroPIE);
          if (archivoData) globalPDFs++;

          const nuevoDoc = new DocumentoLegislativo({
            tipo: 'peticion-informe-escrito',
            numero: nro,
            codigo: codigo,
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
          globalInsertados++;
          
          console.log(`   ✅ ${codigo} ${archivoData ? '📄 [CON PDF]' : '❌ [SIN PDF]'}`);

        } catch (err) {
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