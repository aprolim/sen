// src/scripts/seedPOA.js
// Carga los POAs existentes en la base de datos
// Ejecutar: node src/scripts/seedPOA.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const AuditoriaPOA = require('../models/AuditoriaPOA');
const User = require('../models/User');

// ============================================
// 🔥 DATA DE POAs
// Agrega aquí los POAs que ya existen
// ============================================
const POAS_DATA = [
  // Ejemplo:
  // {
  //   anio: 2026,
  //   titulo: 'Plan Operativo Anual - UAI 2026',
  //   fecha: '15/01/2026',
  //   estado: 'Publicado',
  //   activo: true,
  //   pdfUrl: '/uploads/documents/poa-2026.pdf'
  // },
  // {
  //   anio: 2025,
  //   titulo: 'Plan Operativo Anual - UAI 2025',
  //   fecha: '10/01/2025',
  //   estado: 'Publicado',
  //   activo: false,
  //   pdfUrl: '/uploads/documents/poa-2025.pdf'
  // }
];

// ============================================
// SCRIPT PRINCIPAL
// ============================================
async function seedPOA() {
  console.log('\n' + '═'.repeat(80));
  console.log('📋 SEED DE POA - UAI');
  console.log('═'.repeat(80) + '\n');

  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado a MongoDB\n');

    // Buscar un usuario admin para asignar como creador
    let adminUser = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!adminUser) adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) adminUser = await User.findOne({});

    if (!adminUser) {
      console.error('❌ No se encontró ningún usuario. Ejecuta primero: node src/check-admin.js');
      process.exit(1);
    }

    console.log(`👤 Usuario asignado: ${adminUser.email}\n`);

    if (POAS_DATA.length === 0) {
      console.log('ℹ️  No hay POAs en POAS_DATA. Agrega datos al array y vuelve a ejecutar.');
      console.log('   O usa el CMS para crear los POAs manualmente.');
      await mongoose.disconnect();
      process.exit(0);
    }

    const force = process.argv.includes('--force');

    const existingCount = await AuditoriaPOA.countDocuments();
    if (existingCount > 0) {
      if (!force) {
        console.log(`⚠️ Ya existen ${existingCount} POAs.`);
        console.log('   Usa --force para sobrescribir: node src/scripts/seedPOA.js --force');
        await mongoose.disconnect();
        process.exit(0);
      }
      console.log('🗑️ Eliminando POAs existentes...');
      await AuditoriaPOA.deleteMany({});
      console.log('✅ Eliminados\n');
    }

    console.log(`📝 Insertando ${POAS_DATA.length} POAs...\n`);

    for (const poaData of POAS_DATA) {
      const poa = new AuditoriaPOA({
        ...poaData,
        creadoPor: adminUser._id,
        actualizadoPor: adminUser._id
      });
      await poa.save();
      console.log(`   ✅ POA ${poa.anio} creado`);
    }

    const total = await AuditoriaPOA.countDocuments();
    console.log(`\n✅ ${total} POAs insertados exitosamente`);

    await mongoose.disconnect();
    console.log('\n' + '═'.repeat(80));
    console.log('🎉 SEED COMPLETADO');
    console.log('═'.repeat(80) + '\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seedPOA();