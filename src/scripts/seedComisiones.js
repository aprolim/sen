// src/scripts/seedComisiones.js
// Script para migrar los datos de comisiones y comités a MongoDB
// VERSIÓN CON CARGOS CORRECTOS

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// ============================================
// 🔥 DATA COMPLETA DE COMISIONES Y COMITÉS
// ============================================
const COMISIONES_DATA = [
  {
    nombre: 'Comisión de Constitución, Derechos Humanos, Legislación y Sistema Electoral',
    presidenteId: 28,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      {
        nombre: 'COMITÉ DE CONSTITUCIÓN, LEGISLACIÓN E INTERPRETACIÓN LEGISLATIVA Y CONSTITUCIONAL',
        secretarioId: 34,
        cargoSecretario: 'SECRETARIO DE COMITÉ'
      },
      {
        nombre: 'COMITÉ DE SISTEMA ELECTORAL, DERECHOS HUMANOS Y EQUIDAD SOCIAL',
        secretarioId: 8,
        cargoSecretario: 'SECRETARIA DE COMITÉ'
      }
    ]
  },
  {
    nombre: 'Comisión de Justicia Plural, Ministerio Público y Defensa Legal del Estado',
    presidenteId: 19,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      {
        nombre: 'COMITÉ DE JUSTICIA PLURAL Y CONSEJO DE LA MAGISTRATURA',
        secretarioId: 1,
        cargoSecretario: 'SECRETARIO DE COMITÉ'
      },
      {
        nombre: 'COMITÉ DE MINISTERIO PÚBLICO Y DEFENSA LEGAL DEL ESTADO',
        secretarioId: 29,
        cargoSecretario: 'SECRETARIA DE COMITÉ'
      }
    ]
  },
  {
    nombre: 'Comisión de Seguridad del Estado, Fuerzas Armadas y Policía Boliviana',
    presidenteId: 2,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      {
        nombre: 'COMITÉ DE FUERZAS ARMADAS Y POLICÍA BOLIVIANA',
        secretarioId: 21,
        cargoSecretario: 'SECRETARIA DE COMITÉ'
      },
      {
        nombre: 'COMITÉ DE SEGURIDAD DEL ESTADO Y LUCHA CONTRA EL NARCOTRÁFICO',
        secretarioId: 14,
        cargoSecretario: 'SECRETARIA DE COMITÉ'
      }
    ]
  },
  {
    nombre: 'Comisión de Organización Territorial del Estado y Autonomías',
    presidenteId: 30,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      {
        nombre: 'COMITÉ DE AUTONOMÍAS MUNICIPALES, INDÍGENA ORIGINARIO CAMPESINAS Y REGIONALES',
        secretarioId: 20,
        cargoSecretario: 'SECRETARIO DE COMITÉ'
      },
      {
        nombre: 'COMITÉ DE AUTONOMÍAS DEPARTAMENTALES',
        secretarioId: 22,
        cargoSecretario: 'SECRETARIO DE COMITÉ'
      }
    ]
  },
  {
    nombre: 'Comisión de Planificación, Política Económica y Finanzas',
    presidenteId: 27,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      {
        nombre: 'COMITÉ DE PLANIFICACIÓN, PRESUPUESTO, INVERSIÓN PÚBLICA Y CONTRALORÍA GENERAL DEL ESTADO',
        secretarioId: 31,
        cargoSecretario: 'SECRETARIA DE COMITÉ'
      },
      {
        nombre: 'COMITÉ DE POLÍTICAS FINANCIERA, MONETARIA, TRIBUTARIA Y SEGUROS',
        secretarioId: 9,
        cargoSecretario: 'SECRETARIO DE COMITÉ'
      }
    ]
  },
  {
    nombre: 'Comisión de Economía Plural, Producción, Industria e Industrialización',
    presidenteId: 23,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      {
        nombre: 'COMITÉ DE ENERGÍA, HIDROCARBUROS, MINERÍA Y METALURGIA',
        secretarioId: 17,
        cargoSecretario: 'SECRETARIO DE COMITÉ'
      },
      {
        nombre: 'COMITÉ DE ECONOMÍA PLURAL, DESARROLLO PRODUCTIVO, OBRAS PÚBLICAS E INFRAESTRUCTURA',
        secretarioId: 15,
        cargoSecretario: 'SECRETARIA DE COMITÉ'
      }
    ]
  },
  {
    nombre: 'Comisión de Naciones y Pueblos Indígena Originario Campesinos e Interculturalidad',
    presidenteId: 5,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      {
        nombre: 'COMITÉ DE NACIONES Y PUEBLOS INDÍGENA ORIGINARIO CAMPESINOS',
        secretarioId: 18,
        cargoSecretario: 'SECRETARIA DE COMITÉ'
      },
      {
        nombre: 'COMITÉ DE CULTURAS, INTERCULTURALIDAD Y PATRIMONIO CULTURAL',
        secretarioId: 10,
        cargoSecretario: 'SECRETARIA DE COMITÉ'
      }
    ]
  },
  {
    nombre: 'Comisión de Política Social, Educación y Salud',
    presidenteId: 36,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      {
        nombre: 'COMITÉ DE EDUCACIÓN, SALUD, CIENCIA, TECNOLOGÍA Y DEPORTES',
        secretarioId: 35,
        cargoSecretario: 'SECRETARIA DE COMITÉ'
      },
      {
        nombre: 'COMITÉ DE VIVIENDA, RÉGIMEN LABORAL, SEGURIDAD INDUSTRIAL Y SEGURIDAD SOCIAL',
        secretarioId: 3,
        cargoSecretario: 'SECRETARIA DE COMITÉ'
      }
    ]
  },
  {
    nombre: 'Comisión de Política Internacional',
    presidenteId: 7,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      {
        nombre: 'COMITÉ DE ASUNTOS EXTERIORES, INTERPARLAMENTARIOS Y ORGANISMOS INTERNACIONALES',
        secretarioId: 16,
        cargoSecretario: 'SECRETARIA DE COMITÉ'
      },
      {
        nombre: 'COMITÉ DE RELACIONES ECONÓMICAS INTERNACIONALES',
        secretarioId: 4,
        cargoSecretario: 'SECRETARIA DE COMITÉ'
      }
    ]
  },
  {
    nombre: 'Comisión de Tierra y Territorio, Recursos Naturales y Medio Ambiente',
    presidenteId: 11,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      {
        nombre: 'COMITÉ DE TIERRA Y TERRITORIO, RECURSOS NATURALES Y HOJA DE LA COCA',
        secretarioId: 25,
        cargoSecretario: 'SECRETARIA DE COMITÉ'
      },
      {
        nombre: 'COMITÉ DE MEDIO AMBIENTE, BIODIVERSIDAD, AMAZONÍA, ÁREAS PROTEGIDAS Y CAMBIO CLIMÁTICO',
        secretarioId: 26,
        cargoSecretario: 'SECRETARIA DE COMITÉ'
      }
    ]
  }
];

// ============================================
// SCRIPT PRINCIPAL
// ============================================
async function seedComisiones() {
  console.log('\n' + '═'.repeat(80));
  console.log('📋 SEED DE COMISIONES Y COMITÉS');
  console.log('   Migrando datos a MongoDB');
  console.log('   ✅ Incluye cargos: Presidente, Secretario, etc.');
  console.log('═'.repeat(80) + '\n');

  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado a MongoDB\n');

    const Comision = require('../models/Comision');
    const Senador = require('../models/Senador');
    
    // 1. Eliminar comisiones existentes
    const existingCount = await Comision.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️ Ya existen ${existingCount} comisiones.`);
      const force = process.argv.includes('--force');
      if (!force) {
        console.log('   Usa --force para sobrescribir: node src/scripts/seedComisiones.js --force');
        process.exit(0);
      }
      console.log('🗑️ Eliminando comisiones existentes...');
      await Comision.deleteMany({});
      console.log('✅ Eliminados\n');
    }

    // 2. ACTUALIZAR CARGOS DE LOS SENADORES
    console.log('🔄 Actualizando cargos de senadores...\n');

    // Recolectar todos los senadores que necesitan cargo actualizado
    const updates = [];
    
    COMISIONES_DATA.forEach(comision => {
      // Presidente
      updates.push({
        id: comision.presidenteId,
        cargo: comision.cargoPresidente
      });
      
      // Secretarios de comités
      comision.comites.forEach(comite => {
        updates.push({
          id: comite.secretarioId,
          cargo: comite.cargoSecretario
        });
      });
    });

    // Ejecutar actualizaciones de cargos
    for (const update of updates) {
      const result = await Senador.updateOne(
        { id: update.id },
        { $set: { cargo: update.cargo } }
      );
      if (result.modifiedCount > 0) {
        console.log(`   ✅ Actualizado senador ID ${update.id} → "${update.cargo}"`);
      }
    }

    console.log('\n✅ Cargos actualizados correctamente\n');

    // 3. Insertar comisiones
    console.log(`📝 Insertando ${COMISIONES_DATA.length} comisiones...\n`);
    
    await Comision.insertMany(COMISIONES_DATA);
    console.log(`✅ ${COMISIONES_DATA.length} comisiones insertadas exitosamente`);

    // 4. Verificar
    const total = await Comision.countDocuments();
    console.log(`\n📊 Total en base de datos: ${total} comisiones`);

    const sample = await Comision.find().limit(3).lean();
    console.log('\n📋 Muestra de las primeras 3:');
    sample.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.nombre}`);
      console.log(`      Presidente ID: ${c.presidenteId}`);
      console.log(`      Comités: ${c.comites?.length || 0}`);
    });

    // 5. Verificar senadores con cargo actualizado
    const senadoresConCargo = await Senador.find(
      { cargo: { $ne: 'Senador' } },
      { name: 1, cargo: 1, _id: 0 }
    ).limit(10).lean();
    
    console.log('\n👥 Senadores con cargos especiales:');
    senadoresConCargo.forEach(s => {
      console.log(`   - ${s.name}: ${s.cargo}`);
    });

    await mongoose.disconnect();
    console.log('\n' + '═'.repeat(80));
    console.log('🎉 SEED DE COMISIONES COMPLETADO CON ÉXITO');
    console.log('   ✅ Cargos actualizados');
    console.log('   ✅ Comisiones insertadas');
    console.log('═'.repeat(80) + '\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seedComisiones();