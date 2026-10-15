// src/config/tiposDocumento.js
// Configuración central de tipos de documentos legislativos.
// Aquí se define qué campos usa cada tipo, cuáles son obligatorios,
// y las reglas de negocio específicas (ej: qué campos se bloquean al editar).

const TIPOS_DOCUMENTO = {
  // ============================================
  // 🔍 FISCALIZACIÓN
  // ============================================
  'peticion-informe-escrito': {
    label: 'Peticiones de Informe Escrito',
    bloque: 'fiscalizacion',
    prefijoCodigo: 'P.I.E.',

    // Campos editables (todos menos numero y tipo)
    campos: [
      'codigo',
      'fechaIngreso',
      'peticionario',
      'asunto',
      'destinatario',
      'tipoDestinatario',
      'fechaRemisionDestinatario',
      'fechaRespuesta',
      'fechaRemisionPeticionario',
      'conminatoria',
      'observacion',
      'archivo'
    ],

    // Campos obligatorios al crear
    camposObligatorios: [
      'numero',
      'codigo',
      'fechaIngreso',
      'peticionario',
      'asunto',
      'destinatario',
      'tipoDestinatario'
    ],

    // Campos que NO se pueden modificar después de crear
    camposBloqueadosEnEdicion: ['numero']
  },

  'peticion-informe-oral': {
    label: 'Peticiones de Informe Oral',
    bloque: 'fiscalizacion',
    prefijoCodigo: 'P.I.O.',

    campos: [
      'codigo',
      'fechaIngreso',
      'peticionario',
      'asunto',
      'destinatario',
      'tipoDestinatario',
      'fechaRemisionDestinatario',
      'fechaRealizacion',
      'fechaReprogramacion',
      'fechaRealizacionFinal',
      'observacion',
      'archivo'
    ],

    camposObligatorios: [
      'numero',
      'codigo',
      'fechaIngreso',
      'peticionario',
      'asunto',
      'destinatario',
      'tipoDestinatario'
    ],

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

// Helper: ¿es un tipo válido?
const esTipoValido = (tipo) => Object.keys(TIPOS_DOCUMENTO).includes(tipo);

// Helper: obtener la configuración de un tipo
const getConfigTipo = (tipo) => TIPOS_DOCUMENTO[tipo] || null;

module.exports = {
  TIPOS_DOCUMENTO,
  TIPOS_DESTINATARIO,
  esTipoValido,
  getConfigTipo
};