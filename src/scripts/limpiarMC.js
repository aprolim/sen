// src/scripts/limpiarMC.js
// Ejecutar: node src/scripts/limpiarMC.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const readline = require('readline');
dotenv.config();

const DocumentoLegislativo = require('../models/DocumentoLegislativo');

const askQuestion = (q) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(q, (answer) => { rl.close(); resolve(answer); });
});

async function limpiar() {
  console.log('\n' + '═'.repeat(60));
  console.log('🧹 LIMPIEZA DE BASE DE DATOS (MINUTAS DE COMUNICACIÓN)');
  console.log('═'.repeat(60) + '\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado a MongoDB\n');

    const total = await DocumentoLegislativo.countDocuments({ tipo: 'minuta-comunicacion' });
    console.log(`📊 Hay ${total} registros de Minutas de Comunicación.`);

    if (total === 0) {
      console.log('ℹ️ No hay nada que borrar.\n');
      process.exit(0);
    }

    const resp = await askQuestion(
      '⚠️ Esta acción BORRARÁ LOS REGISTROS DE LA BASE DE DATOS.\n' +
      '   Los archivos PDF en la carpeta uploads/ NO SE TOCARÁN.\n' +
      '   ¿Estás seguro? Escribe "BORRAR" para confirmar: '
    );

    if (resp.trim() !== 'BORRAR') {
      console.log('\n❌ Cancelado por el usuario.\n');
      process.exit(0);
    }

    const result = await DocumentoLegislativo.deleteMany({ tipo: 'minuta-comunicacion' });
    
    console.log(`✅ Se borraron ${result.deletedCount} registros de M.C.\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

limpiar();