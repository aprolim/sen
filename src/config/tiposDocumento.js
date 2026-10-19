// src/config/tiposDocumento.js
// Configuración central de tipos de documentos legislativos.

const TIPOS_DOCUMENTO = {
  // ============================================
  // 🔍 FISCALIZACIÓN
  // ============================================
  'peticion-informe-escrito': {
    label: 'Peticiones de Informe Escrito',
    bloque: 'fiscalizacion',
    prefijoCodigo: 'P.I.E.',
    campos: [
      'codigo', 'fechaIngreso', 'peticionario', 'asunto', 'destinatario',
      'tipoDestinatario', 'fechaRemisionDestinatario', 'fechaRespuesta',
      'fechaRemisionPeticionario', 'conminatoria', 'observacion', 'archivo'
    ],
    camposObligatorios: ['numero', 'codigo', 'fechaIngreso', 'peticionario', 'asunto', 'destinatario', 'tipoDestinatario'],
    camposBloqueadosEnEdicion: ['numero']
  },

  'peticion-informe-oral': {
    label: 'Peticiones de Informe Oral',
    bloque: 'fiscalizacion',
    prefijoCodigo: 'P.I.O.',
    campos: [
      'codigo', 'fechaIngreso', 'peticionario', 'asunto', 'destinatario',
      'tipoDestinatario', 'fechaRemisionDestinatario', 'fechaRealizacion',
      'fechaReprogramacion', 'fechaRealizacionFinal', 'observacion', 'archivo'
    ],
    camposObligatorios: ['numero', 'codigo', 'fechaIngreso', 'peticionario', 'asunto', 'destinatario', 'tipoDestinatario'],
    camposBloqueadosEnEdicion: ['numero']
  },

  // ============================================
  // 📋 GESTIÓN
  // ============================================
  'minuta-comunicacion': {
    label: 'Minutas de Comunicación',
    bloque: 'gestion',
    prefijoCodigo: 'M.C.',
    campos: [
      'codigo', 'fechaIngreso', 'peticionario', 'asunto', 'destinatario',
      'fechaRemisionDestinatario', 'tipoDestinatario', 'fechaRespuesta',
      'fechaRemisionPeticionario', 'observacion', 'archivo'
    ],
    camposObligatorios: ['numero', 'codigo', 'fechaIngreso', 'peticionario', 'asunto', 'destinatario', 'tipoDestinatario'],
    camposBloqueadosEnEdicion: ['numero']
  },

  'resolucion-camaral': {
    label: 'Resoluciones Camarales',
    bloque: 'gestion',
    prefijoCodigo: 'R.C.',
    campos: [
      'codigo', 'fechaIngreso', 'peticionario', 'asunto',
      'fechaAprobacion', 'sesion', 'observacion', 'archivo'
    ],
    camposObligatorios: ['numero', 'codigo', 'fechaIngreso', 'peticionario', 'asunto'],
    camposBloqueadosEnEdicion: ['numero', 'peticionario']
  },

  'declaracion-camaral': {
    label: 'Declaraciones Camarales',
    bloque: 'gestion',
    prefijoCodigo: 'D.C.',
    campos: [
      'codigo', 'fechaIngreso', 'peticionario', 'asunto',
      'fechaAprobacion', 'observacion', 'archivo'
    ],
    camposObligatorios: ['numero', 'codigo', 'fechaIngreso', 'peticionario', 'asunto'],
    camposBloqueadosEnEdicion: ['numero']
  },

  'homenaje-camaral': {
    label: 'Homenajes Camarales',
    bloque: 'gestion',
    prefijoCodigo: 'H.C.',
    campos: [
      'codigo', 'fechaIngreso', 'peticionario', 'asunto',
      'fechaAprobacion', 'observacion', 'archivo'
    ],
    camposObligatorios: ['numero', 'codigo', 'fechaIngreso', 'peticionario', 'asunto'],
    camposBloqueadosEnEdicion: ['numero']
  },

  // ============================================
  // ⚖️ LEGISLACIÓN
  // ============================================
  'proyecto-ley-tratamiento-senado': {
    label: 'Proyectos de Ley en Tratamiento (Senado)',
    bloque: 'legislacion',
    prefijoCodigo: 'P.L. C.S.',
    campos: [
      'codigo', // 🔥 AGREGADO CORRECTAMENTE AQUÍ
      'fechaIngreso', 'peticionario', 'asunto', 'esNuevoOReReposicion',
      'plAnterior', 'comisionI', 'fechaRemisionComisionI', 'comisionII',
      'fechaRemisionComisionII', 'estadoLey', 'fechaAprobacion',
      'fechaRemisionDiputados', 'observacion', 'archivo'
    ],
    camposObligatorios: ['numero', 'codigo', 'fechaIngreso', 'asunto', 'peticionario', 'estadoLey'],
    camposBloqueadosEnEdicion: ['numero', 'codigo']
  },

  'proyecto-ley-revision-diputados': {
    label: 'Proyectos de Ley en Revisión (Diputados)',
    bloque: 'legislacion',
    prefijoCodigo: 'P.L. C.D.',
    campos: [
      'codigo', // 🔥 AGREGADO CORRECTAMENTE AQUÍ
      'fechaIngreso', 'peticionario', 'asunto', 'comisionI',
      'fechaRemisionComisionI', 'comisionII', 'fechaRemisionComisionII',
      'estadoLey', 'fechaSancion', 'fechaRemisionEjecutivo',
      'observacion', 'archivo'
    ],
    camposObligatorios: ['numero', 'codigo', 'fechaIngreso', 'asunto', 'peticionario', 'estadoLey'],
    camposBloqueadosEnEdicion: ['numero', 'codigo']
  },

  // Placeholders para los otros tipos
  'proyecto-ley-aprobados': {
    label: 'Proyectos de Ley Aprobados',
    bloque: 'legislacion',
    prefijoCodigo: 'P.L.',
    campos: [
      'codigo', 'fechaIngreso', 'peticionario', 'asunto', 'archivo'
    ],
    camposObligatorios: ['numero', 'codigo', 'fechaIngreso', 'asunto', 'peticionario'],
    camposBloqueadosEnEdicion: ['numero']
  },

  'proyecto-ley-sancionados': {
    label: 'Proyectos de Ley Sancionados',
    bloque: 'legislacion',
    prefijoCodigo: 'P.L.',
    campos: [
      'codigo', 'fechaIngreso', 'peticionario', 'asunto', 'archivo'
    ],
    camposObligatorios: ['numero', 'codigo', 'fechaIngreso', 'asunto', 'peticionario'],
    camposBloqueadosEnEdicion: ['numero']
  },

  'proyecto-ley-modificaciones': {
    label: 'Proyectos de Ley con Modificaciones',
    bloque: 'legislacion',
    prefijoCodigo: 'P.L.',
    campos: [
      'codigo', 'fechaIngreso', 'peticionario', 'asunto', 'archivo'
    ],
    camposObligatorios: ['numero', 'codigo', 'fechaIngreso', 'asunto', 'peticionario'],
    camposBloqueadosEnEdicion: ['numero']
  },

  'proyecto-ley-rechazados': {
    label: 'Proyectos de Ley Rechazados',
    bloque: 'legislacion',
    prefijoCodigo: 'P.L.',
    campos: [
      'codigo', 'fechaIngreso', 'peticionario', 'asunto', 'archivo'
    ],
    camposObligatorios: ['numero', 'codigo', 'fechaIngreso', 'asunto', 'peticionario'],
    camposBloqueadosEnEdicion: ['numero']
  },

  'ley-promulgada': {
    label: 'Leyes Promulgadas',
    bloque: 'legislacion',
    prefijoCodigo: '',
    campos: [
      'codigo', 'fechaIngreso', 'peticionario', 'asunto', 'archivo'
    ],
    camposObligatorios: ['numero', 'codigo', 'fechaIngreso', 'asunto', 'peticionario'],
    camposBloqueadosEnEdicion: ['numero']
  }
};

// Lista de valores válidos para "tipo de destinatario"
const TIPOS_DESTINATARIO = [
  'Órgano Ejecutivo',
  'Órgano Judicial',
  'Órgano Electoral',
  'Gobernación',
  'Alcaldía',
  'Universidad',
  'Otra Entidad'
];

const esTipoValido = (tipo) => Object.keys(TIPOS_DOCUMENTO).includes(tipo);
const getConfigTipo = (tipo) => TIPOS_DOCUMENTO[tipo] || null;

module.exports = {
  TIPOS_DOCUMENTO,
  TIPOS_DESTINATARIO,
  esTipoValido,
  getConfigTipo
};