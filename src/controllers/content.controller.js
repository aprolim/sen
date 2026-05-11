// src/controllers/content.controller.js
const contentService = require('../services/content.service');
const { processImage, generateThumbnails } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// ==================== DATOS SIMULADOS PARA PRUEBA ====================
const imagenes = [
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1529101091764-c3526daf3e28?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&h=500&fit=crop'
]

// 4 NOTICIAS IMPORTANTES
const noticiasSimuladas = [
  {
    id: 1,
    slug: 'tarija-en-su-aniversario',
    titulo: 'Tarija en su aniversario: Leyes, inversión y agenda nacional en una sesión que proyecta desarrollo para Bolivia',
    descripcion: 'En el marco del aniversario del departamento de Tarija, la Cámara de Senadores realizó una sesión especial donde se aprobaron importantes leyes que beneficiarán al desarrollo productivo de la región. Se destinaron más de Bs 500 millones para proyectos de infraestructura vial y energética.',
    descripcion2: 'El presidente del Senado destacó el compromiso del gobierno nacional con el desarrollo equitativo de todos los departamentos, anunciando la construcción de la planta procesadora de uva y la ampliación del aeropuerto Capitán Oriel Lea Plaza.',
    content: `<p>En una sesión histórica realizada en la ciudad de Tarija, la Cámara de Senadores rindió homenaje al departamento en su aniversario. Durante la jornada legislativa, se aprobaron por unanimidad tres proyectos de ley clave para el desarrollo productivo de la región.</p>
    <p>El primero de ellos destina más de Bs 500 millones para proyectos de infraestructura vial, incluyendo la ampliación de la carretera Tarija-Yacuiba y la construcción del puente sobre el río Pilcomayo. El segundo proyecto crea un fondo de desarrollo productivo para pequeños agricultores de la región, con énfasis en la producción vitivinícola.</p>
    <p>El presidente del Senado destacó durante su discurso la importancia de la inversión en infraestructura como motor del desarrollo económico.</p>
    <p>Los senadores de Tarija expresaron su satisfacción por los logros alcanzados y reiteraron su compromiso de seguir trabajando por el desarrollo del departamento.</p>
    <p>Finalmente, se aprobó una declaración camaral que reconoce los méritos del pueblo tarijeño y su contribución al desarrollo nacional.</p>`,
    excerpt: 'La Cámara de Senadores realizó una sesión especial en Tarija aprobando importantes leyes',
    publishedAt: '2026-04-15T00:00:00.000Z',
    fechaFormateada: '15 de abril de 2026',
    featuredImage: { url: imagenes[0], alt: 'Sesión en Tarija' },
    categoria: 'Sesión Especial',
    type: 'news',
    status: 'published',
    importante: true,
    views: 1250
  },
  {
    id: 2,
    slug: 'ley-general-de-aguas',
    titulo: 'Senado aprueba Ley General de Aguas para garantizar el acceso al agua potable en todo el territorio nacional',
    descripcion: 'Por unanimidad, la Cámara Alta aprobó la nueva Ley General de Aguas que garantiza el acceso al agua potable como derecho fundamental. La normativa establece mecanismos de distribución equitativa y protección de fuentes hídricas.',
    descripcion2: 'La ley contempla la creación de un fondo de inversión de Bs 1.200 millones para proyectos de riego tecnificado y plantas de tratamiento en áreas rurales y periurbanas.',
    content: `<p>Por unanimidad, la Cámara de Senadores aprobó la nueva Ley General de Aguas, que garantiza el acceso al agua potable como derecho fundamental.</p>
    <p>La ley contempla la creación de un fondo de inversión de Bs 1.200 millones para proyectos de riego tecnificado y plantas de tratamiento en áreas rurales y periurbanas.</p>
    <p>Durante el debate, senadores de diferentes regiones destacaron la importancia de esta norma para garantizar el acceso al agua en comunidades rurales.</p>
    <p>La comisión de Medio Ambiente será la encargada de dar seguimiento a la implementación de esta ley.</p>
    <p>Organizaciones sociales y gremiales manifestaron su respaldo a la iniciativa, destacando el trabajo conjunto entre el Legislativo y la sociedad civil.</p>`,
    excerpt: 'La Cámara Alta aprueba por unanimidad la nueva Ley General de Aguas',
    publishedAt: '2026-04-10T00:00:00.000Z',
    fechaFormateada: '10 de abril de 2026',
    featuredImage: { url: imagenes[1], alt: 'Agua potable' },
    categoria: 'Medio Ambiente',
    type: 'news',
    status: 'published',
    importante: true,
    views: 980
  },
  {
    id: 3,
    slug: 'reforma-sistema-judicial',
    titulo: 'Comisión de Constitución aprueba dictamen de reforma parcial del sistema judicial',
    descripcion: 'La Comisión de Constitución, Derechos Humanos y Legislación aprobó el proyecto de ley de reforma parcial del Órgano Judicial, que incluye la renovación de altas cortes y mecanismos de transparencia.',
    descripcion2: 'El senador presidente de la comisión señaló que la reforma busca fortalecer la independencia judicial y agilizar los procesos.',
    content: `<p>La Comisión de Constitución, Derechos Humanos y Legislación aprobó el proyecto de ley de reforma parcial del Órgano Judicial.</p>
    <p>El senador presidente de la comisión señaló que la reforma busca fortalecer la independencia judicial y agilizar los procesos.</p>
    <p>La iniciativa fue trabajada durante varios meses, recibiendo aportes de expertos en derecho constitucional.</p>
    <p>Entre los puntos clave de la reforma se incluye la renovación escalonada de magistrados.</p>
    <p>Organizaciones de derechos humanos manifestaron su respaldo a la iniciativa.</p>`,
    excerpt: 'Comisión de Constitución aprueba proyecto de reforma judicial',
    publishedAt: '2026-04-05T00:00:00.000Z',
    fechaFormateada: '5 de abril de 2026',
    featuredImage: { url: imagenes[2], alt: 'Reforma judicial' },
    categoria: 'Justicia',
    type: 'news',
    status: 'published',
    importante: true,
    views: 750
  },
  {
    id: 4,
    slug: 'dialogo-bilateral-bolivia-chile',
    titulo: 'Bolivia y Chile retoman diálogo bilateral en mesa técnica convocada por el Senado',
    descripcion: 'Representantes del Senado boliviano y del Congreso chileno se reunieron en una mesa técnica para abordar temas de integración fronteriza, comercio bilateral y cooperación en materia hídrica.',
    descripcion2: 'El encuentro, realizado en la ciudad de La Paz, contó con la participación de senadores de ambas naciones.',
    content: `<p>Representantes del Senado boliviano y del Congreso chileno se reunieron en una mesa técnica para abordar temas de integración fronteriza.</p>
    <p>Se acordó establecer una agenda de trabajo conjunta y próximos encuentros en la ciudad de Antofagasta.</p>
    <p>El presidente del Senado boliviano destacó la importancia del diálogo como herramienta para fortalecer las relaciones entre ambos países.</p>
    <p>Los senadores chilenos expresaron su interés en profundizar la relación bilateral.</p>
    <p>Este diálogo representa un paso importante en las relaciones entre Bolivia y Chile.</p>`,
    excerpt: 'Senado boliviano y Congreso chileno retoman diálogo bilateral',
    publishedAt: '2026-04-01T00:00:00.000Z',
    fechaFormateada: '1 de abril de 2026',
    featuredImage: { url: imagenes[3], alt: 'Diálogo bilateral' },
    categoria: 'Relaciones Internacionales',
    type: 'news',
    status: 'published',
    importante: true,
    views: 620
  }
]

// Generar 96 noticias adicionales
const generarNoticiasAdicionales = () => {
  const categorias = ['Seguridad', 'Economía', 'Educación', 'Salud', 'Infraestructura', 'Energía', 'Cultura', 'Deporte', 'Tecnología', 'Turismo', 'Agricultura', 'Minería']
  const noticias = []
  
  for (let i = 5; i <= 100; i++) {
    const categoria = categorias[i % categorias.length]
    const dia = 30 - Math.floor(i / 8)
    const fecha = new Date(2026, 2, dia)
    
    noticias.push({
      id: i,
      slug: `noticia-${i}`,
      titulo: `Senado impulsa proyecto de ley sobre ${categoria.toLowerCase()} para beneficio del país`,
      descripcion: `La Cámara de Senadores continúa trabajando en iniciativas legislativas que promuevan el desarrollo del país. En esta oportunidad, se presentó un proyecto de ley relacionado con ${categoria.toLowerCase()}.`,
      content: `<p>La Cámara de Senadores continúa trabajando en iniciativas legislativas que promuevan el desarrollo del país.</p>
      <p>La iniciativa fue presentada por senadores de diferentes fuerzas políticas y recibió amplio respaldo.</p>
      <p>Durante el debate, legisladores de distintos departamentos destacaron la importancia de esta norma.</p>
      <p>La comisión correspondiente será la encargada de dar seguimiento a la implementación.</p>
      <p>Organizaciones sociales manifestaron su respaldo a la iniciativa.</p>`,
      excerpt: `Senado impulsa proyecto de ley sobre ${categoria.toLowerCase()}`,
      publishedAt: fecha.toISOString(),
      fechaFormateada: fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
      featuredImage: { url: imagenes[i % imagenes.length], alt: `Noticia ${i}` },
      categoria: categoria,
      type: 'news',
      status: 'published',
      importante: false,
      views: Math.floor(Math.random() * 1000)
    })
  }
  
  return noticias
}

const todasLasNoticias = [...noticiasSimuladas, ...generarNoticiasAdicionales()]

// Variable para controlar modo simulación
let usarDatosSimulados = true

/**
 * @swagger
 * tags:
 *   name: Content
 *   description: Gestión de contenido
 */
class ContentController {
  /**
   * Obtener lista de contenido paginada
   */
  async getContents(req, res) {
    try {
      const queryPage = parseInt(req.query.page) || 1;
      const queryLimit = parseInt(req.query.limit) || 12;
      const { type, status } = req.query;
      
      // MODO SIMULACIÓN
      if (usarDatosSimulados) {
        let filtradas = [...todasLasNoticias]
        
        if (type && type !== 'all') {
          filtradas = filtradas.filter(n => n.type === type)
        }
        
        if (status && status !== 'all') {
          filtradas = filtradas.filter(n => n.status === status)
        }
        
        const ordenadas = filtradas.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        
        const total = ordenadas.length
        const start = (queryPage - 1) * queryLimit
        const end = start + queryLimit
        const contents = ordenadas.slice(start, end)
        
        console.log(`📡 [SIMULADO] getContents: ${contents.length} noticias, total: ${total}`)
        
        return res.json({
          success: true,
          data: {
            contents,
            total,
            page: queryPage,
            limit: queryLimit,
            pages: Math.ceil(total / queryLimit)
          }
        })
      }
      
      // MODO REAL (base de datos)
      const filters = {};
      if (type) filters.type = type;
      if (status) filters.status = status;

      const result = await contentService.getContents(queryPage, queryLimit, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('❌ Error en getContents:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Obtener contenido por slug
   */
  async getContentBySlug(req, res) {
    try {
      const { slug } = req.params
      
      // MODO SIMULACIÓN
      if (usarDatosSimulados) {
        const content = todasLasNoticias.find(n => n.slug === slug)
        
        if (!content) {
          return res.status(404).json({
            success: false,
            message: 'Contenido no encontrado',
          })
        }
        
        content.views += 1
        
        console.log(`📡 [SIMULADO] getContentBySlug: ${slug} encontrado`)
        
        return res.json({
          success: true,
          data: content,
        })
      }
      
      // MODO REAL
      const content = await contentService.getContentBySlug(slug);

      res.json({
        success: true,
        data: content,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Obtener contenido por ID
   */
  async getContentById(req, res) {
    try {
      const { id } = req.params
      
      // MODO SIMULACIÓN
      if (usarDatosSimulados) {
        const content = todasLasNoticias.find(n => n.id == id)
        
        if (!content) {
          return res.status(404).json({
            success: false,
            message: 'Contenido no encontrado',
          })
        }
        
        return res.json({
          success: true,
          data: content,
        })
      }
      
      // MODO REAL
      const content = await contentService.getContentById(id);

      res.json({
        success: true,
        data: content,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Crear nuevo contenido
   */
  async createContent(req, res) {
    try {
      const content = await contentService.createContent(req.body, req.user._id);
      
      res.status(201).json({
        success: true,
        message: 'Contenido creado exitosamente',
        data: content,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Actualizar contenido
   */
  async updateContent(req, res) {
    try {
      const { id } = req.params;
      const content = await contentService.updateContent(id, req.body, req.user._id);

      res.json({
        success: true,
        message: 'Contenido actualizado exitosamente',
        data: content,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Eliminar contenido
   */
  async deleteContent(req, res) {
    try {
      const { id } = req.params;
      const result = await contentService.deleteContent(id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Cambiar estado del contenido
   */
  async changeStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const content = await contentService.changeContentStatus(id, status, req.user._id);

      res.json({
        success: true,
        message: `Estado cambiado a ${status}`,
        data: content,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Obtener estadísticas de contenido
   */
  async getStats(req, res) {
    try {
      // MODO SIMULACIÓN
      if (usarDatosSimulados) {
        return res.json({
          success: true,
          data: {
            total: todasLasNoticias.length,
            importantes: noticiasSimuladas.length,
            publicadas: todasLasNoticias.filter(n => n.status === 'published').length
          },
        });
      }
      
      // MODO REAL
      const stats = await contentService.getContentStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Buscar contenido
   */
  async searchContent(req, res) {
    try {
      const { q, limit = 20 } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Término de búsqueda requerido',
        });
      }

      // MODO SIMULACIÓN
      if (usarDatosSimulados) {
        const termino = q.toLowerCase();
        const results = todasLasNoticias.filter(item => 
          item.titulo.toLowerCase().includes(termino) ||
          (item.descripcion && item.descripcion.toLowerCase().includes(termino))
        ).slice(0, parseInt(limit));
        
        return res.json({
          success: true,
          data: results,
        });
      }

      const results = await contentService.searchContent(q, parseInt(limit));

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Obtener contenido relacionado
   */
  async getRelatedContent(req, res) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit) || 5;

      // MODO SIMULACIÓN
      if (usarDatosSimulados) {
        const current = todasLasNoticias.find(n => n.id == id);
        
        if (!current) {
          return res.json({ success: true, data: [] });
        }
        
        const related = todasLasNoticias
          .filter(n => n.id != id && n.type === current.type)
          .slice(0, limit);
        
        return res.json({
          success: true,
          data: related,
        });
      }

      const related = await contentService.getRelatedContent(id, limit);

      res.json({
        success: true,
        data: related,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Obtener tipos de contenido disponibles
   */
  async getContentTypes(req, res) {
    try {
      const types = [
        { value: 'page', label: 'Página', description: 'Páginas estáticas como institucional, historia, etc.' },
        { value: 'news', label: 'Noticia', description: 'Noticias y anuncios de actualidad' },
        { value: 'article', label: 'Artículo', description: 'Artículos de opinión o análisis' },
        { value: 'announcement', label: 'Anuncio', description: 'Comunicados oficiales' },
      ];

      res.json({
        success: true,
        data: types,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Obtener categorías disponibles
   */
  async getCategories(req, res) {
    try {
      const categories = [
        { value: 'institucional', label: 'Institucional', color: 'blue' },
        { value: 'historia', label: 'Historia', color: 'green' },
        { value: 'directiva', label: 'Directiva', color: 'purple' },
        { value: 'noticias', label: 'Noticias', color: 'orange' },
        { value: 'eventos', label: 'Eventos', color: 'red' },
        { value: 'transparencia', label: 'Transparencia', color: 'teal' },
        { value: 'participacion', label: 'Participación', color: 'cyan' },
        { value: 'legislacion', label: 'Legislación', color: 'indigo' },
      ];

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Subir imagen para contenido
   */
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se subió ninguna imagen',
        });
      }

      const imagePath = path.join(req.file.destination, req.file.filename);
      const processedFilename = await processImage(imagePath, {
        width: 1200,
        quality: 80,
        format: 'webp',
      });

      const thumbnails = await generateThumbnails(
        path.join(req.file.destination, processedFilename)
      );

      const imageUrl = `/uploads/images/${processedFilename}`;

      res.json({
        success: true,
        message: 'Imagen subida exitosamente',
        data: {
          url: imageUrl,
          filename: processedFilename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          thumbnails,
          alt: req.body.alt || '',
          caption: req.body.caption || '',
        },
      });
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      res.status(500).json({
        success: false,
        message: 'Error al subir la imagen',
      });
    }
  }

  /**
   * Subir documento
   */
  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se subió ningún documento',
        });
      }

      const documentUrl = `/uploads/documents/${req.file.filename}`;

      res.json({
        success: true,
        message: 'Documento subido exitosamente',
        data: {
          url: documentUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al subir el documento',
      });
    }
  }
}

module.exports = new ContentController();