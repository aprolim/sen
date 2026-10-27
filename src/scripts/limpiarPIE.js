// src/scripts/limpiarPIE.js
// Ejecutar: node src/scripts/limpiarPIE.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const readline = require('readline');

dotenv.config();

const DocumentoLegislativo = require('../models/DocumentoLegislativo');

const askQuestion = (q) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(q, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

async function limpiar() {
  console.log('\n' + '═'.repeat(60));
  console.log('🧹 LIMPIEZA DE BASE DE DATOS (P.I.E.)');
  console.log('═'.repeat(60) + '\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado a MongoDB\n');

    // Contar cuántos hay
    const total = await DocumentoLegislativo.countDocuments({ tipo: 'peticion-informe-escrito' });
    console.log(`📊 Hay ${total} documentos P.I.E. en la base de datos.`);

    if (total === 0) {
      console.log('ℹ️ No hay nada que borrar.\n');
      process.exit(0);
    }

    // Confirmación
    const resp = await askQuestion(
      '⚠️ Esta acción BORRARÁ LOS REGISTROS DE LA BASE DE DATOS.\n' +
      '   Los archivos PDF en la carpeta uploads/ NO SE TOCARÁN.\n' +
      '   ¿Estás seguro? Escribe "BORRAR" para confirmar: '
    );

    if (resp.trim() !== 'BORRAR') {
      console.log('\n❌ Cancelado por el usuario.\n');
      process.exit(0);
    }

    console.log('\n🗑️ Borrando registros de la base de datos...');
    
    // Borramos físicamente los registros de este tipo
    const result = await DocumentoLegislativo.deleteMany({ tipo: 'peticion-informe-escrito' });
    
    console.log(`✅ Se borraron ${result.deletedCount} registros P.I.E. de MongoDB.`);
    console.log('   (Los PDFs siguen intactos en el servidor).\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

limpiar();