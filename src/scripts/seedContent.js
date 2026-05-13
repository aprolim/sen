// src/scripts/seedContent.js
// Seed para crear 100 noticias de ejemplo
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

// Títulos base para generar noticias variadas (20 títulos base)
const TITULOS_BASE = [
  'Senado aprueba nueva ley de desarrollo económico',
  'Comisión de Educación recibe propuestas para reforma curricular',
  'Senado conmemora el Día de la Madre Tierra',
  'Cámara de Senadores aprueba proyecto de Ley de Aguas',
  'Senado realiza audiencia pública sobre salud mental',
  'Comisión de Autonomías analiza transferencia de competencias',
  'Directiva del Senado presenta plan de trabajo anual',
  'Senado abre convocatoria para pasantías universitarias',
  'Senado impulsa proyecto de ley de desarrollo productivo',
  'Comisión de Justicia revisa reformas al código penal',
  'Senado aprueba presupuesto para la gestión',
  'Comisión de Salud impulsa ley de medicina tradicional',
  'Senado rechaza proyecto de ley controversial',
  'Comisión de Infraestructura analiza proyectos viales',
  'Senado aprueba declaración de emergencia departamental',
  'Comisión de Derechos Humanos recibe informes',
  'Senado modifica ley de telecomunicaciones',
  'Comisión de Seguridad analiza nuevas políticas',
  'Senado ratifica convenios internacionales',
  'Comisión de Cultura impulsa patrimonio nacional'
];

// Tipos de contenido
const TIPOS = ['news', 'news', 'news', 'news', 'news', 'announcement'];
const CATEGORIAS = ['legislacion', 'institucional', 'noticias', 'eventos', 'participacion', 'transparencia'];

// Función para generar título
const generarTitulo = (index) => {
  const base = TITULOS_BASE[index % TITULOS_BASE.length];
  const variaciones = [
    base,
    `${base} - Versión ${Math.floor(index / TITULOS_BASE.length) + 1}`,
    `${base}: nuevas disposiciones para el ${new Date().getFullYear()}`,
    `${base} - Senado da luz verde a la iniciativa`,
    `${base} tras debate en comisiones`,
    `Senado: ${base.toLowerCase()}`,
    `Histórico: ${base}`,
    `Por unanimidad, ${base.toLowerCase()}`,
    `${base} y su impacto en la población`,
    `Detalles de cómo ${base.toLowerCase()}`
  ];
  return variaciones[index % variaciones.length];
};

// Función para generar slug
const generarSlug = (titulo, index) => {
  let slug = titulo
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  // Limitar longitud y agregar índice para evitar duplicados
  if (slug.length > 60) {
    slug = slug.substring(0, 60);
  }
  return `${slug}-${index + 1}`;
};

// Función para generar fecha aleatoria (últimos 90 días)
const getRandomDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 90));
  return date;
};

// Función para generar tags
const getRandomTags = () => {
  const tags = ['leyes', 'desarrollo', 'educacion', 'medio-ambiente', 'salud', 'economia', 'seguridad', 'cultura', 'transparencia', 'participacion', 'derechos', 'infraestructura'];
  const numTags = Math.floor(Math.random() * 3) + 2;
  const shuffled = [...tags];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, numTags);
};

// Imágenes de Unsplash variadas
const IMAGENES = [
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800',
  'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800',
  'https://images.unsplash.com/photo-1529101091764-c3526daf3e28?w=800',
  'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800',
  'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800',
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
  'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800',
  'https://images.unsplash.com/photo-1554224154-26032ffc0a07?w=800',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800'
];

// Generar 96 noticias adicionales (para llegar a 100 total con las 4 importantes)
const generarNoticiasAdicionales = (cantidad) => {
  const noticias = [];
  const contenidosBase = [
    `<p>En una sesión ordinaria, la Cámara de Senadores debatió y aprobó importantes proyectos de ley que beneficiarán a la población boliviana. La iniciativa fue respaldada por todas las fuerzas políticas presentes.</p>
<p>El presidente del Senado destacó el consenso alcanzado y la importancia de trabajar de manera coordinada por el desarrollo del país.</p>
<p>La normativa ahora pasa a la Cámara de Diputados para su revisión y posterior promulgación.</p>`,
    
    `<p>La Comisión correspondiente recibió a representantes de la sociedad civil para escuchar sus propuestas y observaciones sobre el proyecto en cuestión.</p>
<p>Durante varias horas, los legisladores atendieron las inquietudes de los diferentes sectores involucrados.</p>
<p>Se acordó incorporar varias modificaciones antes de la votación en el pleno.</p>`,
    
    `<p>Por unanimidad, el pleno del Senado dio su aprobación al proyecto de ley que busca mejorar las condiciones de vida de los ciudadanos.</p>
<p>La medida incluye beneficios directos para sectores vulnerables y promueve la inversión en áreas clave.</p>
<p>Organizaciones sociales manifestaron su satisfacción con el resultado.</p>`,
    
    `<p>La Comisión de Constitución emitió un dictamen favorable tras analizar en detalle el proyecto de ley presentado por el ejecutivo.</p>
<p>Se espera que en los próximos días el documento sea considerado por el pleno camaral.</p>
<p>Senadores de diferentes regiones expresaron su respaldo a la iniciativa.</p>`
  ];
  
  for (let i = 0; i < cantidad; i++) {
    const titulo = generarTitulo(i);
    const fecha = getRandomDate();
    const categoria = CATEGORIAS[i % CATEGORIAS.length];
    const tipo = TIPOS[i % TIPOS.length];
    const contenidoBase = contenidosBase[i % contenidosBase.length];
    const contenidoAdicional = i % 3 === 0 ? `<p>Adicionalmente, se prevé que esta normativa tenga un impacto positivo en ${Math.floor(Math.random() * 10) + 1} departamentos del país, generando empleo y desarrollo sostenible.</p>` : '';
    
    noticias.push({
      title: titulo,
      slug: generarSlug(titulo, i),
      content: contenidoBase + contenidoAdicional + `<p>La votación final está programada para la próxima sesión ordinaria, donde se espera contar con el respaldo necesario para su aprobación definitiva.</p>`,
      excerpt: `${titulo.substring(0, 80)}. La iniciativa fue trabajada en consenso con todos los sectores involucrados.`,
      type: tipo,
      category: categoria,
      tags: getRandomTags(),
      status: 'published',
      featuredImage: { 
        url: IMAGENES[i % IMAGENES.length], 
        alt: titulo.substring(0, 50)
      },
      views: Math.floor(Math.random() * 1000),
      publishedAt: fecha
    });
  }
  
  return noticias;
};

// Noticias importantes destacadas (se mantienen al inicio)
const noticiasImportantes = [
  {
    title: 'Senado aprueba Ley de Desarrollo Económico',
    slug: 'senado-aprueba-ley-desarrollo-economico',
    content: '<p>El pleno del Senado aprobó por unanimidad la nueva Ley de Desarrollo Económico. Esta normativa contempla beneficios tributarios para pequeñas y medianas empresas, así como líneas de crédito con tasas preferenciales para emprendedores.</p><p>"Es un día histórico para el desarrollo productivo de Bolivia", declaró el presidente del Senado. La ley fue trabajada en consenso con todas las fuerzas políticas y organizaciones sociales del país.</p><p>Entre los principales puntos de la ley se destacan: la creación de un fondo de garantía para MIPYMES, la simplificación de trámites para la creación de empresas, y beneficios fiscales para industrias que generen empleo.</p>',
    excerpt: 'Nueva ley beneficiará a emprendedores y pequeñas empresas con créditos y beneficios tributarios',
    type: 'news',
    category: 'legislacion',
    tags: ['economia', 'desarrollo', 'leyes', 'emprendedores'],
    status: 'published',
    featuredImage: { url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800', alt: 'Pleno del Senado' },
    views: 1250,
    publishedAt: new Date()
  },
  {
    title: 'Cámara de Senadores aprueba proyecto de Ley de Aguas',
    slug: 'senado-aprueba-ley-aguas',
    content: '<p>Por unanimidad, la Cámara de Senadores aprobó el proyecto de Ley General de Aguas, que garantiza el acceso al agua potable como derecho fundamental. La normativa establece mecanismos de distribución equitativa y protección de fuentes hídricas.</p><p>La ley contempla la creación de un fondo de inversión de Bs 1.200 millones para proyectos de riego tecnificado y plantas de tratamiento en áreas rurales y periurbanas.</p><p>Organizaciones sociales y gremiales manifestaron su respaldo a la iniciativa, destacando el trabajo conjunto entre el Legislativo y la sociedad civil.</p>',
    excerpt: 'Ley garantiza acceso al agua potable como derecho fundamental con inversión de Bs 1.200 millones',
    type: 'news',
    category: 'legislacion',
    tags: ['agua', 'derechos', 'riego', 'desarrollo'],
    status: 'published',
    featuredImage: { url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800', alt: 'Ley de Aguas' },
    views: 980,
    publishedAt: new Date()
  },
  {
    title: 'Comisión de Autonomías analiza transferencia de competencias',
    slug: 'comision-autonomias-transferencia-competencias',
    content: '<p>La Comisión de Autonomías del Senado inició el análisis del proyecto de ley de transferencia de competencias del nivel central a las entidades territoriales autónomas. Gobernadores y alcaldes participaron de las primeras mesas de trabajo.</p><p>El objetivo es agilizar la descentralización efectiva y garantizar recursos suficientes para que las regiones ejecuten proyectos de desarrollo.</p><p>Se prevé que el proyecto sea aprobado en los próximos dos meses.</p>',
    excerpt: 'Proyecto busca agilizar descentralización efectiva con recursos garantizados',
    type: 'news',
    category: 'legislacion',
    tags: ['autonomias', 'descentralizacion', 'gobernadores', 'desarrollo'],
    status: 'published',
    featuredImage: { url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800', alt: 'Comisión de Autonomías' },
    views: 750,
    publishedAt: new Date()
  },
  {
    title: 'Directiva del Senado presenta plan de trabajo anual',
    slug: 'directiva-senado-plan-trabajo-anual',
    content: '<p>La Directiva de la Cámara de Senadores presentó el plan de trabajo para la gestión anual, que incluye ejes prioritarios como la reactivación económica, la lucha contra la corrupción y el fortalecimiento de la democracia.</p><p>El presidente del Senado destacó que se realizarán al menos 12 sesiones descentralizadas en diferentes departamentos del país para acercar el trabajo legislativo a la ciudadanía.</p><p>También se anunció la creación de una plataforma digital de participación ciudadana.</p>',
    excerpt: 'Plan incluye reactivación económica, lucha contra corrupción y sesiones descentralizadas',
    type: 'news',
    category: 'directiva',
    tags: ['directiva', 'plan-trabajo', 'gestion', 'participacion'],
    status: 'published',
    featuredImage: { url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', alt: 'Directiva del Senado' },
    views: 620,
    publishedAt: new Date()
  }
];

async function seedContent() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    console.log('📍 URI:', process.env.MONGODB_URI);
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
    
    // Generar 96 noticias adicionales (para total de 100)
    console.log('📝 Generando 96 noticias adicionales...');
    const noticiasAdicionales = generarNoticiasAdicionales(96);
    
    // Combinar: 4 importantes + 96 adicionales = 100 total
    const todasLasNoticias = [...noticiasImportantes, ...noticiasAdicionales];
    
    console.log(`📊 Total noticias a insertar: ${todasLasNoticias.length}`);
    
    // AGREGAR EL AUTHOR A CADA NOTICIA
    const newsWithAuthor = todasLasNoticias.map(news => ({
      ...news,
      author: adminUser._id,
      lastModifiedBy: adminUser._id
    }));
    
    // Limpiar collection existente
    const deleted = await Content.deleteMany({});
    console.log(`🗑️ Eliminados ${deleted.deletedCount} documentos anteriores`);
    
    // Insertar en batches para evitar problemas de memoria
    const batchSize = 50;
    let inserted = 0;
    
    for (let i = 0; i < newsWithAuthor.length; i += batchSize) {
      const batch = newsWithAuthor.slice(i, i + batchSize);
      const result = await Content.insertMany(batch);
      inserted += result.length;
      console.log(`📦 Batch ${Math.floor(i / batchSize) + 1}: insertadas ${result.length} noticias`);
    }
    
    console.log(`✅ Insertadas ${inserted} noticias de ejemplo`);
    
    // Mostrar estadísticas
    const total = await Content.countDocuments();
    const porCategoria = await Content.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const porTipo = await Content.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    console.log('\n📊 ESTADÍSTICAS FINALES:');
    console.log(`   Total documentos: ${total}`);
    
    console.log('\n   Por categoría:');
    porCategoria.forEach(cat => {
      console.log(`      ${cat._id}: ${cat.count}`);
    });
    
    console.log('\n   Por tipo:');
    porTipo.forEach(tipo => {
      console.log(`      ${tipo._id}: ${tipo.count}`);
    });
    
    console.log('\n📰 PRIMERAS 6 NOTICIAS:');
    const primeras = await Content.find().sort({ publishedAt: -1 }).limit(6);
    primeras.forEach((news, i) => {
      console.log(`   ${i+1}. ${news.title}`);
    });
    
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    console.log('✅ SEED COMPLETADO CON ÉXITO - 100 NOTICIAS CREADAS');
    console.log('\n📌 Verifica la paginación en: http://demoback.senado.gob.bo/api/content');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    if (error.errors) {
      console.error('📋 Detalles de validación:', Object.keys(error.errors).map(key => ({
        campo: key,
        mensaje: error.errors[key].message
      })));
    }
    process.exit(1);
  }
}

seedContent();