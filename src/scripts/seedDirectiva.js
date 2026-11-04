// src/scripts/seedDirectiva.js
// Ejecutar UNA SOLA VEZ:
//   node src/scripts/seedDirectiva.js
//
// Migra la directiva hardcodeada actual a MongoDB

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const DirectivaCamaral = require('../models/DirectivaCamaral');
const Senador = require('../models/Senador');
const User = require('../models/User');

async function seedDirectiva() {
  console.log('\n' + '═'.repeat(70));
  console.log('🌱 SEED DIRECTORIO CAMARAL');
  console.log('═'.repeat(70) + '\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado a MongoDB\n');

    // 1. Verificar si ya existe
    const existe = await DirectivaCamaral.findOne({ activa: true });
    if (existe) {
      console.log('⚠️ Ya existe una directiva activa:');
      console.log(`   Gestión: ${existe.gestion}`);
      console.log(`   ID: ${existe._id}`);
      console.log('\n   Usa --force para reemplazarla.\n');
      if (!process.argv.includes('--force')) {
        await mongoose.disconnect();
        process.exit(0);
      }
      await DirectivaCamaral.deleteMany({});
      console.log('🗑️ Directiva existente eliminada\n');
    }

    // 2. Verificar que existen los senadores
    const IDS = {
      presidenteId: 32,
      primeraViceId: 6,
      segundaViceId: 12,
      primeraSecretariaId: 33,
      segundaSecretariaId: 24,
      terceraSecretariaId: 13
    };

    const senadores = await Senador.find({
      id: { $in: Object.values(IDS) },
      tipo: 'titular'
    }).lean();

    if (senadores.length !== 6) {
      console.error(`❌ Se esperaban 6 senadores titulares, se encontraron ${senadores.length}`);
      console.error('   Verifica que existan los IDs: ' + Object.values(IDS).join(', '));
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('✅ 6 senadores titulares encontrados:');
    senadores.forEach((s) => {
      console.log(`   - [${s.id}] ${s.name} (${s.partyShort})`);
    });
    console.log('');

    // 3. Buscar un admin
    let admin = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!admin) admin = await User.findOne({ role: 'ADMIN' });
    if (!admin) {
      console.error('❌ No hay usuarios admin. Ejecuta primero: node src/check-admin.js');
      await mongoose.disconnect();
      process.exit(1);
    }

    // 4. Crear la directiva
    const directiva = new DirectivaCamaral({
      gestion: '2025-2026',
      ...IDS,
      activa: true,
      creadoPor: admin._id,
      actualizadoPor: admin._id
    });

    await directiva.save();

    console.log('\n' + '═'.repeat(70));
    console.log('🎉 DIRECTIVA CREADA EXITOSAMENTE');
    console.log('═'.repeat(70));
    console.log(`   ID: ${directiva._id}`);
    console.log(`   Gestión: ${directiva.gestion}`);
    console.log('\n📋 Prueba el endpoint público:');
    console.log('   GET /api/legisladores/directiva');
    console.log('');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seedDirectiva();