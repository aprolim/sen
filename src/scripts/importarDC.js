// src/scripts/importarDC.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
dotenv.config();

const DocumentoLegislativo = require('../models/DocumentoLegislativo');
const User = require('../models/User');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const PDFS_FINAL_DIR = path.join(__dirname, '..', '..', 'uploads', 'documents');
const BACKEND_URL = 'https://demoback.senado.gob.bo';

// 🔥 RUTA EXACTA DE TU IMAGEN PARA DECLARACIONES
const PDFS_RAW_DIR = "/var/www/sen/uploads/documents/publicado en la web/GESTIÓN 2025-2026/DECLARACIONES CAMARALES 2025-2026";

function limpiarTexto(texto) {
  if (!texto) return '';
  return texto.replace(/[\u0080-\u00FF]/g, (char) => {
      if (char === '\x95') return '-';
      if (['\xE1', '\xE9', '\xED', '\xF3', '\xFA', '\xF1', '\xC1', '\xC9', '\xCD', '\xD3', '\xDA', '\xD1'].includes(char)) return char;
      return '-';
    }).replace(/\s+/g, ' ').trim();
}

function parsearFecha(fechaStr) {
  if (!fechaStr || fechaStr.trim() === '') return null;
  const partes = fechaStr.trim().split('/');
  if (partes.length !== 3) return null;
  const date = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
  return isNaN(date.getTime()) ? null : date;
}

function parsearCSV(contenido) {
  const primeraLinea = contenido.split('\n')[0];
  const separador = primeraLinea.includes(';') ? ';' : ',';
  const lineas = []; let lineaActual = []; let campoActual = ''; let dentroDeComillas = false;
  for (let i = 0; i < contenido.length; i++) {
    const char = contenido[i]; const nextChar = contenido[i + 1];
    if (char === '"') {
      if (dentroDeComillas && nextChar === '"') { campoActual += '"'; i++; } else { dentroDeComillas = !dentroDeComillas; }
    } else if (char === separador && !dentroDeComillas) { lineaActual.push(campoActual.trim()); campoActual = '';
    } else if (char === '\n' && !dentroDeComillas) {
      lineaActual.push(campoActual.trim()); if (lineaActual.length > 1 || lineaActual[0] !== '') lineas.push(lineaActual);
      lineaActual = []; campoActual = '';
    } else if (char !== '\r' || dentroDeComillas) { campoActual += char; }
  }
  if (campoActual !== '' || lineaActual.length > 0) { lineaActual.push(campoActual.trim()); lineas.push(lineaActual); }
  const headers = lineas[0].map(h => h.trim()); const resultados = [];
  for (let i = 1; i < lineas.length; i++) {
    const fila = lineas[i]; const obj = {};
    for (let j = 0; j < headers.length; j++) obj[headers[j]] = fila[j] || '';
    resultados.push(obj);
  }
  return resultados;
}

function buscarYAsociarPDF(nro) {
  const numeroFormateado = String(nro).padStart(3, '0');
  try {
    if (!fs.existsSync(PDFS_RAW_DIR)) return null;
    const archivos = fs.readdirSync(PDFS_RAW_DIR);
    const encontrados = archivos.filter(f => f.includes(`N° ${numeroFormateado}`) || f.includes(`Nř ${numeroFormateado}`) || f.startsWith(`${numeroFormateado}-`));
    if (encontrados.length === 0) return null;
    
    const archivoElegido = encontrados[0];
    const origen = path.join(PDFS_RAW_DIR, archivoElegido);
    const ext = path.extname(archivoElegido);
    const basename = path.basename(archivoElegido, ext).toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
    const nuevoNombre = `${basename}-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    const destino = path.join(PDFS_FINAL_DIR, nuevoNombre);
    
    fs.renameSync(origen, destino);
    return { url: `${BACKEND_URL}/uploads/documents/${nuevoNombre}`, filename: nuevoNombre, originalName: archivoElegido, size: fs.statSync(destino).size };
  } catch (err) { return null; }
}

async function importar() {
  console.log('\n🚀 IMPORTANDO DECLARACIONES CAMARALES\n');
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    const archivosCSV = fs.readdirSync(DATA_DIR).filter(f => f.toLowerCase().startsWith('dc') && f.toLowerCase().endsWith('.csv'));
    if (archivosCSV.length === 0) { console.error('❌ No hay CSV que empiecen con "dc"'); process.exit(1); }

    let adminUser = await User.findOne({ role: 'SUPER_ADMIN' }) || await User.findOne({ role: 'ADMIN' });
    let globalInsertados = 0, globalPDFs = 0;

    for (const archivo of archivosCSV) {
      console.log(`📄 Procesando: ${archivo}`);
      const buffer = fs.readFileSync(path.join(DATA_DIR, archivo));
      const records = parsearCSV(buffer.toString('latin1'));

      for (const row of records) {
        try {
          // Mapeo de columnas típico de D.C.
          const nroStr = row['N�'] || row['Nº'];
          const nroDC = row['N� DE D.C'] || row['Nº DE D.C'] || row['Nº DE DC'] || row['N° DE D.C'];
          
          const peticionarioStr = limpiarTexto(row['PROYECTISTA']);
          const asuntoStr = limpiarTexto(row['ASUNTO']);
          const observacionStr = limpiarTexto(row['OBS.'] || row['OBSERVACION']);
          
          const fechaIngresoStr = row['FECHA DE RECEPCION  U.S.C.L y R'] || row['FECHA DE RECEPCION U.S.C.L y R'];
          const fechaAprobacionStr = row['Fecha de aprobación por el Pleno'];

          const nro = parseInt(nroStr);
          if (!nro || isNaN(nro)) continue;

          const existe = await DocumentoLegislativo.findOne({ tipo: 'declaracion-camaral', numero: nro });
          if (existe) continue;

          const codigo = `D.C. N° ${nroDC || nro}`;
          const archivoData = buscarYAsociarPDF(nro);
          if (archivoData) globalPDFs++;

          const nuevoDoc = new DocumentoLegislativo({
            tipo: 'declaracion-camaral',
            numero: nro,
            codigo: codigo,
            fechaIngreso: parsearFecha(fechaIngresoStr) || new Date(),
            peticionario: peticionarioStr ? [peticionarioStr] : [],
            asunto: asuntoStr,
            fechaAprobacion: parsearFecha(fechaAprobacionStr),
            observacion: observacionStr,
            archivo: archivoData || { url: null, filename: '', originalName: '', size: 0 },
            creadoPor: adminUser._id,
            actualizadoPor: adminUser._id
          });

          await nuevoDoc.save();
          globalInsertados++;
          console.log(`   ✅ ${codigo} ${archivoData ? '📄 [CON PDF]' : '❌ [SIN PDF]'}`);
        } catch (err) { console.error(`   ❌ Error en fila:`, err.message); }
      }
    }
    console.log(`\n🎉 COMPLETADO: ${globalInsertados} insertados, ${globalPDFs} PDFs asociados.\n`);
    await mongoose.disconnect(); process.exit(0);
  } catch (error) { console.error('❌ Error fatal:', error); process.exit(1); }
}
importar();