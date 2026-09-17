// src/scripts/migrateAuditoriaPDFs.js
// Descarga todos los PDFs externos y los sube al backend
// Ejecutar: node src/scripts/migrateAuditoriaPDFs.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

dotenv.config();

const AuditoriaDocumento = require('../models/AuditoriaDocumento');

// ============================================
// CONFIGURACIÓN
// ============================================
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads', 'documents');
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const CONCURRENT_DOWNLOADS = 3;

// ============================================
// HELPER: Descarga un archivo
// ============================================
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    const request = client.get(url, { timeout: 30000 }, (response) => {
      // Redirecciones
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode}`));
      }

      const file = fs.createWriteStream(dest);
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });

      file.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    });

    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// ============================================
// GENERAR NOMBRE ÚNICO DE ARCHIVO
// Usa el _id del documento para garantizar unicidad
// ============================================
function generarNombreArchivo(doc) {
  const slug = (doc.titulo || 'sin-titulo')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40);

  // 🔥 Usar _id garantiza unicidad absoluta
  return `auditoria-${doc.modulo}-${slug}-${doc._id}.pdf`;
}

// ============================================
// MIGRAR UN DOCUMENTO
// ============================================
async function migrarDocumento(doc) {
  // Si ya está local, marcar como migrado
  if (doc.url && doc.url.includes('/uploads/documents/')) {
    doc.migrado = true;
    await doc.save();
    return { status: 'ya_local', doc };
  }

  // Validar URL
  if (!doc.url || !doc.url.startsWith('http')) {
    doc.migrado = true;
    await doc.save();
    throw new Error('URL inválida o vacía');
  }

  const fileName = generarNombreArchivo(doc);
  const filePath = path.join(UPLOADS_DIR, fileName);

  try {
    await downloadFile(doc.url, filePath);

    // Verificar tamaño mínimo
    const stats = fs.statSync(filePath);
    if (stats.size < 1024) {
      fs.unlinkSync(filePath);
      throw new Error('Archivo muy pequeño (posible error 404)');
    }

    // Actualizar documento
    doc.urlOriginal = doc.urlOriginal || doc.url;
    doc.url = `${BACKEND_URL}/uploads/documents/${fileName}`;
    doc.migrado = true;
    await doc.save();

    return { status: 'ok', doc, size: stats.size, fileName };
  } catch (err) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Marcar como migrado aunque haya fallado
    doc.migrado = true;
    doc.estado = 'En Revisión';
    await doc.save();

    throw err;
  }
}

// ============================================
// SCRIPT PRINCIPAL
// ============================================
async function migrateAuditoriaPDFs() {
  console.log('\n' + '═'.repeat(80));
  console.log('🚚 MIGRACIÓN DE PDFs DE AUDITORÍA');
  console.log('═'.repeat(80) + '\n');

  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado\n');

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      console.log(`📁 Carpeta creada: ${UPLOADS_DIR}\n`);
    }

    const documentos = await AuditoriaDocumento.find({
      migrado: false,
      url: { $ne: null }
    });

    console.log(`📊 ${documentos.length} documentos pendientes de migrar`);
    console.log(`⚙️  Descargas concurrentes: ${CONCURRENT_DOWNLOADS}`);
    console.log(`📍 Backend URL: ${BACKEND_URL}\n`);

    if (documentos.length === 0) {
      console.log('✅ No hay documentos pendientes de migrar\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    const resultados = { ok: 0, fallidos: 0, omitidos: 0, total: documentos.length };
    const errores = [];

    for (let i = 0; i < documentos.length; i += CONCURRENT_DOWNLOADS) {
      const lote = documentos.slice(i, i + CONCURRENT_DOWNLOADS);
      const promesas = lote.map(doc => migrarDocumento(doc));
      const resultadosLote = await Promise.allSettled(promesas);

      resultadosLote.forEach((result, idx) => {
        const doc = lote[idx];
        const contador = resultados.ok + resultados.fallidos + resultados.omitidos;

        if (result.status === 'fulfilled') {
          if (result.value.status === 'ya_local') {
            resultados.omitidos++;
            console.log(`   ⏭️  [${contador + 1}/${documentos.length}] ${doc.titulo} (ya local)`);
          } else {
            resultados.ok++;
            const sizeMB = (result.value.size / 1024 / 1024).toFixed(2);
            console.log(`   ✅ [${contador + 1}/${documentos.length}] ${doc.titulo} (${sizeMB} MB)`);
          }
        } else {
          resultados.fallidos++;
          errores.push({ titulo: doc.titulo, url: doc.urlOriginal || doc.url, error: result.reason.message });
          console.log(`   ❌ [${contador + 1}/${documentos.length}] ${doc.titulo} — ${result.reason.message}`);
        }
      });
    }

    console.log('\n' + '═'.repeat(80));
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('═'.repeat(80));
    console.log(`   ✅ Migrados:  ${resultados.ok}`);
    console.log(`   ⏭️  Omitidos:  ${resultados.omitidos}`);
    console.log(`   ❌ Fallidos:  ${resultados.fallidos}`);
    console.log(`   📊 Total:     ${resultados.total}`);

    if (errores.length > 0) {
      console.log('\n❌ ERRORES DETALLADOS:');
      errores.forEach((e, i) => {
        console.log(`   ${i + 1}. ${e.titulo}`);
        console.log(`      URL: ${e.url}`);
        console.log(`      ${e.error}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n' + '═'.repeat(80));
    console.log('🎉 MIGRACIÓN COMPLETADA');
    console.log('═'.repeat(80) + '\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR GENERAL:', error.message);
    console.error(error.stack);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

migrateAuditoriaPDFs();