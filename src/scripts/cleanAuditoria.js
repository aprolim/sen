// src/scripts/cleanAuditoria.js
// Borra TODAS las categorías, documentos y PDFs de auditoría
// Ejecutar: node src/scripts/cleanAuditoria.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const AuditoriaCategoria = require('../models/AuditoriaCategoria');
const AuditoriaDocumento = require('../models/AuditoriaDocumento');
const AuditoriaPOA = require('../models/AuditoriaPOA');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads', 'documents');

async function cleanAuditoria() {
  console.log('\n' + '═'.repeat(80));
  console.log('🧹 LIMPIEZA DE DATOS DE AUDITORÍA');
  console.log('═'.repeat(80) + '\n');

  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado\n');

    // ============================================
    // 1. Borrar categorías
    // ============================================
    const categoriasBorradas = await AuditoriaCategoria.deleteMany({});
    console.log(`🗑️  Categorías borradas: ${categoriasBorradas.deletedCount}`);

    // ============================================
    // 2. Borrar documentos
    // ============================================
    const docsBorrados = await AuditoriaDocumento.deleteMany({});
    console.log(`🗑️  Documentos borrados: ${docsBorrados.deletedCount}`);

    // ============================================
    // 3. Borrar POAs
    // ============================================
    const poasBorrados = await AuditoriaPOA.deleteMany({});
    console.log(`🗑️  POAs borrados: ${poasBorrados.deletedCount}`);

    // ============================================
    // 4. Borrar PDFs físicos
    // ============================================
    if (fs.existsSync(UPLOADS_DIR)) {
      const archivos = fs.readdirSync(UPLOADS_DIR);
      const pdfsAuditoria = archivos.filter(f => f.startsWith('auditoria-') && f.endsWith('.pdf'));

      console.log(`\n📁 Borrando ${pdfsAuditoria.length} PDFs de auditoría...`);

      let borrados = 0;
      for (const archivo of pdfsAuditoria) {
        try {
          fs.unlinkSync(path.join(UPLOADS_DIR, archivo));
          borrados++;
        } catch (err) {
          console.log(`   ⚠️  No se pudo borrar: ${archivo} — ${err.message}`);
        }
      }
      console.log(`🗑️  PDFs borrados: ${borrados}/${pdfsAuditoria.length}`);
    } else {
      console.log('ℹ️  La carpeta uploads/documents no existe (nada que borrar)');
    }

    // ============================================
    // 5. Resumen
    // ============================================
    console.log('\n' + '═'.repeat(80));
    console.log('✅ LIMPIEZA COMPLETADA');
    console.log('═'.repeat(80));
    console.log(`   Categorías:  ${categoriasBorradas.deletedCount}`);
    console.log(`   Documentos:  ${docsBorrados.deletedCount}`);
    console.log(`   POAs:        ${poasBorrados.deletedCount}`);
    console.log('═'.repeat(80) + '\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

cleanAuditoria();