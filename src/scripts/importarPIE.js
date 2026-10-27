// src/scripts/importarPIE.js
// Ejecutar: node src/scripts/importarPIE.js
// Este script lee TODOS los archivos .csv de la carpeta "data" que empiecen con "pie"

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

dotenv.config();

const DocumentoLegislativo = require('../models/DocumentoLegislativo');
const User = require('../models/User');
const TipoDestinatario = require('../models/TipoDestinatario');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// Función robusta para convertir "1/12/2025" o "01/12/2025" a Date de Mongo
function parsearFecha(fechaStr) {
  if (!fechaStr || fechaStr.trim() === '' || fechaStr.trim() === '-') return null;
  const partes = fechaStr.trim().split('/');
  if (partes.length !== 3) return null;
  const date = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
  return isNaN(date.getTime()) ? null : date;
}

// Función para buscar una columna sin importar espacios extra o mayúsculas
function getValor(row, posiblesNombres) {
  for (const nombre of posiblesNombres) {
    // Buscamos la llave exacta o una que coincida ignorando espacios
    const key = Object.keys(row).find(k => 
      k.trim().toLowerCase() === nombre.trim().toLowerCase()
    );
    if (key && row[key]) {
      return row[key];
    }
  }
  return null;
}

async function importar() {
  console.log('\n' + '═'.repeat(70));
  console.log('🚀 IMPORTADOR MASIVO DE P.I.E. (PETICIONES DE INFORME ESCRITO)');
  console.log('═'.repeat(70) + '\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado a MongoDB\n');

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`📁 Carpeta creada: ${DATA_DIR}`);
      console.log('   Por favor, coloca tus archivos .csv ahí y vuelve a ejecutar.\n');
      process.exit(0);
    }

    const archivos = fs.readdirSync(DATA_DIR).filter(f => 
      f.toLowerCase().startsWith('pie') && f.toLowerCase().endsWith('.csv')
    );

    if (archivos.length === 0) {
      console.log('⚠️ No se encontraron archivos CSV que empiecen con "pie" en la carpeta data/');
      console.log('   Ejemplos válidos: pie-1.csv, pie-datos.csv, PIE_2025.csv\n');
      process.exit(0);
    }

    console.log(`📂 Archivos encontrados para procesar: ${archivos.length}`);
    archivos.forEach(f => console.log(`   - ${f}`));
    console.log('');

    let adminUser = await User.findOne({ role: 'SUPER_ADMIN' }) || await User.findOne({ role: 'ADMIN' });
    if (!adminUser) {
      console.error('❌ No hay usuarios admin.');
      process.exit(1);
    }

    const tiposDB = await TipoDestinatario.find({ activo: true });
    const tiposNombres = tiposDB.map(t => t.nombre);

    let globalInsertados = 0;
    let globalOmitidos = 0;
    let globalErrores = 0;

    for (const archivo of archivos) {
      console.log(`\n📄 Procesando archivo: ${archivo}`);
      console.log('─'.repeat(50));
      
      const csvPath = path.join(DATA_DIR, archivo);
      const fileContent = fs.readFileSync(csvPath, 'utf8');
      
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true
      });

      console.log(`   Filas detectadas: ${records.length}`);

      let insertados = 0;
      let omitidos = 0;
      let errores = 0;

      for (const row of records) {
        try {
          // 🔥 Usamos getValor para evitar errores por espacios en los encabezados
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
          if (!nro || isNaN(nro)) {
            omitidos++;
            continue;
          }

          if (tipoDestinatarioStr && !tiposNombres.includes(tipoDestinatarioStr.trim())) {
            console.log(`   ⚠️ Nº ${nro}: Tipo "${tipoDestinatarioStr}" no existe en BD. Omitido.`);
            omitidos++;
            continue;
          }

          const existe = await DocumentoLegislativo.findOne({ 
            tipo: 'peticion-informe-escrito', 
            numero: nro 
          });
          
          if (existe) {
            omitidos++;
            continue;
          }

          const codigo = `P.I.E. N° ${nroPIE || nro}`;
          
          // Limpiamos el asunto de saltos de línea y comillas extras
          const asuntoLimpio = asuntoStr ? asuntoStr.replace(/\r?\n|\r/g, ' ').replace(/"/g, '').trim() : '';

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
            
            archivo: { url: null, filename: '', originalName: '', size: 0 },

            creadoPor: adminUser._id,
            actualizadoPor: adminUser._id
          });

          await nuevoDoc.save();
          insertados++;
          console.log(`   ✅ ${codigo} - ${peticionarioStr}`);

        } catch (err) {
          console.error(`   ❌ Error en fila Nº ${getValor(row, ['Nº'])}:`, err.message);
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
    console.log(`   ✅ Total Insertados: ${globalInsertados}`);
    console.log(`   ⏭️  Total Omitidos: ${globalOmitidos}`);
    console.log(`   ❌ Total Errores: ${globalErrores}`);
    console.log('═'.repeat(70) + '\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

importar();