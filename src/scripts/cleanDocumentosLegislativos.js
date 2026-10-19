// src/scripts/cleanDocumentosLegislativos.js
// Borra TODOS los documentos legislativos y (opcionalmente) sus PDFs.
// Ejecutar: node src/scripts/cleanDocumentosLegislativos.js
//   Opciones:
//     --pdfs     también borra los PDFs de uploads/documents/ (los que empiezan con "legislativo-")
//     --yes      no pide confirmación (uso en CI)
//     --collection <nombre>  fuerza el nombre de la colección (por defecto "documentolegislativos")

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

dotenv.config();

// ============================================
// CONFIG
// ============================================
const COLLECTION_NAME = (() => {
  const idx = process.argv.indexOf('--collection');
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return 'documentolegislativos';
})();

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads', 'documents');

// ============================================
// HELPERS
// ============================================
const askQuestion = (q) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(q, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

// ============================================
// MAIN
// ============================================
async function main() {
  const skipConfirm = process.argv.includes('--yes');
  const deletePdfs = process.argv.includes('--pdfs');

  console.log('\n' + '═'.repeat(80));
  console.log('🧹 LIMPIEZA DE DOCUMENTOS LEGISLATIVOS');
  console.log('═'.repeat(80) + '\n');
  console.log(`   DB:          ${process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia'}`);
  console.log(`   Colección:   ${COLLECTION_NAME}`);
  console.log(`   Borrar PDFs: ${deletePdfs ? 'SÍ (uploads/documents/ con prefijo legislativo-)' : 'NO'}`);
  console.log('');

  if (!skipConfirm) {
    const resp = await askQuestion(
      '⚠️  Esta acción BORRA TODOS los documentos legislativos.\n' +
      '   Escribe "BORRAR" para continuar: '
    );
    if (resp.trim() !== 'BORRAR') {
      console.log('\n❌ Cancelado por el usuario.\n');
      process.exit(0);
    }
  }

  try {
    console.log('\n🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado\n');

    const db = mongoose.connection.db;
    const collection = db.collection(COLLECTION_NAME);

    // 1. Contar antes de borrar
    const totalAntes = await collection.countDocuments();
    console.log(`📊 Documentos en "${COLLECTION_NAME}": ${totalAntes}`);

    if (totalAntes === 0) {
      console.log('\nℹ️  La colección ya está vacía. Nada que borrar.\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    // 2. Borrar colección completa (más rápido que deleteMany y resetea índices)
    console.log('\n🗑️  Borrando colección completa...');
    await collection.drop();
    console.log('✅ Colección eliminada');

    // 3. Borrar PDFs de uploads/documents/ que empiecen con "legislativo-" (opcional)
    let pdfsBorrados = 0;
    if (deletePdfs && fs.existsSync(UPLOADS_DIR)) {
      const archivos = fs.readdirSync(UPLOADS_DIR);
      const pdfsLegislativos = archivos.filter(
        (f) => f.startsWith('legislativo-') && f.toLowerCase().endsWith('.pdf')
      );

      console.log(`\n📁 PDFs legislativos encontrados: ${pdfsLegislativos.length}`);

      for (const archivo of pdfsLegislativos) {
        try {
          fs.unlinkSync(path.join(UPLOADS_DIR, archivo));
          pdfsBorrados++;
        } catch (err) {
          console.log(`   ⚠️  No se pudo borrar ${archivo}: ${err.message}`);
        }
      }
      console.log(`🗑️  PDFs borrados: ${pdfsBorrados}`);
    } else if (deletePdfs) {
      console.log('\nℹ️  La carpeta uploads/documents no existe. No hay PDFs que borrar.');
    } else {
      console.log('\nℹ️  PDFs no borrados (usar --pdfs si quieres eliminarlos).');
    }

    // 4. Resumen
    console.log('\n' + '═'.repeat(80));
    console.log('✅ LIMPIEZA COMPLETADA');
    console.log('═'.repeat(80));
    console.log(`   Documentos borrados: ${totalAntes}`);
    console.log(`   PDFs borrados:       ${pdfsBorrados}`);
    console.log('═'.repeat(80) + '\n');

    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

main();