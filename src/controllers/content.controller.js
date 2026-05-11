// src/controllers/content.controller.js
const contentService = require('../services/content.service');
const { processImage, generateThumbnails } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// ==================== DATOS SIMULADOS PARA PRUEBAS ====================
// Estos datos solo se usan si la base de datos está vacía o para pruebas rápidas
// NO reemplazan la funcionalidad existente, solo la complementan

const imagenesSimuladas = [
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1529101091764-c3526daf3e28?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&h=500&fit=crop'
]

const noticiasImportantesSimuladas = [
  {
    id: 1,
    slug: 'tarija-en-su-aniversario',
    titulo: 'Tarija en su aniversario: Leyes, inversión y agenda nacional en una sesión que proyecta desarrollo para Bolivia',
    descripcion: 'En el marco del aniversario del departamento de Tarija, la Cámara de Senadores realizó una sesión especial donde se aprobaron importantes leyes que beneficiarán al desarrollo productivo de la región. Se destinaron más de Bs 500 millones para proyectos de infraestructura vial y energética.',
    descripcion2: 'El presidente del Senado destacó el compromiso del gobierno nacional con el desarrollo equitativo de todos los departamentos, anunciando la construcción de la planta procesadora de uva y la ampliación del aeropuerto Capitán Oriel Lea Plaza.',
    content: `<p>En una sesión histórica realizada en la ciudad de Tarija, la Cámara de Senadores rindió homenaje al departamento en su aniversario. Durante la jornada legislativa, se aprobaron por unanimidad tres proyectos de ley clave para el desarrollo productivo de la región.</p><p>El primero de ellos destina más de Bs 500 millones para proyectos de infraestructura vial, incluyendo la ampliación de la carretera Tarija-Yacuiba y la construcción del puente sobre el río Pilcomayo.</p><p>El presidente del Senado destacó durante su discurso la importancia de la inversión en infraestructura como motor del desarrollo económico. Anunció además la construcción de la planta procesadora de uva y la ampliación del aeropuerto Capitán Oriel Lea Plaza.</p><p>Los senadores de Tarija expresaron su satisfacción por los logros alcanzados y reiteraron su compromiso de seguir trabajando por el desarrollo del departamento.</p><p>Finalmente, se aprobó una declaración camaral que reconoce los méritos del pueblo tarijeño y su contribución al desarrollo nacional.</p>`,
    excerpt: 'La Cámara de Senadores realizó una sesión especial en Tarija',
    publishedAt: '2026-04-15T00:00:00.000Z',
    fechaFormateada: '15 de abril de 2026',
    featuredImage: { url: imagenesSimuladas[0], alt: 'Sesión en Tarija' },
    categoria: 'Sesión Especial',
    type: 'news',
    status: 'published',
    importante: true,
    views: 1250
  },
  {
    id: 2,
    slug: 'ley-general-de-aguas',
    titulo: 'Senado aprueba Ley General de Aguas para garantizar el acceso al agua potable',
    descripcion: 'Por unanimidad, la Cámara Alta aprobó la nueva Ley General de Aguas que garantiza el acceso al agua potable como derecho fundamental.',
    descripcion2: 'La ley contempla la creación de un fondo de inversión de Bs 1.200 millones.',
    content: `<p>Por unanimidad, la Cámara de Senadores aprobó la nueva Ley General de Aguas, que garantiza el acceso al agua potable como derecho fundamental.</p><p>La ley contempla la creación de un fondo de inversión de Bs 1.200 millones para proyectos de riego tecnificado y plantas de tratamiento.</p><p>Durante el debate, senadores de diferentes regiones destacaron la importancia de esta norma.</p><p>La comisión de Medio Ambiente será la encargada de dar seguimiento a la implementación.</p><p>Organizaciones sociales manifestaron su respaldo a la iniciativa.</p>`,
    excerpt: 'La Cámara Alta aprueba Ley General de Aguas',
    publishedAt: '2026-04-10T00:00:00.000Z',
    fechaFormateada: '10 de abril de 2026',
    featuredImage: { url: imagenesSimuladas[1], alt: 'Agua potable' },
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
    descripcion: 'La Comisión de Constitución aprobó el proyecto de ley de reforma parcial del Órgano Judicial.',
    descripcion2: 'La reforma busca fortalecer la independencia judicial.',
    content: `<p>La Comisión de Constitución aprobó el proyecto de ley de reforma parcial del Órgano Judicial.</p><p>El senador presidente de la comisión señaló que la reforma busca fortalecer la independencia judicial.</p><p>La iniciativa fue trabajada durante varios meses, recibiendo aportes de expertos.</p><p>Entre los puntos clave se incluye la renovación escalonada de magistrados.</p><p>Organizaciones de derechos humanos manifestaron su respaldo.</p>`,
    excerpt: 'Comisión de Constitución aprueba reforma judicial',
    publishedAt: '2026-04-05T00:00:00.000Z',
    fechaFormateada: '5 de abril de 2026',
    featuredImage: { url: imagenesSimuladas[2], alt: 'Reforma judicial' },
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
    descripcion: 'Representantes del Senado boliviano y del Congreso chileno se reunieron en una mesa técnica.',
    descripcion2: 'Se acordó establecer una agenda de trabajo conjunta.',
    content: `<p>Representantes del Senado boliviano y del Congreso chileno se reunieron en una mesa técnica.</p><p>Se acordó establecer una agenda de trabajo conjunta y próximos encuentros.</p><p>El presidente del Senado boliviano destacó la importancia del diálogo.</p><p>Los senadores chilenos expresaron su interés en profundizar la relación bilateral.</p><p>Este diálogo representa un paso importante en las relaciones bilaterales.</p>`,
    excerpt: 'Senado y Congreso chileno retoman diálogo bilateral',
    publishedAt: '2026-04-01T00:00:00.000Z',
    fechaFormateada: '1 de abril de 2026',
    featuredImage: { url: imagenesSimuladas[3], alt: 'Diálogo bilateral' },
    categoria: 'Relaciones Internacionales',
    type: 'news',
    status: 'published',
    importante: true,
    views: 620
  }
]

// Generar 96 noticias adicionales simuladas
const generarNoticiasSimuladas = () => {
  const categorias = ['Seguridad', 'Economía', 'Educación', 'Salud', 'Infraestructura', 'Energía', 'Cultura', 'Deporte', 'Tecnología', 'Turismo', 'Agricultura', 'Minería']
  const noticias = []
  
  for (let i = 5; i <= 100; i++) {
    const categoria = categorias[i % categorias.length]
    const dia = 30 - Math.floor(i / 8)
    const fecha = new Date(2026, 2, dia)
    
    noticias.push({
      id: i,
      slug: `noticia-${i}`,
      titulo: `Senado impulsa proyecto de ley sobre ${categoria.toLowerCase()}`,
      descripcion: `La Cámara de Senadores continúa trabajando en iniciativas legislativas sobre ${categoria.toLowerCase()}.`,
      content: `<p>La Cámara de Senadores continúa trabajando en iniciativas legislativas sobre ${categoria.toLowerCase()}.</p><p>La iniciativa fue presentada por senadores de diferentes fuerzas políticas.</p><p>Durante el debate, legisladores destacaron la importancia de esta norma.</p><p>La comisión correspondiente dará seguimiento a la implementación.</p><p>Organizaciones sociales manifestaron su respaldo.</p>`,
      excerpt: `Senado impulsa proyecto de ley sobre ${categoria.toLowerCase()}`,
      publishedAt: fecha.toISOString(),
      fechaFormateada: fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
      featuredImage: { url: imagenesSimuladas[i % imagenesSimuladas.length], alt: `Noticia ${i}` },
      categoria: categoria,
      type: 'news',
      status: 'published',
      importante: false,
      views: Math.floor(Math.random() * 1000)
    })
  }
  
  return noticias
}

const noticiasSimuladas = [...noticiasImportantesSimuladas, ...generarNoticiasSimuladas()]

// Variable para controlar si usamos datos reales o simulados
let usarDatosReales = false // Cambiar a true cuando la BD esté lista

/**
 * @swagger
 * tags:
 *   name: Content
 *   description: Gestión de contenido (páginas, noticias, artículos)
 */

class ContentController {
  /**
   * @swagger
   * /api/content:
   *   post:
   *     summary: Crear nuevo contenido
   *     tags: [Content]
   *     security:
   *       - bearerAuth: []
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
   * @swagger
   * /api/content:
   *   get:
   *     summary: Obtener lista de contenido
   *     tags: [Content]
   */
  async getContents(req, res) {
    try {
      // Si estamos en modo simulación, devolver datos simulados
      if (usarDatosReales === false) {
        const { page = 1, limit = 12, type, status } = req.query
        
        let filtradas = [...noticiasSimuladas]
        
        if (type && type !== 'all') {
          filtradas = filtradas.filter(n => n.type === type)
        }
        
        if (status && status !== 'all') {
          filtradas = filtradas.filter(n => n.status === status)
        }
        
        const ordenadas = filtradas.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        
        const total = ordenadas.length
        const start = (parseInt(page) - 1) * parseInt(limit)
        const end = start + parseInt(limit)
        const contents = ordenadas.slice(start, end)
        
        return res.json({
          success: true,
          data: {
            contents,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
          }
        })
      }
      
      // Modo real: usar servicio de base de datos
      const { page = 1, limit = 10, type, category, status, search, includeDrafts, language, fromDate, toDate, tags } = req.query;

      const filters = {};
      if (type) filters.type = type;
      if (category) filters.category = category;
      if (status) filters.status = status;
      if (search) filters.search = search;
      if (language) filters.language = language;
      if (fromDate) filters.fromDate = fromDate;
      if (toDate) filters.toDate = toDate;
      if (includeDrafts) filters.includeDrafts = includeDrafts === 'true';
      if (tags) filters.tags = tags.split(',');

      const result = await contentService.getContents(
        parseInt(page),
        parseInt(limit),
        filters
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * @swagger
   * /api/content/{id}:
   *   get:
   *     summary: Obtener contenido por ID
   *     tags: [Content]
   */
  async getContentById(req, res) {
    try {
      // Modo simulación
      if (usarDatosReales === false) {
        const { id } = req.params;
        const content = noticiasSimuladas.find(n => n.id == id);
        
        if (!content) {
          return res.status(404).json({
            success: false,
            message: 'Contenido no encontrado',
          });
        }
        
        return res.json({
          success: true,
          data: content,
        });
      }
      
      // Modo real
      const { id } = req.params;
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
   * @swagger
   * /api/content/slug/{slug}:
   *   get:
   *     summary: Obtener contenido por slug
   *     tags: [Content]
   */
  async getContentBySlug(req, res) {
    try {
      // Modo simulación
      if (usarDatosReales === false) {
        const { slug } = req.params;
        const content = noticiasSimuladas.find(n => n.slug === slug);
        
        if (!content) {
          return res.status(404).json({
            success: false,
            message: 'Contenido no encontrado',
          });
        }
        
        content.views += 1;
        
        return res.json({
          success: true,
          data: content,
        });
      }
      
      // Modo real
      const { slug } = req.params;
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
   * @swagger
   * /api/content/{id}:
   *   put:
   *     summary: Actualizar contenido
   *     tags: [Content]
   *     security:
   *       - bearerAuth: []
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
   * @swagger
   * /api/content/{id}:
   *   delete:
   *     summary: Eliminar contenido
   *     tags: [Content]
   *     security:
   *       - bearerAuth: []
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
   * @swagger
   * /api/content/{id}/status:
   *   patch:
   *     summary: Cambiar estado del contenido
   *     tags: [Content]
   *     security:
   *       - bearerAuth: []
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
   * @swagger
   * /api/content/stats:
   *   get:
   *     summary: Obtener estadísticas de contenido
   *     tags: [Content]
   *     security:
   *       - bearerAuth: []
   */
  async getStats(req, res) {
    try {
      // Modo simulación
      if (usarDatosReales === false) {
        return res.json({
          success: true,
          data: {
            total: noticiasSimuladas.length,
            importantes: noticiasImportantesSimuladas.length,
            publicadas: noticiasSimuladas.filter(n => n.status === 'published').length
          },
        });
      }
      
      // Modo real
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
   * @swagger
   * /api/content/search:
   *   get:
   *     summary: Buscar contenido
   *     tags: [Content]
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

      // Modo simulación
      if (usarDatosReales === false) {
        const termino = q.toLowerCase();
        const results = noticiasSimuladas.filter(item => 
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
   * @swagger
   * /api/content/{id}/related:
   *   get:
   *     summary: Obtener contenido relacionado
   *     tags: [Content]
   */
  async getRelatedContent(req, res) {
    try {
      const { id } = req.params;
      const { limit = 5 } = req.query;

      // Modo simulación
      if (usarDatosReales === false) {
        const current = noticiasSimuladas.find(n => n.id == id);
        
        if (!current) {
          return res.json({ success: true, data: [] });
        }
        
        const related = noticiasSimuladas
          .filter(n => n.id != id && n.type === current.type)
          .slice(0, parseInt(limit));
        
        return res.json({
          success: true,
          data: related,
        });
      }

      const related = await contentService.getRelatedContent(id, parseInt(limit));

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
   * @swagger
   * /api/content/types:
   *   get:
   *     summary: Obtener tipos de contenido disponibles
   *     tags: [Content]
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
   * @swagger
   * /api/content/categories:
   *   get:
   *     summary: Obtener categorías disponibles
   *     tags: [Content]
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
   * @swagger
   * /api/content/upload/image:
   *   post:
   *     summary: Subir imagen para contenido
   *     tags: [Content]
   *     security:
   *       - bearerAuth: []
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
   * @swagger
   * /api/content/upload/document:
   *   post:
   *     summary: Subir documento
   *     tags: [Content]
   *     security:
   *       - bearerAuth: []
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