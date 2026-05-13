// src/scripts/seedContent.js
// Ejecutar: node src/scripts/seedContent.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Content = require('../models/Content');
const User = require('../models/User');

dotenv.config();

// CATEGORÍAS VÁLIDAS según el modelo Content
const VALID_CATEGORIES = [
  'institucional',
  'historia',
  'directiva',
  'noticias',
  'eventos',
  'transparencia',
  'participacion',
  'legislacion'
];

// Datos de ejemplo con categorías VÁLIDAS
const sampleNews = [
  {
    title: 'Senado aprueba Ley de Desarrollo Económico',
    slug: 'senado-aprueba-ley-desarrollo-economico',
    content: '<p>El pleno del Senado aprobó por unanimidad la nueva Ley de Desarrollo Económico. Esta normativa contempla beneficios tributarios para pequeñas y medianas empresas, así como líneas de crédito con tasas preferenciales para emprendedores.</p><p>"Es un día histórico para el desarrollo productivo de Bolivia", declaró el presidente del Senado. La ley fue trabajada en consenso con todas las fuerzas políticas y organizaciones sociales del país.</p><p>Entre los principales puntos de la ley se destacan: la creación de un fondo de garantía para MIPYMES, la simplificación de trámites para la creación de empresas, y beneficios fiscales para industrias que generen empleo.</p>',
    excerpt: 'Nueva ley beneficiará a emprendedores y pequeñas empresas con créditos y beneficios tributarios',
    type: 'news',
    category: 'legislacion',  // ✅ VÁLIDA
    tags: ['economia', 'desarrollo', 'leyes', 'emprendedores'],
    status: 'published',
    featuredImage: { 
      url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800', 
      alt: 'Pleno del Senado' 
    },
    views: 0
  },
  {
    title: 'Comisión de Educación recibe propuestas para reforma curricular',
    slug: 'comision-educacion-reforma-curricular',
    content: '<p>La Comisión de Educación del Senado recibió más de 200 propuestas para la reforma curricular de los niveles primario y secundario. Instituciones educativas, gremios de maestros y padres de familia participaron en las audiencias públicas.</p><p>El senador presidente de la comisión destacó la amplia participación ciudadana y anunció que las propuestas serán sistematizadas para elaborar un proyecto de ley integral.</p><p>"La educación es la base del desarrollo, por eso es fundamental escuchar a todos los actores", afirmó.</p>',
    excerpt: 'Más de 200 propuestas fueron presentadas por instituciones educativas y gremios de maestros',
    type: 'news',
    category: 'institucional',  // ✅ VÁLIDA (cambié de 'educacion' a 'institucional')
    tags: ['educacion', 'reforma', 'curriculo', 'maestros'],
    status: 'published',
    featuredImage: { 
      url: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800', 
      alt: 'Comisión de Educación' 
    },
    views: 0
  },
  {
    title: 'Senado conmemora el Día de la Madre Tierra con declaración ambiental',
    slug: 'senado-dia-madre-tierra',
    content: '<p>En sesión especial, el Senado reafirmó su compromiso con la protección del medio ambiente y los recursos naturales. Se aprobó una declaración camaral que insta al poder ejecutivo a fortalecer las políticas de conservación.</p><p>La declaración reconoce la importancia de los pueblos indígenas en la protección de los bosques y ecosistemas, y promueve la implementación de energías renovables.</p><p>"Bolivia es un país rico en biodiversidad y debemos protegerla para las futuras generaciones", expresó la senadora promotora de la iniciativa.</p>',
    excerpt: 'Compromiso con la protección del medio ambiente y los recursos naturales en sesión especial',
    type: 'news',
    category: 'institucional',  // ✅ VÁLIDA (cambié de 'medio-ambiente' a 'institucional')
    tags: ['medio-ambiente', 'sostenibilidad', 'cambio-climatico', 'biodiversidad'],
    status: 'published',
    featuredImage: { 
      url: 'https://images.unsplash.com/photo-1529101091764-c3526daf3e28?w=800', 
      alt: 'Día de la Madre Tierra' 
    },
    views: 0
  },
  {
    title: 'Cámara de Senadores aprueba proyecto de Ley de Aguas',
    slug: 'senado-aprueba-ley-aguas',
    content: '<p>Por unanimidad, la Cámara de Senadores aprobó el proyecto de Ley General de Aguas, que garantiza el acceso al agua potable como derecho fundamental. La normativa establece mecanismos de distribución equitativa y protección de fuentes hídricas.</p><p>La ley contempla la creación de un fondo de inversión de Bs 1.200 millones para proyectos de riego tecnificado y plantas de tratamiento en áreas rurales y periurbanas.</p><p>Organizaciones sociales y gremiales manifestaron su respaldo a la iniciativa, destacando el trabajo conjunto entre el Legislativo y la sociedad civil.</p>',
    excerpt: 'Ley garantiza acceso al agua potable como derecho fundamental con inversión de Bs 1.200 millones',
    type: 'news',
    category: 'legislacion',  // ✅ VÁLIDA
    tags: ['agua', 'derechos', 'riego', 'desarrollo'],
    status: 'published',
    featuredImage: { 
      url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800', 
      alt: 'Ley de Aguas' 
    },
    views: 0
  },
  {
    title: 'Senado realiza audiencia pública sobre salud mental',
    slug: 'senado-audiencia-salud-mental',
    content: '<p>La Comisión de Salud del Senado realizó una audiencia pública para abordar la problemática de la salud mental en Bolivia. Especialistas, autoridades y organizaciones civiles expusieron sobre la necesidad de una ley marco.</p><p>Los participantes coincidieron en que se requiere mayor presupuesto para centros de atención, capacitación de personal y campañas de concientización para eliminar estigmas.</p><p>Se anunció que en los próximos meses se presentará un proyecto de ley integral de salud mental.</p>',
    excerpt: 'Especialistas y autoridades coinciden en necesidad de una ley marco para salud mental',
    type: 'news',
    category: 'institucional',  // ✅ VÁLIDA
    tags: ['salud', 'salud-mental', 'leyes', 'bienestar'],
    status: 'published',
    featuredImage: { 
      url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800', 
      alt: 'Audiencia de Salud Mental' 
    },
    views: 0
  },
  {
    title: 'Comisión de Autonomías analiza transferencia de competencias',
    slug: 'comision-autonomias-transferencia-competencias',
    content: '<p>La Comisión de Autonomías del Senado inició el análisis del proyecto de ley de transferencia de competencias del nivel central a las entidades territoriales autónomas. Gobernadores y alcaldes participaron de las primeras mesas de trabajo.</p><p>El objetivo es agilizar la descentralización efectiva y garantizar recursos suficientes para que las regiones ejecuten proyectos de desarrollo.</p><p>Se prevé que el proyecto sea aprobado en los próximos dos meses.</p>',
    excerpt: 'Proyecto busca agilizar descentralización efectiva con recursos garantizados',
    type: 'news',
    category: 'legislacion',  // ✅ VÁLIDA
    tags: ['autonomias', 'descentralizacion', 'gobernadores', 'desarrollo'],
    status: 'published',
    featuredImage: { 
      url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800', 
      alt: 'Comisión de Autonomías' 
    },
    views: 0
  },
  {
    title: 'Directiva del Senado presenta plan de trabajo anual',
    slug: 'directiva-senado-plan-trabajo-anual',
    content: '<p>La Directiva de la Cámara de Senadores presentó el plan de trabajo para la gestión anual, que incluye ejes prioritarios como la reactivación económica, la lucha contra la corrupción y el fortalecimiento de la democracia.</p><p>El presidente del Senado destacó que se realizarán al menos 12 sesiones descentralizadas en diferentes departamentos del país para acercar el trabajo legislativo a la ciudadanía.</p><p>También se anunció la creación de una plataforma digital de participación ciudadana.</p>',
    excerpt: 'Plan incluye reactivación económica, lucha contra corrupción y sesiones descentralizadas',
    type: 'news',
    category: 'directiva',  // ✅ VÁLIDA
    tags: ['directiva', 'plan-trabajo', 'gestion', 'participacion'],
    status: 'published',
    featuredImage: { 
      url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', 
      alt: 'Directiva del Senado' 
    },
    views: 0
  },
  {
    title: 'Senado abre convocatoria para pasantías universitarias',
    slug: 'senado-convocatoria-pasantias-universitarias',
    content: '<p>La Cámara de Senadores abrió la convocatoria para el programa de pasantías dirigido a estudiantes universitarios de último año. Los seleccionados podrán realizar prácticas profesionales en diferentes áreas del órgano legislativo.</p><p>El programa tiene como objetivo formar a jóvenes profesionales y acercar a las nuevas generaciones al quehacer legislativo. Los interesados podrán postular hasta el 30 de junio.</p><p>Se seleccionarán 50 estudiantes de diferentes carreras como Derecho, Ciencias Políticas, Comunicación, Administración y Sistemas.</p>',
    excerpt: 'Programa busca formar a jóvenes profesionales en el órgano legislativo',
    type: 'announcement',
    category: 'participacion',  // ✅ VÁLIDA
    tags: ['pasantias', 'estudiantes', 'convocatoria', 'universidades'],
    status: 'published',
    featuredImage: { 
      url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800', 
      alt: 'Pasantías universitarias' 
    },
    views: 0
  },
  {
    title: 'Historia del Senado: 190 años de vida institucional',
    slug: 'historia-senado-190-aniversario',
    content: '<p>La Cámara de Senadores conmemora 190 años de vida institucional. Desde su fundación en 1831, el Senado ha sido testigo y protagonista de los principales hitos de la historia boliviana.</p><p>A lo largo de casi dos siglos, el Senado ha evolucionado desde sus orígenes como cámara elitista hasta convertirse en una institución representativa de los nueve departamentos del país.</p><p>En la actualidad, el Senado está compuesto por 36 senadoras y senadores elegidos por voto popular.</p>',
    excerpt: 'Cámara de Senadores conmemora casi dos siglos de vida institucional',
    type: 'page',
    category: 'historia',  // ✅ VÁLIDA
    tags: ['historia', 'aniversario', 'institucion', 'legislativo'],
    status: 'published',
    featuredImage: { 
      url: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800', 
      alt: 'Historia del Senado' 
    },
    views: 0
  },
  {
    title: 'Portal de transparencia: nuevos datos disponibles',
    slug: 'portal-transparencia-nuevos-datos',
    content: '<p>El Senado actualizó el portal de transparencia con los datos correspondientes al primer trimestre del año. Los ciudadanos pueden acceder a información sobre ejecución presupuestaria, viáticos, contrataciones y remuneraciones de autoridades.</p><p>La publicación de estos datos responde a la política de gobierno abierto y acceso a la información pública promovida por la actual directiva.</p><p>El portal está disponible en el sitio web oficial del Senado.</p>',
    excerpt: 'Ciudadanos pueden acceder a datos sobre presupuesto, viáticos y contrataciones',
    type: 'announcement',
    category: 'transparencia',  // ✅ VÁLIDA
    tags: ['transparencia', 'datos-abiertos', 'acceso-informacion', 'portal'],
    status: 'published',
    featuredImage: { 
      url: 'https://images.unsplash.com/photo-1554224154-26032ffc0a07?w=800', 
      alt: 'Portal de Transparencia' 
    },
    views: 0
  }
];

async function seedContent() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // OBTENER UN USUARIO ADMIN EXISTENTE
    console.log('👤 Buscando usuario administrador...');
    const adminUser = await User.findOne({ role: 'SUPER_ADMIN' });
    
    if (!adminUser) {
      console.error('❌ No se encontró ningún usuario administrador en la base de datos.');
      console.log('💡 Ejecuta primero: npm run seed:admin');
      process.exit(1);
    }
    
    console.log(`✅ Usuario encontrado: ${adminUser.email} (ID: ${adminUser._id})`);
    
    // AGREGAR EL AUTHOR A CADA NOTICIA
    const newsWithAuthor = sampleNews.map(news => ({
      ...news,
      author: adminUser._id,
      lastModifiedBy: adminUser._id
    }));
    
    // Limpiar collection existente
    const deleted = await Content.deleteMany({});
    console.log(`🗑️ Eliminados ${deleted.deletedCount} documentos anteriores`);
    
    // Insertar nuevos datos
    const result = await Content.insertMany(newsWithAuthor);
    console.log(`✅ Insertadas ${result.length} noticias de ejemplo`);
    
    // Mostrar resumen de las noticias insertadas
    console.log('\n📰 NOTICIAS INSERTADAS:');
    result.forEach((news, index) => {
      console.log(`   ${index + 1}. ${news.title}`);
      console.log(`      Categoría: ${news.category} | Tipo: ${news.type}`);
    });
    
    // Mostrar estadísticas
    const total = await Content.countDocuments();
    const byCategory = await Content.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    console.log('\n📊 ESTADÍSTICAS:');
    console.log(`   Total documentos: ${total}`);
    console.log('\n   Por categoría:');
    byCategory.forEach(cat => {
      console.log(`      ${cat._id}: ${cat.count}`);
    });
    
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    console.log('✅ SEED COMPLETADO CON ÉXITO');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    if (error.errors) {
      console.error('📋 Detalles de validación:', Object.keys(error.errors).map(key => ({
        campo: key,
        mensaje: error.errors[key].message,
        valor: error.errors[key].value
      })));
    }
    process.exit(1);
  }
}

seedContent();