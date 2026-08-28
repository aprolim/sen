// src/scripts/seedContent.js
// SEED COMPLETO - CON CATEGORÍAS: 'noticia' e 'importante'
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Content = require('../models/Content');
const User = require('../models/User');

dotenv.config();

// ============================================
// SENADORES REALES PARA CITAS
// ============================================
const SENADORES = [
  { name: 'Diego Esteban Mateo Ávila Navajas', role: 'Presidente del Senado' },
  { name: 'Carmen Soledad Chapetón Tancara', role: 'Primera Vicepresidenta del Senado' },
  { name: 'Khatia Lisbeth Quiroga Fernández', role: 'Segunda Vicepresidenta del Senado' },
  { name: 'Yasmin Estívariz Villarroel', role: 'Primera Secretaria del Senado' },
  { name: 'Julio Diego Romaña Galindo', role: 'Segundo Secretario del Senado' },
  { name: 'Andrónico Rodríguez Ledezma', role: 'Senador por Cochabamba' },
  { name: 'Cecilia Rosario Requena Zabala', role: 'Senadora por Beni' },
  { name: 'Félix Ajpi Ajpi', role: 'Senador por La Paz' },
  { name: 'Gladys Margot Alurralde Peñaranda', role: 'Senadora por Tarija' },
  { name: 'Hiroshi Ando Chávez', role: 'Senador por Santa Cruz' },
  { name: 'Leonilda Zurita Vargas', role: 'Senadora por Potosí' },
  { name: 'Rubén Eugenio Medinaceli Ortiz', role: 'Senador por Chuquisaca' }
];

// ============================================
// TÍTULOS BASE - CATEGORÍAS CORRECTAS
// ============================================
const TITULOS_BASE = [
  // NOTICIAS IMPORTANTES (⭐) - category: 'importante'
  { titulo: '⭐ *Senado* aprueba nueva ley de *protección ambiental*', categoria: 'importante', tags: ['medio-ambiente', 'leyes', 'destacado'], tieneVideo: true },
  { titulo: '⭐ *Senado* rechaza *proyecto* de ley controversial', categoria: 'importante', tags: ['política', 'debate', 'destacado'], tieneVideo: true },
  { titulo: '⭐ *Presupuesto* general de la *nación* 2026', categoria: 'importante', tags: ['presupuesto', 'economía', 'destacado'], tieneVideo: true },
  { titulo: '⭐ *Senado* conmemora el *Día de la Madre Tierra*', categoria: 'importante', tags: ['medio-ambiente', 'conmemoración', 'destacado'], tieneVideo: true },
  { titulo: '⭐ Directiva del *Senado* presenta *plan* de trabajo anual', categoria: 'importante', tags: ['directiva', 'plan', 'destacado'], tieneVideo: true },
  { titulo: '⭐ *Comisión* de Justicia revisa reformas al *código penal*', categoria: 'importante', tags: ['justicia', 'reformas', 'destacado'], tieneVideo: true },
  { titulo: '⭐ *Senado* realiza *audiencia pública* sobre salud mental', categoria: 'importante', tags: ['salud', 'audiencia', 'destacado'], tieneVideo: true },
  { titulo: '⭐ *Cámara de Senadores* celebra *aniversario* institucional', categoria: 'importante', tags: ['aniversario', 'historia', 'destacado'], tieneVideo: true },
  { titulo: '⭐ *Foro* internacional de *derechos humanos* en el Senado', categoria: 'importante', tags: ['derechos', 'foro', 'destacado'], tieneVideo: true },
  { titulo: '⭐ *Senado* aprueba *ley* de educación superior', categoria: 'importante', tags: ['educación', 'universidades', 'destacado'], tieneVideo: true },
  
  // NOTICIAS NORMALES (📰) - category: 'noticia'
  { titulo: '📰 Comisión de Desarrollo *Económico* presenta informe', categoria: 'noticia', tags: ['economía', 'desarrollo'], tieneVideo: false },
  { titulo: '📰 *Nuevas* disposiciones para el sector *salud*', categoria: 'noticia', tags: ['salud', 'leyes'], tieneVideo: false },
  { titulo: '📰 *Senado* abre *convocatoria* para pasantías universitarias', categoria: 'noticia', tags: ['educación', 'pasantías'], tieneVideo: false },
  { titulo: '📰 *Consulta* ciudadana sobre *ley de transparencia*', categoria: 'noticia', tags: ['transparencia', 'participación'], tieneVideo: false },
  { titulo: '📰 *Senado* impulsa *proyecto* de desarrollo productivo', categoria: 'noticia', tags: ['desarrollo', 'productivo'], tieneVideo: false },
  { titulo: '📰 *Comisión* de Infraestructura analiza *proyectos viales*', categoria: 'noticia', tags: ['infraestructura', 'vialidad'], tieneVideo: false },
  { titulo: '📰 Comisión de Educación recibe propuestas para reforma curricular', categoria: 'noticia', tags: ['educación', 'reformas'], tieneVideo: false },
  { titulo: '📰 Comisión de Autonomías analiza transferencia de competencias', categoria: 'noticia', tags: ['autonomías', 'descentralización'], tieneVideo: false },
  { titulo: '📰 Comisión de Salud impulsa ley de medicina tradicional', categoria: 'noticia', tags: ['salud', 'medicina'], tieneVideo: false },
  { titulo: '📰 Comisión de Seguridad analiza nuevas políticas', categoria: 'noticia', tags: ['seguridad', 'políticas'], tieneVideo: false },
  { titulo: '📰 Comisión de Cultura impulsa patrimonio nacional', categoria: 'noticia', tags: ['cultura', 'patrimonio'], tieneVideo: false },
  { titulo: '📰 Senado ratifica convenios internacionales', categoria: 'noticia', tags: ['internacional', 'convenios'], tieneVideo: false }
];

// ============================================
// IMÁGENES DE EJEMPLO
// ============================================
const IMAGENES = [
  { url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200', alt: 'Pleno del Senado en sesión', caption: 'Sesión plenaria de la Cámara de Senadores' },
  { url: 'https://images.unsplash.com/photo-1529101091764-c3526daf3e28?w=1200', alt: 'Palacio del Senado', caption: 'Palacio del Senado de Bolivia' },
  { url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200', alt: 'Senadores en debate', caption: 'Senadores durante el debate legislativo' },
  { url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=1200', alt: 'Comisión del Senado', caption: 'Reunión de comisión parlamentaria' },
  { url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200', alt: 'Presidente del Senado', caption: 'Presidente del Senado en conferencia' },
  { url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200', alt: 'Senadores trabajando', caption: 'Senadores trabajando en comisiones' }
];

// ============================================
// VIDEOS DE EJEMPLO
// ============================================
const VIDEOS = [
  { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Sesión Plenaria del Senado', caption: 'Registro oficial de la sesión plenaria' },
  { url: 'https://www.youtube.com/embed/9bZkp7q19f0', title: 'Comisión de Constitución', caption: 'Trabajo de la comisión revisando proyectos' }
];

// ============================================
// FUNCIÓN PARA GENERAR BLOQUES
// ============================================
const generarBloques = (titulo, categoria, index, tieneVideo) => {
  const bloques = [];
  
  // Párrafo 1 - Introducción
  bloques.push({
    type: 'paragraph',
    content: `<p>En una <strong>sesión ordinaria</strong> de la Cámara de Senadores, se debatió y aprobó importantes proyectos de ley que beneficiarán a la <strong>población boliviana</strong>. La iniciativa fue respaldada por todas las fuerzas políticas presentes, demostrando el compromiso del Senado con el <em>desarrollo nacional</em>.</p>`
  });
  
  // VIDEO
  if (tieneVideo) {
    const video = VIDEOS[index % VIDEOS.length];
    bloques.push({
      type: 'video',
      url: video.url,
      title: video.title,
      caption: video.caption
    });
  }
  
  // Párrafo 2 - Desarrollo
  bloques.push({
    type: 'paragraph',
    content: `<p>La <strong>Comisión de Constitución</strong> analizó el proyecto de ley en detalle, revisando cada uno de sus artículos y escuchando las observaciones de los diferentes sectores involucrados. Este proceso de análisis duró varias semanas y contó con la participación de <strong>expertos en la materia</strong>.</p>`
  });
  
  // CITA (80% de probabilidad)
  if (Math.random() > 0.2) {
    const senador = SENADORES[Math.floor(Math.random() * SENADORES.length)];
    const citas = [
      `${titulo.replace(/\*/g, '').replace(/⭐|📰/g, '').trim()} es un paso histórico para el desarrollo legislativo de nuestro país. Nunca antes se había logrado un consenso tan amplio en una iniciativa de esta naturaleza.`,
      `La transparencia y el diálogo son fundamentales para el fortalecimiento de nuestra democracia. Este proyecto es una prueba de que cuando trabajamos juntos, podemos lograr grandes cosas para el país.`,
      `Trabajamos incansablemente para garantizar el bienestar de todos los bolivianos. Esta ley es una muestra de nuestro compromiso con la gente.`
    ];
    
    bloques.push({
      type: 'quote',
      content: citas[Math.floor(Math.random() * citas.length)],
      author: senador.name,
      role: senador.role
    });
  }
  
  // Párrafo 3 - Votación
  bloques.push({
    type: 'paragraph',
    content: `<p>La <strong>votación final</strong> está programada para la próxima sesión ordinaria, donde se espera contar con el respaldo necesario para su <strong>aprobación definitiva</strong>. Los líderes de bancada se mostraron optimistas respecto al resultado de la votación.</p>`
  });
  
  // Párrafo 4 - Impacto
  bloques.push({
    type: 'paragraph',
    content: `<p>Esta iniciativa legislativa forma parte de un <strong>paquete de reformas</strong> que el Senado viene impulsando para modernizar el marco normativo del país. Se prevé que en los próximos meses se presenten proyectos complementarios en áreas clave como <strong>educación, salud y desarrollo productivo</strong>.</p>`
  });
  
  return bloques;
};

// ============================================
// FUNCIÓN PARA GENERAR GALERÍA
// ============================================
const generarGaleria = (imagenPrincipal, index) => {
  const galeria = [];
  
  galeria.push({
    url: imagenPrincipal.url,
    alt: imagenPrincipal.alt,
    caption: imagenPrincipal.caption,
    order: 0
  });
  
  const numAdicionales = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < numAdicionales && i < IMAGENES.length; i++) {
    const imgIndex = (index + i + 1) % IMAGENES.length;
    if (IMAGENES[imgIndex].url !== imagenPrincipal.url) {
      galeria.push({
        url: IMAGENES[imgIndex].url,
        alt: IMAGENES[imgIndex].alt,
        caption: IMAGENES[imgIndex].caption,
        order: i + 1
      });
    }
  }
  
  return galeria;
};

// ============================================
// FUNCIÓN PARA GENERAR HTML DESDE BLOQUES
// ============================================
const generarHTMLDesdeBloques = (bloques) => {
  let html = '';
  for (const bloque of bloques) {
    if (bloque.type === 'paragraph') {
      html += bloque.content;
    } else if (bloque.type === 'quote') {
      html += `<blockquote><p>${bloque.content}</p><footer>— ${bloque.author}, ${bloque.role}</footer></blockquote>`;
    } else if (bloque.type === 'video') {
      html += `<iframe src="${bloque.url}" title="${bloque.title}" frameborder="0" allowfullscreen style="width: 100%; height: 400px; border-radius: 12px;"></iframe>`;
    }
  }
  return html;
};

// ============================================
// GENERAR TODAS LAS NOTICIAS
// ============================================
const generarNoticias = async (adminUserId) => {
  const noticias = [];
  
  for (let i = 0; i < TITULOS_BASE.length; i++) {
    const base = TITULOS_BASE[i];
    const imagenIndex = i % IMAGENES.length;
    const imagenPrincipal = IMAGENES[imagenIndex];
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - i);
    
    const tieneVideo = base.tieneVideo;
    const bloques = generarBloques(base.titulo, base.categoria, i, tieneVideo);
    const galeria = generarGaleria(imagenPrincipal, i);
    
    noticias.push({
      title: base.titulo,
      slug: base.titulo
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[⭐📰]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Date.now() + i,
      content: generarHTMLDesdeBloques(bloques),
      blocks: bloques,
      excerpt: `${base.categoria === 'importante' ? '⭐ ' : '📰 '}${base.titulo.replace(/\*/g, '').replace(/⭐|📰/g, '').trim()}. Una iniciativa importante para el desarrollo de Bolivia.`,
      type: 'news',
      category: base.categoria,  // 🔥 'importante' o 'noticia'
      tags: base.tags,
      status: 'published',
      featuredImage: {
        url: imagenPrincipal.url,
        alt: imagenPrincipal.alt,
        caption: imagenPrincipal.caption
      },
      gallery: galeria,
      author: adminUserId,
      lastModifiedBy: adminUserId,
      views: Math.floor(Math.random() * 2000) + 100,
      publishedAt: fecha
    });
  }
  
  return noticias;
};

// ============================================
// SCRIPT PRINCIPAL
// ============================================
async function seedContent() {
  console.log('\n' + '═'.repeat(80));
  console.log('🎬 SEED DE CONTENIDO - CATEGORÍAS CORRECTAS');
  console.log('   📰 Noticias normales  |  ⭐ Noticias importantes');
  console.log('═'.repeat(80));
  
  try {
    console.log('\n🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado a MongoDB');
    
    console.log('\n👤 Buscando usuario administrador...');
    let adminUser = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!adminUser) adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) adminUser = await User.findOne({});
    
    if (!adminUser) {
      console.error('❌ No se encontró ningún usuario. Ejecuta: node src/check-admin.js');
      process.exit(1);
    }
    
    console.log(`✅ Usuario encontrado: ${adminUser.email} (${adminUser.role})`);
    
    console.log('\n📝 Generando noticias...');
    const noticias = await generarNoticias(adminUser._id);
    console.log(`   Total noticias generadas: ${noticias.length}`);
    
    const importantes = noticias.filter(n => n.category === 'importante');
    const normales = noticias.filter(n => n.category === 'noticia');
    console.log(`   ⭐ Importantes: ${importantes.length}`);
    console.log(`   📰 Normales: ${normales.length}`);
    console.log(`   📹 Con video: ${noticias.filter(n => n.blocks.some(b => b.type === 'video')).length}`);
    
    console.log('\n🗑️ Limpiando colección Content...');
    await Content.deleteMany({});
    
    console.log('\n💾 Insertando noticias...');
    let inserted = 0;
    for (const noticia of noticias) {
      await Content.create(noticia);
      inserted++;
      if (inserted % 5 === 0) console.log(`   Insertadas ${inserted} de ${noticias.length}...`);
    }
    
    console.log(`\n✅ Insertadas ${inserted} noticias exitosamente`);
    
    console.log('\n📊 ESTADÍSTICAS FINALES:');
    const total = await Content.countDocuments();
    const conVideo = await Content.countDocuments({ 'blocks.type': 'video' });
    const conCitas = await Content.countDocuments({ 'blocks.type': 'quote' });
    const totalImportantes = await Content.countDocuments({ category: 'importante' });
    const totalNormales = await Content.countDocuments({ category: 'noticia' });
    
    console.log(`   • Total noticias: ${total}`);
    console.log(`   • ⭐ Importantes: ${totalImportantes}`);
    console.log(`   • 📰 Normales: ${totalNormales}`);
    console.log(`   • 📹 Con video: ${conVideo}`);
    console.log(`   • 💬 Con citas: ${conCitas}`);
    
    console.log('\n📰 NOTICIAS IMPORTANTES:');
    const noticiasImportantes = await Content.find({ category: 'importante' }).limit(5);
    noticiasImportantes.forEach((news, idx) => {
      console.log(`   ${idx + 1}. ⭐ ${news.title}`);
    });
    
    console.log('\n📌 Para probar:');
    console.log('   GET /api/content?category=importante - Noticias importantes');
    console.log('   GET /api/content?category=noticia - Noticias normales');
    console.log('   GET /api/content - Todas las noticias');
    
    await mongoose.disconnect();
    console.log('\n' + '═'.repeat(80));
    console.log('🎉 SEED COMPLETADO CON ÉXITO');
    console.log('═'.repeat(80));
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

seedContent();