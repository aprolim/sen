// src/scripts/limpiarHC.js
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
  console.log('\n🧹 LIMPIEZA DE HOMENAJES (H.C.)\n');
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    const total = await DocumentoLegislativo.countDocuments({ tipo: 'homenaje-camaral' });
    console.log(`📊 Hay ${total} Homenajes Camarales en BD.`);
    if (total === 0) { console.log('ℹ️ Nada que borrar.'); process.exit(0); }

    const resp = await askQuestion('⚠️ Escribe "BORRAR" para confirmar: ');
    if (resp.trim() !== 'BORRAR') { console.log('❌ Cancelado.'); process.exit(0); }

    const result = await DocumentoLegislativo.deleteMany({ tipo: 'homenaje-camaral' });
    console.log(`✅ Se borraron ${result.deletedCount} registros.\n`);
    await mongoose.disconnect(); process.exit(0);
  } catch (error) { console.error('❌ Error:', error.message); process.exit(1); }
}
limpiar();