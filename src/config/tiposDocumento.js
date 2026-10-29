// src/config/tiposDocumento.js
// Configuración central de tipos de documentos legislativos.

// ============================================
// 🔥 MAPA DE ESTADO ↔ TIPO (para los 4 destinos)
// ============================================
const ESTADO_A_TIPO = {
  'APROBADO': 'proyecto-ley-aprobados',
  'SANCIONADO': 'proyecto-ley-sancionados',
  'APROBADO CON MODIFICACIONES': 'proyecto-ley-modificaciones',
  'RECHAZADO': 'proyecto-ley-rechazados'
};

const TIPO_A_ESTADO = {
  'proyecto-ley-aprobados': 'APROBADO',
  'proyecto-ley-sancionados': 'SANCIONADO',
  'proyecto-ley-modificaciones': 'APROBADO CON MODIFICACIONES',
  'proyecto-ley-rechazados': 'RECHAZADO'
};

// Tipos "origen" que pueden transicionar
const TIPOS_ORIGEN_TRANSICION = [
  'proyecto-ley-tratamiento-senado',
  'proyecto-ley-revision-diputados'
];

// Tipos "destino" a los que se puede llegar
const TIPOS_DESTINO_TRANSICION = Object.values(ESTADO_A_TIPO);

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
  // ⚖️ LEGISLACIÓN - ORIGEN
  // ============================================
  'proyecto-ley-tratamiento-senado': {
    label: 'Proyectos de Ley en Tratamiento (Senado)',
    bloque: 'legislacion',
    prefijoCodigo: 'P.L. C.S.',
    campos: [
      'codigo', 'fechaIngreso', 'peticionario', 'asunto',
      'esNuevoOReReposicion', 'plAnterior',
      'comisionI', 'fechaRemisionComisionI',
      'comisionII', 'fechaRemisionComisionII',
      'estadoLey', 'fechaAprobacion', 'fechaRemisionDiputados',
      'observacion', 'archivo'
    ],
    camposObligatorios: ['numero', 'codigo', 'fechaIngreso', 'asunto', 'peticionario', 'estadoLey'],
    camposBloqueadosEnEdicion: ['numero', 'codigo']
  },

  'proyecto-ley-revision-diputados': {
    label: 'Proyectos de Ley en Revisión (Diputados)',
    bloque: 'legislacion',
    prefijoCodigo: 'P.L. C.D.',
    campos: [
      'codigo', 'fechaIngreso', 'peticionario', 'asunto',
      'comisionI', 'fechaRemisionComisionI',
      'comisionII', 'fechaRemisionComisionII',
      'estadoLey', 'fechaSancion', 'fechaRemisionEjecutivo',
      'observacion', 'archivo'
    ],
    camposObligatorios: ['numero', 'codigo', 'fechaIngreso', 'asunto', 'peticionario', 'estadoLey'],
    camposBloqueadosEnEdicion: ['numero', 'codigo']
  },

  // ============================================
  // ⚖️ LEGISLACIÓN - DESTINOS (los 4 nuevos)
  // ============================================

  // 🔵 APROBADOS
  // 🔥 CAMBIO: numeroLey y archivoAnexo ya NO son obligatorios
  'proyecto-ley-aprobados': {
    label: 'Proyectos de Ley Aprobados',
    bloque: 'legislacion',
    prefijoCodigo: 'P.L.',
    estadoRequerido: 'APROBADO',
    campos: [
      'codigo', 'fechaIngreso', 'peticionario', 'asunto',
      'esNuevoOReReposicion', 'plAnterior',
      'comisionI', 'fechaRemisionComisionI',
      'comisionII', 'fechaRemisionComisionII',
      'estadoLey', 'fechaAprobacion', 'fechaRemisionDiputados',
      'observacion', 'numeroLey',
      'archivo', 'archivoAnexo'
    ],
    camposObligatorios: [
      'numero', 'codigo', 'fechaIngreso', 'asunto', 'peticionario',
      'estadoLey', 'fechaAprobacion', 'fechaRemisionDiputados'
      // 🔥 numeroLey y archivoAnexo removidos de obligatorios
    ],
    camposBloqueadosEnEdicion: ['numero', 'codigo']
  },

  // 🟣 SANCIONADOS
  // 🔥 CAMBIO: numeroLey y archivoAnexo ya NO son obligatorios
  'proyecto-ley-sancionados': {
    label: 'Proyectos de Ley Sancionados',
    bloque: 'legislacion',
    prefijoCodigo: 'P.L.',
    estadoRequerido: 'SANCIONADO',
    campos: [
      'codigo', 'fechaIngreso', 'peticionario', 'asunto',
      'comisionI', 'fechaRemisionComisionI',
      'comisionII', 'fechaRemisionComisionII',
      'estadoLey', 'fechaSancion', 'fechaRemisionEjecutivo',
      'observacion', 'numeroLey',
      'archivo', 'archivoAnexo'
    ],
    camposObligatorios: [
      'numero', 'codigo', 'fechaIngreso', 'asunto', 'peticionario',
      'estadoLey', 'fechaSancion', 'fechaRemisionEjecutivo'
      // 🔥 numeroLey y archivoAnexo removidos de obligatorios
    ],
    camposBloqueadosEnEdicion: ['numero', 'codigo']
  },

  // 🟡 APROBADOS CON MODIFICACIONES (DEVUELTOS A DIPUTADOS)
  // 🔥 CAMBIO: numeroLey y archivoAnexo ya NO son obligatorios
  'proyecto-ley-modificaciones': {
    label: 'Proyectos de Ley con Modificaciones',
    bloque: 'legislacion',
    prefijoCodigo: 'P.L.',
    estadoRequerido: 'APROBADO CON MODIFICACIONES',
    campos: [
      'codigo', 'fechaIngreso', 'peticionario', 'asunto',
      'comisionI', 'fechaRemisionComisionI',
      'comisionII', 'fechaRemisionComisionII',
      'estadoLey', 'fechaAprobacion', 'fechaRemisionDiputados',
      'observacion', 'numeroLey',
      'archivo', 'archivoAnexo'
    ],
    camposObligatorios: [
      'numero', 'codigo', 'fechaIngreso', 'asunto', 'peticionario',
      'estadoLey', 'fechaAprobacion', 'fechaRemisionDiputados'
      // 🔥 numeroLey y archivoAnexo removidos de obligatorios
    ],
    camposBloqueadosEnEdicion: ['numero', 'codigo']
  },

  // 🔴 RECHAZADOS (sin numeroLey)
  // 🔥 CAMBIO: archivoAnexo ya NO es obligatorio
  'proyecto-ley-rechazados': {
    label: 'Proyectos de Ley Rechazados',
    bloque: 'legislacion',
    prefijoCodigo: 'P.L.',
    estadoRequerido: 'RECHAZADO',
    campos: [
      'codigo', 'fechaIngreso', 'peticionario', 'asunto',
      'comisionI', 'fechaRemisionComisionI',
      'comisionII', 'fechaRemisionComisionII',
      'estadoLey', 'fechaRechazo', 'fechaRemisionDiputados',
      'observacion',
      'archivo', 'archivoAnexo'
    ],
    camposObligatorios: [
      'numero', 'codigo', 'fechaIngreso', 'asunto', 'peticionario',
      'estadoLey', 'fechaRechazo', 'fechaRemisionDiputados'
      // 🔥 archivoAnexo removido de obligatorios
    ],
    camposBloqueadosEnEdicion: ['numero', 'codigo']
  },

  // ============================================
  // ⚖️ LEGISLACIÓN - LEY PROMULGADA (existente)
  // ============================================
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

// ============================================
// LISTA DE VALORES VÁLIDOS
// ============================================
const TIPOS_DESTINATARIO = [
  'Órgano Ejecutivo',
  'Órgano Judicial',
  'Órgano Electoral',
  'Gobernación',
  'Alcaldía',
  'Universidad',
  'Otra Entidad'
];

const ESTADOS_LEY_VALIDOS = [
  'EN TRATAMIENTO',
  'EN REVISIÓN',
  'APROBADO',
  'SANCIONADO',
  'APROBADO CON MODIFICACIONES',
  'RECHAZADO'
];

// ============================================
// HELPERS
// ============================================
const esTipoValido = (tipo) => Object.keys(TIPOS_DOCUMENTO).includes(tipo);
const getConfigTipo = (tipo) => TIPOS_DOCUMENTO[tipo] || null;

/**
 * Devuelve el `tipo` destino según el `estadoLey`. Null si el estado no mapea.
 */
const getTipoPorEstado = (estadoLey) => ESTADO_A_TIPO[estadoLey] || null;

/**
 * Devuelve el `estadoLey` esperado para un `tipo` destino. Null si no aplica.
 */
const getEstadoPorTipo = (tipo) => TIPO_A_ESTADO[tipo] || null;

/**
 * ¿Es un tipo al que se puede llegar por transición de estado?
 */
const esTipoDestinoTransicion = (tipo) => TIPOS_DESTINO_TRANSICION.includes(tipo);

/**
 * ¿Es un tipo origen del que se puede salir por transición?
 */
const esTipoOrigenTransicion = (tipo) => TIPOS_ORIGEN_TRANSICION.includes(tipo);

/**
 * Valida si una transición de estado está permitida.
 * @returns { ok: boolean, tipoNuevo?: string, mensaje?: string }
 */
const validarTransicion = (tipoActual, estadoNuevo) => {
  if (!esTipoOrigenTransicion(tipoActual)) {
    return {
      ok: false,
      mensaje: `Solo se puede cambiar de estado desde "proyecto-ley-tratamiento-senado" o "proyecto-ley-revision-diputados". Tipo actual: ${tipoActual}`
    };
  }

  const tipoNuevo = getTipoPorEstado(estadoNuevo);

  if (!tipoNuevo) {
    return {
      ok: false,
      mensaje: `Estado no válido para transición: ${estadoNuevo}. Válidos: APROBADO, SANCIONADO, APROBADO CON MODIFICACIONES, RECHAZADO`
    };
  }

  return { ok: true, tipoNuevo };
};

module.exports = {
  TIPOS_DOCUMENTO,
  TIPOS_DESTINATARIO,
  ESTADOS_LEY_VALIDOS,
  ESTADO_A_TIPO,
  TIPO_A_ESTADO,
  TIPOS_ORIGEN_TRANSICION,
  TIPOS_DESTINO_TRANSICION,
  esTipoValido,
  getConfigTipo,
  getTipoPorEstado,
  getEstadoPorTipo,
  esTipoDestinoTransicion,
  esTipoOrigenTransicion,
  validarTransicion
};