// src/scripts/importarPIE.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const DocumentoLegislativo = require('../models/DocumentoLegislativo');
const User = require('../models/User');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// Función para parsear CSV nativo (auto-detecta si usa ; o ,)
function parsearCSV(contenido) {
  // Detectamos el separador mirando la primera línea
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

  // Convertir a objetos
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

  return { resultados, headers, separador };
}

async function diagnostico() {
  console.log('\n🔍 INICIANDO DIAGNÓSTICO...\n');

  const archivosCSV = fs.readdirSync(DATA_DIR).filter(f => f.toLowerCase().endsWith('.csv'));

  if (archivosCSV.length === 0) {
    console.log('❌ No hay archivos CSV en la carpeta data/');
    process.exit(0);
  }

  const archivo = archivosCSV[0];
  console.log(`📄 Archivo analizado: ${archivo}`);
  
  const contenido = fs.readFileSync(path.join(DATA_DIR, archivo), 'utf8');
  const { resultados, headers, separador } = parsearCSV(contenido);

  console.log(`\n🔹 Separador detectado: "${separador}"`);
  console.log(`🔹 Cantidad de columnas detectadas: ${headers.length}`);
  
  console.log('\n📋 NOMBRES DE LAS COLUMNAS (Headers):');
  headers.forEach((h, i) => console.log(`   [${i}] "${h}"`));

  console.log('\n📋 PRIMERA FILA DE DATOS (Row 1):');
  if (resultados.length > 0) {
    const row = resultados[0];
    Object.keys(row).forEach(key => {
      const val = row[key] ? String(row[key]).substring(0, 50) + '...' : '(VACÍO)';
      console.log(`   "${key}" => "${val}"`);
    });
  }

  console.log('\n🧪 PROBANDO EXTRACCIÓN DEL NÚMERO (Nº):');
  if (resultados.length > 0) {
    const row = resultados[0];
    // Buscamos la llave que contenga "Nº" o similar
    const llaveNumero = Object.keys(row).find(k => k.toLowerCase().includes('nº') || k.toLowerCase() === 'nro');
    console.log(`   Llave encontrada: "${llaveNumero}"`);
    console.log(`   Valor crudo: "${row[llaveNumero]}"`);
    console.log(`   parseInt(): ${parseInt(row[llaveNumero])}`);
  }

  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('👉 Copiá y pegá todo este texto en el chat para que lo revise.');
  console.log('══════════════════════════════════════════════════════════════════════\n');
}

diagnostico();