// src/scripts/importarHC.js
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
const PDFS_RAW_DIR = "/var/www/sen/uploads/documents/publicado en la web/GESTIÓN 2025-2026/HOMENAJES CAMARALES 2025-2026";

function limpiarTexto(texto) {
  if (!texto) return '';
  return texto.replace(/[\u0080-\u00FF]/g, (char) => {
      if (char === '\x95') return '-';
      return char;
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
  return lineas;
}

function buscarYAsociarPDF(codigoStr) {
  const match = codigoStr.match(/(\d+)\//);
  if (!match) return null;
  const numeroFormateado = match[1].padStart(3, '0');

  try {
    if (!fs.existsSync(PDFS_RAW_DIR)) return null;
    const archivos = fs.readdirSync(PDFS_RAW_DIR);
    const encontrados = archivos.filter(f => f.includes(numeroFormateado) || f.includes(`N° ${numeroFormateado}`));
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
  console.log('\n🚀 IMPORTANDO HOMENAJES CAMARALES\n');
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    const archivosCSV = fs.readdirSync(DATA_DIR).filter(f => f.toLowerCase().startsWith('hc') && f.toLowerCase().endsWith('.csv'));
    if (archivosCSV.length === 0) { console.error('❌ No hay CSV que empiecen con "hc"'); process.exit(1); }

    let adminUser = await User.findOne({ role: 'SUPER_ADMIN' }) || await User.findOne({ role: 'ADMIN' });
    let globalInsertados = 0, globalPDFs = 0;

    for (const archivo of archivosCSV) {
      console.log(`📄 Procesando: ${archivo}`);
      const buffer = fs.readFileSync(path.join(DATA_DIR, archivo));
      const lineas = parsearCSV(buffer.toString('latin1'));

      for (let i = 1; i < lineas.length; i++) {
        const fila = lineas[i];
        if (fila.length < 3) continue;

        try {
          // 🔥 BUSCAMOS LA CELDA QUE CONTENGA EL CÓDIGO REAL (H.C. O 01/2025-2026)
          let codigoReal = null;
          for (let j = 0; j < fila.length; j++) {
            const celda = fila[j];
            if (celda && celda.toUpperCase().includes('H.C.')) {
              codigoReal = limpiarTexto(celda);
              break;
            }
          }
          
          if (!codigoReal) continue;

          const matchNro = codigoReal.match(/(\d+)/);
          const nro = matchNro ? parseInt(matchNro[1]) : null;
          if (!nro || isNaN(nro)) continue;

          let fechaIngreso = null;
          let fechaAprobacion = null;
          let peticionario = '';
          let asunto = '';

          const fechasEncontradas = [];
          for (let j = 0; j < fila.length; j++) {
            const val = fila[j];
            if (val && val.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
              fechasEncontradas.push(parsearFecha(val));
            }
          }

          fechaIngreso = fechasEncontradas[0] || new Date();
          fechaAprobacion = fechasEncontradas[1] || null;

          for (let j = 0; j < fila.length; j++) {
            if (fila[j] && fila[j].length > 20 && !fila[j].includes('/')) {
              asunto = limpiarTexto(fila[j]);
              break;
            }
          }

          peticionario = limpiarTexto(fila[3] || fila[2] || 'Senador');
          if (!asunto) asunto = 'Sin asunto registrado';

          const existe = await DocumentoLegislativo.findOne({ tipo: 'homenaje-camaral', numero: nro });
          if (existe) continue;

          const archivoData = buscarYAsociarPDF(codigoReal);
          if (archivoData) globalPDFs++;

          const nuevoDoc = new DocumentoLegislativo({
            tipo: 'homenaje-camaral',
            numero: nro,
            codigo: codigoReal,
            fechaIngreso: fechaIngreso,
            peticionario: peticionario ? [peticionario] : [],
            asunto: asunto,
            fechaAprobacion: fechaAprobacion,
            archivo: archivoData || { url: null, filename: '', originalName: '', size: 0 },
            creadoPor: adminUser._id,
            actualizadoPor: adminUser._id
          });

          await nuevoDoc.save();
          globalInsertados++;
          console.log(`   ✅ ${codigoReal} ${archivoData ? '📄 [CON PDF]' : '❌ [SIN PDF]'}`);
        } catch (err) { console.error(`   ❌ Error en fila:`, err.message); }
      }
    }
    console.log(`\n🎉 COMPLETADO: ${globalInsertados} insertados, ${globalPDFs} PDFs asociados.\n`);
    await mongoose.disconnect(); process.exit(0);
  } catch (error) { console.error('❌ Error fatal:', error); process.exit(1); }
}
importar();