// src/scripts/seedComisiones.js
// Script para migrar los datos de comisiones y comités a MongoDB

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
    comites: [
      {
        nombre: 'COMITÉ DE CONSTITUCIÓN, LEGISLACIÓN E INTERPRETACIÓN LEGISLATIVA Y CONSTITUCIONAL',
        secretarioId: 34
      },
      {
        nombre: 'COMITÉ DE SISTEMA ELECTORAL, DERECHOS HUMANOS Y EQUIDAD SOCIAL',
        secretarioId: 8
      }
    ]
  },
  {
    nombre: 'Comisión de Justicia Plural, Ministerio Público y Defensa Legal del Estado',
    presidenteId: 19,
    comites: [
      {
        nombre: 'COMITÉ DE JUSTICIA PLURAL Y CONSEJO DE LA MAGISTRATURA',
        secretarioId: 1
      },
      {
        nombre: 'COMITÉ DE MINISTERIO PÚBLICO Y DEFENSA LEGAL DEL ESTADO',
        secretarioId: 29
      }
    ]
  },
  {
    nombre: 'Comisión de Seguridad del Estado, Fuerzas Armadas y Policía Boliviana',
    presidenteId: 2,
    comites: [
      {
        nombre: 'COMITÉ DE FUERZAS ARMADAS Y POLICÍA BOLIVIANA',
        secretarioId: 21
      },
      {
        nombre: 'COMITÉ DE SEGURIDAD DEL ESTADO Y LUCHA CONTRA EL NARCOTRÁFICO',
        secretarioId: 14
      }
    ]
  },
  {
    nombre: 'Comisión de Organización Territorial del Estado y Autonomías',
    presidenteId: 30,
    comites: [
      {
        nombre: 'COMITÉ DE AUTONOMÍAS MUNICIPALES, INDÍGENA ORIGINARIO CAMPESINAS Y REGIONALES',
        secretarioId: 20
      },
      {
        nombre: 'COMITÉ DE AUTONOMÍAS DEPARTAMENTALES',
        secretarioId: 22
      }
    ]
  },
  {
    nombre: 'Comisión de Planificación, Política Económica y Finanzas',
    presidenteId: 27,
    comites: [
      {
        nombre: 'COMITÉ DE PLANIFICACIÓN, PRESUPUESTO, INVERSIÓN PÚBLICA Y CONTRALORÍA GENERAL DEL ESTADO',
        secretarioId: 31
      },
      {
        nombre: 'COMITÉ DE POLÍTICAS FINANCIERA, MONETARIA, TRIBUTARIA Y SEGUROS',
        secretarioId: 9
      }
    ]
  },
  {
    nombre: 'Comisión de Economía Plural, Producción, Industria e Industrialización',
    presidenteId: 23,
    comites: [
      {
        nombre: 'COMITÉ DE ENERGÍA, HIDROCARBUROS, MINERÍA Y METALURGIA',
        secretarioId: 17
      },
      {
        nombre: 'COMITÉ DE ECONOMÍA PLURAL, DESARROLLO PRODUCTIVO, OBRAS PÚBLICAS E INFRAESTRUCTURA',
        secretarioId: 15
      }
    ]
  },
  {
    nombre: 'Comisión de Naciones y Pueblos Indígena Originario Campesinos e Interculturalidad',
    presidenteId: 5,
    comites: [
      {
        nombre: 'COMITÉ DE NACIONES Y PUEBLOS INDÍGENA ORIGINARIO CAMPESINOS',
        secretarioId: 18
      },
      {
        nombre: 'COMITÉ DE CULTURAS, INTERCULTURALIDAD Y PATRIMONIO CULTURAL',
        secretarioId: 10
      }
    ]
  },
  {
    nombre: 'Comisión de Política Social, Educación y Salud',
    presidenteId: 36,
    comites: [
      {
        nombre: 'COMITÉ DE EDUCACIÓN, SALUD, CIENCIA, TECNOLOGÍA Y DEPORTES',
        secretarioId: 35
      },
      {
        nombre: 'COMITÉ DE VIVIENDA, RÉGIMEN LABORAL, SEGURIDAD INDUSTRIAL Y SEGURIDAD SOCIAL',
        secretarioId: 3
      }
    ]
  },
  {
    nombre: 'Comisión de Política Internacional',
    presidenteId: 7,
    comites: [
      {
        nombre: 'COMITÉ DE ASUNTOS EXTERIORES, INTERPARLAMENTARIOS Y ORGANISMOS INTERNACIONALES',
        secretarioId: 16
      },
      {
        nombre: 'COMITÉ DE RELACIONES ECONÓMICAS INTERNACIONALES',
        secretarioId: 4
      }
    ]
  },
  {
    nombre: 'Comisión de Tierra y Territorio, Recursos Naturales y Medio Ambiente',
    presidenteId: 11,
    comites: [
      {
        nombre: 'COMITÉ DE TIERRA Y TERRITORIO, RECURSOS NATURALES Y HOJA DE LA COCA',
        secretarioId: 25
      },
      {
        nombre: 'COMITÉ DE MEDIO AMBIENTE, BIODIVERSIDAD, AMAZONÍA, ÁREAS PROTEGIDAS Y CAMBIO CLIMÁTICO',
        secretarioId: 26
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
  console.log('═'.repeat(80) + '\n');

  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado a MongoDB\n');

    const Comision = require('../models/Comision');
    
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

    console.log(`📝 Insertando ${COMISIONES_DATA.length} comisiones...\n`);
    
    await Comision.insertMany(COMISIONES_DATA);
    console.log(`✅ ${COMISIONES_DATA.length} comisiones insertadas exitosamente`);

    const total = await Comision.countDocuments();
    console.log(`\n📊 Total en base de datos: ${total} comisiones`);

    const sample = await Comision.find().limit(3).lean();
    console.log('\n📋 Muestra de las primeras 3:');
    sample.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.nombre}`);
      console.log(`      Comités: ${c.comites?.length || 0}`);
    });

    await mongoose.disconnect();
    console.log('\n' + '═'.repeat(80));
    console.log('🎉 SEED DE COMISIONES COMPLETADO CON ÉXITO');
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