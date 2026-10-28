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
const PDFS_RAW_DIR = "/var/www/sen/uploads/documents/publicado en la web/GESTIÓN 2025-2026/DECLARACIONES CAMARALES 2025-2026";

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
      const lineas = parsearCSV(buffer.toString('latin1'));

      for (let i = 1; i < lineas.length; i++) {
        const fila = lineas[i];
        if (fila.length < 4) continue;

        try {
          // 🔥 BUSCAMOS EL CÓDIGO REAL EN CUALQUIER COLUMNA
          let codigoReal = null;
          for (let j = 0; j < fila.length; j++) {
            if (fila[j] && fila[j].includes('/2025-2026')) {
              codigoReal = fila[j];
              break;
            }
          }

          // Si la fila no tiene el código con /2025-2026, la saltamos
          if (!codigoReal) continue;

          // Extraemos el número puro del código (ej: "D.C. N° 001/2025-2026" -> 1)
          const matchNro = codigoReal.match(/(\d+)/);
          const nro = matchNro ? parseInt(matchNro[1]) : null;
          if (!nro || isNaN(nro)) continue;

          // Buscamos las fechas y textos. Si las columnas se corrieron, esto las salva.
          let fechaIngreso = new Date();
          let fechaAprobacion = null;
          let peticionario = '';
          let asunto = '';

          // Buscamos fechas en las columnas que tienen formato dd/mm/yyyy
          for (let j = 0; j < fila.length; j++) {
            const val = fila[j];
            if (val && val.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
              if (!fechaIngreso || fechaIngreso === new Date()) fechaIngreso = parsearFecha(val);
              else fechaAprobacion = parsearFecha(val);
            }
          }

          // Asignamos peticionario y asunto usando los índices típicos (sabiendo que puede correrse)
          // Por lo general, el proyectista es el texto antes de la fecha
          peticionario = limpiarTexto(fila[3] || fila[2]);
          asunto = limpiarTexto(fila[4] || fila[3]);

          // Si el asunto quedó vacío, usamos un texto por defecto
          if (!asunto) asunto = 'Sin asunto registrado';

          const existe = await DocumentoLegislativo.findOne({ tipo: 'declaracion-camaral', numero: nro });
          if (existe) continue;

          const archivoData = buscarYAsociarPDF(nro);
          if (archivoData) globalPDFs++;

          const nuevoDoc = new DocumentoLegislativo({
            tipo: 'declaracion-camaral',
            numero: nro,
            codigo: codigoReal,
            fechaIngreso: fechaIngreso || new Date(),
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