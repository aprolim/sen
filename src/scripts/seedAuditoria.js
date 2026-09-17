// src/scripts/seedAuditoria.js
// Ejecutar: node src/scripts/seedAuditoria.js --force

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const AuditoriaCategoria = require('../models/AuditoriaCategoria');
const AuditoriaDocumento = require('../models/AuditoriaDocumento');
const User = require('../models/User');

// ============================================
// CATEGORÍAS POR MÓDULO
// ============================================
const CATEGORIAS_DATA = {
  'auditorias-ejecutadas': [
    { key: 'cumplimiento',  nombre: 'Auditoría de Cumplimiento', icono: 'mdi:clipboard-check', orden: 10 },
    { key: 'operacionales', nombre: 'Auditoría de Operativa',    icono: 'mdi:cog',             orden: 20 },
    { key: 'confiabilidad', nombre: 'Auditoría de Confiabilidad', icono: 'mdi:shield-check',   orden: 30 }
  ],
  'informes-actividades': [
    { key: 'anuales',     nombre: 'Informes Anuales',      icono: 'mdi:calendar-year',  orden: 10 },
    { key: 'semestrales', nombre: 'Informes Semestrales',  icono: 'mdi:calendar-split', orden: 20 }
  ],
  'otras-actividades': [
    { key: 'relevamientos', nombre: 'Relevamientos de Información', icono: 'mdi:clipboard-search', orden: 10 },
    { key: 'seguimientos',  nombre: 'Informes de Seguimientos',     icono: 'mdi:file-check',       orden: 20 }
  ]
};

// ============================================
// DOCUMENTOS POR MÓDULO Y CATEGORÍA
// ============================================
const DOCUMENTOS_DATA = {
  'auditorias-ejecutadas': {
    cumplimiento: [
      { titulo: 'UAI/ACU/CI-002/2025', gestion: 2025, descripcion: 'INFORME DE CONTROL INTERNO PRODUCTO DE LA AUDITORIA DE CUMPLIMIENTO AL SISTEMA DE PRESUPUESTOS DE LA CAMARA DE SENADORES - GESTION 2024', url: 'https://apisi.senado.gob.bo/images/a0d5e3d0-afea-4234-b721-73aba2c82986_1768405105.pdf' },
      { titulo: 'UAI/ACU/CI-001/2025', gestion: 2025, descripcion: 'INFORME DE CONTROL INTERNO PRODUCTO DE LA AUDITORIA DE CUMPLIMIENTO AL PROCEDIMIENTO ESPECÍFICO PARA EL CONTROL Y CONCILIACIÓN DE DATOS LIQUIDADOS EN LAS PLANILLAS SALARIALES Y LOS REGISTROS INDIVIDUALES Y PROCEDIMIENTOS IMPLANTADOS PARA EVITAR LA DOBLE PERCEPCIÓN POR PARTE DEL PERSONAL PERMANENTE Y EVENTUAL DE LA CÁMARA DE SENADORES - GESTIÓN 2024', url: 'https://apisi.senado.gob.bo/images/a0d5cb1f-dd71-4746-aeec-5a3ca20910ff_1768400963.pdf' },
      { titulo: 'INF-UAI-VC-N° 001-2024', gestion: 2024, descripcion: 'VERIFICACIÓN DEL CUMPLIMIENTO DEL CONTROL Y CONCILIACIÓN DE DATOS LIQUIDADOS', url: 'https://apisi.senado.gob.bo/images/9d5b0d1c-28d8-4a78-a377-36b309db9635_1730143875.pdf' },
      { titulo: 'INF-UAI-VC-N° 002-2023', gestion: 2023, descripcion: 'REVISIÓN ANUAL DJBR 2022', url: 'https://apisi.senado.gob.bo/images/9d5b0caf-6b89-4b72-8e39-bf10ad13ab71_1730143804.pdf' },
      { titulo: 'INF-UAI-VC-N° 001-2023', gestion: 2023, descripcion: 'VERIFICACION DEL CUMPLIMIENTO DEL CONTROL Y CONCILIACION DE DATOS LIQUIDADOS', url: 'https://apisi.senado.gob.bo/images/9d5afa5c-ae15-40eb-8a5f-4fa1c4f24771_1730140729.pdf' },
      { titulo: 'INF-UAI-CI-N° 004-2023', gestion: 2023, descripcion: 'INF. CONTROL INTERNO AUD. CUMP. FONDOS EN AVANCE Y FONDO ROTATIVO GESTIÓN 2022', url: 'https://apisi.senado.gob.bo/images/9d5ab1fe-76ae-48c1-a5f4-86e1b04d6d75_1730128588.pdf' },
      { titulo: 'INF-UAI-VC-N° 002-2022', gestion: 2022, descripcion: 'REVISIÓN ANUAL DJBR 2021', url: 'https://apisi.senado.gob.bo/images/9d5af795-2ff7-48ff-90a7-657939ad3c62_1730140263.pdf' },
      { titulo: 'INF-UAI-VC-N° 001-2022', gestion: 2022, descripcion: 'VERIFICACIÓN DEL CUMPLIMIENTO DEL CONTROL Y CONCILIACIÓN DE DATOS LIQUIDADOS', url: 'https://apisi.senado.gob.bo/images/9d5af73e-f59b-46f9-8ebb-42a2700e7817_1730140207.pdf' },
      { titulo: 'INF-UAI-CV-N° 002-2021', gestion: 2021, descripcion: 'REVISIÓN ANUAL DJBR 2020', url: 'https://apisi.senado.gob.bo/images/9d5abe36-2b2b-48ac-9512-3a482e3d8c84_1730130638.pdf' },
      { titulo: 'INF-UAI-CV N° 001-2021', gestion: 2021, descripcion: 'VERIFICACIÓN DEL CUMPLIMIENTO DEL CONTROL Y CONCILIACIÓN DE DATOS LIQUIDADOS', url: 'https://apisi.senado.gob.bo/images/9d5abd2f-0c34-40ad-8cc9-ca123b674a75_1730130465.pdf' },
      { titulo: 'INF-UAI-VC-N° 002-2020', gestion: 2020, descripcion: 'VERIFICACIÓN DEL CUMPLIMIENTO DEL PROCEDIMIENTO ESPECIFICO PARA EL CONTROL Y', url: 'https://apisi.senado.gob.bo/images/9d5abb94-a6cf-4238-ae36-fb185229124f_1730130196.pdf' },
      { titulo: 'INF-UAI-VC-N° 001-2020', gestion: 2020, descripcion: 'REVISIÓN ANUAL DECLARACIONES JURADAS DE BIENES Y RENTAS GESTIÓN 2019', url: 'https://apisi.senado.gob.bo/images/9d5abaff-0b09-4bbd-b21f-a85e84f25fd8_1730130098.pdf' },
      { titulo: 'INF-UAI-PREL.-N° 001-2020', gestion: 2020, descripcion: 'INF. PREL. AUDITORIA ESPECIAL AL PROCESO DE CONCENTRACIÓN Y PAGOS EMERGENTES DE', url: 'https://apisi.senado.gob.bo/images/9d5ab19f-8160-413a-bb39-471324eaa14f_1730128526.pdf' },
      { titulo: 'INF-UAI-VC-N° 002-2019', gestion: 2019, descripcion: 'REVISIÓN ANUAL-DECLARACIONES JURADAS DE BIENES Y RENTAS, GESTION 2018', url: 'https://apisi.senado.gob.bo/images/9d5ab7c9-9bfc-4b8f-af41-a503ecfbb977_1730129560.pdf' },
      { titulo: 'INF-UAI-VC-N° 001-2019', gestion: 2019, descripcion: 'VERIFICACIÓN DEL CUMPLIMIENTO DEL CONTROL Y CONCILIACIÓN DE DATOS LIQUIDADOS', url: 'https://apisi.senado.gob.bo/images/9d5ab598-7fc1-42ae-8abc-45ea967c832a_1730129192.pdf' },
      { titulo: 'INF-UAI-PREL.-N° 001-2019', gestion: 2019, descripcion: 'INF. PREL. AUDITORIA ESPECIAL PAGO POR DEMANDA DE REINCORPORACIÓN', url: 'https://apisi.senado.gob.bo/images/9d5ab0c6-1230-4c0a-a856-3db5fd93044d_1730128383.pdf' },
      { titulo: 'INF-UAI-COM-N° 001-2019', gestion: 2019, descripcion: 'INF. COMPLEMENTARIO AUDITORIA ESPECIAL IMPUESTOS RC-IVA 1994', url: 'https://apisi.senado.gob.bo/images/9d5ab131-f369-4fb8-b3c7-f4fb33b9af3e_1730128454.pdf' },
      { titulo: 'INF-UAI-AE-N° 001-2018', gestion: 2018, descripcion: 'AUDITORIA ESPECIAL SOBRE EL CUMPLIMIENTO DE DATOS LIQUIDADOS DE PLANILLAS SALA', url: 'https://apisi.senado.gob.bo/images/9d5ab051-6c6d-4a4c-a9dd-7a40648584c4_1730128307.pdf' },
      { titulo: 'INF-UAI-CI-N° 003-2016', gestion: 2016, descripcion: 'AUDITORIA ESPECIAL PROCEDIMIENTO DJBR 2015', url: 'https://apisi.senado.gob.bo/images/9d5aafdf-be99-4667-8272-c6dd1414d57a_1730128232.pdf' },
      { titulo: 'INF-UAI-CI-N° 005-2015', gestion: 2015, descripcion: 'AUDITORIA ESPECIAL PROCEDIMIENTO DJBR 2014', url: 'https://apisi.senado.gob.bo/images/9d5aaf85-bfb9-4a95-8cdd-0c70f49e66c8_1730128173.pdf' }
    ],
    operacionales: [
      { titulo: 'INF-UAI-SY-N° 002-2016', gestion: 2017, descripcion: 'EVALUACIÓN DEL SISTEMA DE PROGRAMACIÓN DE OPERACIÓN 2015', url: 'https://apisi.senado.gob.bo/images/9d5b0e7b-237d-4a6e-858a-50fd8a7c907a_1730144105.pdf' },
      { titulo: 'INF-UAI-SY-N° 001-2016', gestion: 2017, descripcion: 'EVALUACIÓN DEL SISTEMA DE PRESUPUESTOS 2015, 2016', url: 'https://apisi.senado.gob.bo/images/9d5b0dfd-cb33-4c3e-9917-a2c9d33cb3ad_1730144023.pdf' },
      { titulo: 'INF-UAI-SY-N° 001-2015', gestion: 2015, descripcion: 'EVALUACIÓN DEL SISTEMA DE PROGRAMACIÓN DE OPERACINES 2014, FORMULACIÓN DEL', url: 'https://apisi.senado.gob.bo/images/9d5b0d9b-9ece-4210-ac38-574cbfe51ca6_1730143958.pdf' },
      { titulo: 'INF-UAI-P-N° 002-2023', gestion: 2023, descripcion: 'PRONUNCIAMENTO SOBRE LA AUD. OP. SOBRE LA EFICACIA DE LAS ACTIVIDADES DE LA UNI.', url: 'https://apisi.senado.gob.bo/images/9d7acf94-c14d-4ca1-948d-153eb2090bbf_1731507942.pdf' },
      { titulo: 'INF-UAI-OP-N° 001-2016', gestion: 2016, descripcion: 'AUDITORIA OPERATIVA AL PROCESO DE ASESORAMIENTO EN LOS PROCESOS DE COMPRAS Y', url: 'https://apisi.senado.gob.bo/images/9d5ab2fb-415b-44f5-825e-dc987bcf6976_1730128754.pdf' },
      { titulo: 'INF-UAI-OP-N° 001-2015', gestion: 2016, descripcion: 'AUDITORIA OPERATIVA A LA UNIDAD DE ANÁLISIS LEGISLATIVO 2014', url: 'https://apisi.senado.gob.bo/images/9d5ab2a7-d81e-48f4-9f37-6b15103eb007_1730128699.pdf' },
      { titulo: 'INF-UAI-CI-N° 003/2023', gestion: 2023, descripcion: 'INF. CONTROL INTERNO AUD. OP. SOBRE LA EFICACIA DE LAS ACTIVIDADES DE LA UNI', url: 'https://apisi.senado.gob.bo/images/9d7ad34c-cb88-4a57-a202-ea4d1235def4_1731508565.pdf' }
    ],
    confiabilidad: [
      { titulo: 'UAI/CI/01/2026', gestion: 2026, descripcion: 'INFORME DE CONFIABILIDAD DE LOS REGISTROS DE LA CÁMARA DE SENADORES Y DEFICIENCIAS DE CONTROL INTERNO EMERGENTES DE SU EVALUACIÓN CORRESPONDIENTES A LA GESTIÓN 2025', url: 'https://apisi.senado.gob.bo/images/a0da7af6-18f9-436f-8982-020318f3aac5_1768602262.pdf' },
      { titulo: 'INF-UAI-P-N°002-2025', gestion: 2025, descripcion: 'INFORME DE CONFIABILIDAD DE LOS ESTADOS FINANCIEROS Y LAS DEFICIENCIAS DE CONTROL INTERNO DE LA ASAMBLEA LEGISLATIVA PLURINACIONAL DE BOLIVIA, GESTION 2024', url: 'https://apisi.senado.gob.bo/images/a03b88eb-ecac-42b9-a5b3-32ae7246a441_1761775606.pdf' },
      { titulo: 'INF-UAI-P-N°001-2025', gestion: 2025, descripcion: 'PRONUNCIAMIENTO SOBRE LA CONFIABILIDAD, GESTIÓN 2024', url: 'https://apisi.senado.gob.bo/images/9e847cc1-8414-4586-bd7c-8ff1e6e4c9e4_1742918659.pdf' },
      { titulo: 'INF-UAI-CI-N°002-2025', gestion: 2025, descripcion: 'INFORME DE CONFIABILIDAD DE ESTADOS FINANCIEROS 2024', url: 'https://apisi.senado.gob.bo/images/9e662b8a-f1f6-46b7-b8b3-b4101ba89da6_1741616543.pdf' },
      { titulo: 'INF-UAI-CI-N°001-2025', gestion: 2025, descripcion: 'INFORME DE CONFIABILIDAD DE REGISTROS 2024', url: 'https://apisi.senado.gob.bo/images/9ecb78b9-1434-4fa5-95e2-06ee6e44e504_1745967409.pdf' },
      { titulo: 'INF-UAI-CI-N° 002-2024', gestion: 2024, descripcion: 'EXAMEN DE CONFIABILIDAD 2023', url: 'https://apisi.senado.gob.bo/images/9d347046-25e2-4b64-9733-21ceb896f36c_1728485475.pdf' },
      { titulo: 'INF-UAI-P-N° 001-2023', gestion: 2023, descripcion: 'PRONUNCIAMIENTO DEL EXAMEN DE CONFIABILIDAD 2022', url: 'https://apisi.senado.gob.bo/images/9d34945e-d84e-4f70-ac74-24f92de83766_1728491531.pdf' },
      { titulo: 'INF-UAI-CI-N° 002-2023', gestion: 2023, descripcion: 'EXAMEN DE CONFIABILIDAD 2022', url: 'https://apisi.senado.gob.bo/images/9d34943f-9c24-4624-8f44-60a3f387a140_1728491510.pdf' },
      { titulo: 'INF-UAI-OP-N° 001-2022', gestion: 2022, descripcion: 'OPINIÓN CONFIA 2021', url: 'https://apisi.senado.gob.bo/images/9d3493d8-a76e-4f6d-ba3f-f9cd4bac3bb7_1728491443.pdf' },
      { titulo: 'INF-UAI-CI-N° 001-2022', gestion: 2022, descripcion: 'EXAMEN DE CONFIABILIDAD 2021', url: 'https://apisi.senado.gob.bo/images/9d3493ff-4647-45b8-a001-e94d39d1761e_1728491468.pdf' },
      { titulo: 'INF-UAI-OP-N° 002-2021', gestion: 2021, descripcion: 'OPINIÓN CONFIA 2020-2019 (CONSOLIDADO)', url: 'https://apisi.senado.gob.bo/images/9d3493b2-ca1b-4f69-80ab-5202e6ba2d57_1728491418.pdf' },
      { titulo: 'INF-UAI-OP-N° 001-2021', gestion: 2021, descripcion: 'OPINIÓN CONFIA 2020-2019', url: 'https://apisi.senado.gob.bo/images/9d349374-40e3-4ff5-907a-0696fced4828_1728491377.pdf' },
      { titulo: 'INF-UAI-CI-N° 001-2021', gestion: 2021, descripcion: 'EXAMEN DE CONFIABILIDAD 2020', url: 'https://apisi.senado.gob.bo/images/9d3492ff-2144-46e0-a924-27e0877b3d8e_1728491300.pdf' },
      { titulo: 'INF-UAI-OP-N° 001-2020', gestion: 2020, descripcion: 'OPINIÓN CONFIA 2019-2018', url: 'https://apisi.senado.gob.bo/images/9d3492cd-cfe7-4a89-b006-ad8ee4c8f27f_1728491268.pdf' },
      { titulo: 'INF-UAI-CI-N° 001-2020', gestion: 2020, descripcion: 'INF.CONTROL INTERNO DEL EXAMEN DE CONF, EJECUCIÓN PRESUPUESTARIA DE RECURSOS', url: 'https://apisi.senado.gob.bo/images/9d3492a6-c620-4f27-a213-cf6475d69b40_1728491242.pdf' },
      { titulo: 'INF-UAI-CI-N° 001-2019', gestion: 2019, descripcion: 'EXAMEN DE CONFIABILIDAD-REGISTRO DE EJECUCIÓN PRESUPUESTARIA DE RECURSOS, GAST', url: 'https://apisi.senado.gob.bo/images/9d34927f-9589-4391-9c10-37213309f15b_1728491216.pdf' },
      { titulo: 'INF-UAI-CI-N° 001-2018', gestion: 2018, descripcion: 'INF. EXAMEN DE CONFIABILIDAD 2017', url: 'https://apisi.senado.gob.bo/images/9d34920b-bed4-4006-8554-386d00c5ece0_1728491141.pdf' },
      { titulo: 'INF-UAI-CI-N° 001-2017', gestion: 2017, descripcion: 'INF. CONTROL INTERNO DEL EXAMEN DE CONF. EJECUCIÓN PRESUPUESTARIO DE RECURSOS', url: 'https://apisi.senado.gob.bo/images/9d34918d-07f6-4ecd-b72c-aeff8b9a4057_1728491057.pdf' },
      { titulo: 'INF-UAI-CI-N° 001-2016', gestion: 2016, descripcion: 'INF. CONTROL INTERNO DEL EXAMEN DE CONF. EJECUCIÓN PRESUPUESTARIO DE RECURSOS', url: 'https://apisi.senado.gob.bo/images/9d349131-6c6a-466f-b338-5059c2c03dd3_1728490997.pdf' },
      { titulo: 'UAI-INF-O-01-2016', gestion: 2016, descripcion: 'OPINIÓN CONFIA 2015-2014', url: 'https://apisi.senado.gob.bo/images/9d349161-cb39-4c53-bbba-d64415e4de49_1728491029.pdf' },
      { titulo: 'UAI-N° 02-2015', gestion: 2015, descripcion: 'INF. AUDITOR INTERNO, EXAMEN DE CONFIABILIDAD DE LOS ESTADOS FINANCIEROS 2014', url: 'https://apisi.senado.gob.bo/images/9d3490b1-4bc5-411f-8a8b-830fc81be9cd_1728490913.pdf' },
      { titulo: 'INF-UAI-CI-N° 003-2015', gestion: 2015, descripcion: 'INF. CONTROL INTERNO, REGISTROS DE EJECUCIÓN PRESUPUESTARIA DE RECURSOS, GASTOS', url: 'https://apisi.senado.gob.bo/images/9d3490db-7860-4bc7-b8a2-83ed043f3326_1728490941.pdf' },
      { titulo: 'UAI-N° 003-2014', gestion: 2014, descripcion: 'EXAMEN DE CONFIABILIDAD DE LOS ESTADOS FINANCIEROS 2013', url: 'https://apisi.senado.gob.bo/images/9d349005-e0ad-457f-bc99-9f8563b6f728_1728490801.pdf' }
    ]
  },
  'informes-actividades': {
    anuales: [
      // Agregar aquí los informes anuales si los tienes
    ],
    semestrales: [
      // Agregar aquí los informes semestrales si los tienes
    ]
  },
  'otras-actividades': {
    relevamientos: [
      { titulo: 'INF-UAI-REL-N°001-2025', gestion: 2025, descripcion: 'RELEVAMIENTO DE INFORMACIÓN ESPECIFICA – ADMINISTRACIÓN Y REPOSICIÓN DE ACTIVOS FIJOS', url: 'https://apisi.senado.gob.bo/images/a01d7987-0118-4533-878a-911a49e059fd_1760484533.pdf' },
      { titulo: 'INF-UAI-REL.-N°002-2024', gestion: 2024, descripcion: 'RELEVAMIENTO DE INFORMACION AL SERVICIO DE SEGURIDAD FISICA ESTATAL, GESTION 2023', url: 'https://apisi.senado.gob.bo/images/9dfc2285-f565-4475-8812-e326d653cf05_1737062365.pdf' },
      { titulo: 'INF-UAI-REL.-N° 001-2024', gestion: 2024, descripcion: 'RELEVAMIENTO DE INFORMACIÓN AL SERVICIO DE FOTOCOPIAS, GESTIÓN 2023', url: 'https://apisi.senado.gob.bo/images/9dfb8dec-2166-4196-b2e7-a056ee8306f7_1737037434.pdf' }
    ],
    seguimientos: [
      { titulo: 'INF/UAI/SCI/N°006/2026', gestion: 2026, descripcion: 'SEGUNDO SEGUIMIENTO AL INFORME DE CONFIABILIDAD DE ESTADOS FINANCIEROS Y DEFICIENCIAS DE CONTROL INTERNO DE LA CÁMARA DE SENADORES, GESTIÓN 2023', url: 'https://apisi.senado.gob.bo/images/a253fd6e-f2f0-43be-89b7-63bafe2a5a23_1784816178.pdf' },
      { titulo: 'INF/UAI/SCI/N°005/2026', gestion: 2026, descripcion: 'PRIMER SEGUIMIENTO AL INFORME DE CONFIABILIDAD DE LOS ESTADOS FINANCIEROS Y LAS DEFICIENCIAS DE CONTROL INTERNO DE LA CÁMARA DE SENADORES, GESTIÓN 2024', url: 'https://apisi.senado.gob.bo/images/a253fb9f-c3aa-4a30-8576-9d289add9a0f_1784815875.pdf' },
      { titulo: 'INF/UAI/SCI/N°004/2026', gestion: 2026, descripcion: 'SEGUNDO SEGUIMIENTO AL INFORME DE CONTROL INTERNO DE LA AUDITORIA OPERACIONAL SOBRE LA EFICACIA DE LAS ACTIVIDADES PROGRAMADAS QUE EJECUTO LA UNIDAD DE EVALUACIÓN, DESARROLLO Y CAPACITACIÓN DEL PERSONAL DE LA CÁMARA DE SENADORES, GESTIÓN 2022', url: 'https://apisi.senado.gob.bo/images/a253fa4c-9669-4019-82f7-0c8682780024_1784815653.pdf' },
      { titulo: 'INF/UAI/SCI/N°003/2026', gestion: 2026, descripcion: 'SEGUNDO SEGUIMIENTO AL INFORME DE CONTROL INTERNO RESULTADO DE LA AUDITORIA DE CUMPLIMIENTO A LOS GASTOS EJECUTADOS CON FONDOS EN AVANCE Y FONDO ROTATIVO DE LA CAMARA DE SENADORES, GESTION 2022', url: 'https://apisi.senado.gob.bo/images/a253f910-b994-4de7-813c-31a34cf54dfe_1784815446.pdf' },
      { titulo: 'INF/UAI/SCI/N°002/2026', gestion: 2026, descripcion: 'SEGUNDO SEGUIMIENTO AL INFORME DE CONFIABILIDAD DE REGISTROS Y DEFICIENCIAS DE CONTROL INTERNO DE LA CAMARA DE SENADORES, GESTION 2023', url: 'https://apisi.senado.gob.bo/images/a253f754-b5ff-457c-8683-ec588ca99c1e_1784815155.pdf' },
      { titulo: 'INF/UAI/SCI/N°001/2026', gestion: 2026, descripcion: 'PRIMER SEGUIMIENTO AL INFORME DE CONFIABILIDAD DE REGISTROS Y DEFICIENCIAS DE CONTROL INTERNO DE LA CAMARA DE SENADORES, GESTION 2024', url: 'https://apisi.senado.gob.bo/images/a253f630-5f57-493d-b332-39ed086f6383_1784814963.pdf' },
      { titulo: 'POA 2026 (REFORMULADO)', gestion: 2026, descripcion: 'PLAN OPERATIVO ANUAL (POA 2026 - REFORMULADO)', url: 'https://apisi.senado.gob.bo/images/a2540509-cabb-492b-b139-2aab331738a8_1784817454.pdf' },
      { titulo: 'INF-UAI-SCI-N°007-2025', gestion: 2025, descripcion: 'SEGUNDO SEGUIMIENTO AL INFORME DE CONFIABILIDAD DE LOS ESTADOS FINANCIEROS Y LAS DEFICIENCIAS DE CONTROL INTERNO DE LA CÁMARA DE SENADORES, GESTIÓN 2022', url: 'https://apisi.senado.gob.bo/images/a03b868a-b47b-45b3-9513-1d8aeec2971d_1761775207.pdf' },
      { titulo: 'INF-UAI-SCI-N°006-2025', gestion: 2025, descripcion: 'SEGUNDO SEGUIMIENTO AL INFORME DE REVISIÓN ANUAL AL CUMPLIMIENTO DEL PROCEDIMIENTO PARA EL CONTROL OPORTUNO DE LAS DECLARACIONES JURADAS DE BIENES Y RENTAS DE LA CÁMARA DE SENADORES, GESTIÓN 2022', url: 'https://apisi.senado.gob.bo/images/a02b7552-fafc-4be9-a7bc-e5a2bb9d3a2c_1761085124.pdf' },
      { titulo: 'INF-UAI-SCI-N°005-2025', gestion: 2025, descripcion: 'PRIMER SEGUIMIENTO AL INFORME DE CONTROL INTERNO DE LA AUDITORÍA OPERACIONAL SOBRE LA EFICACIA DE LAS ACTIVIDADES PROGRAMADAS QUE EJECUTO LA UNIDAD DE EVALUACIÓN, DESARROLLO Y CAPACITACIÓN DEL PERSONAL DE LA CÁMARA DE SENADORES, GESTIÓN 2022', url: 'https://apisi.senado.gob.bo/images/9fe4e65a-401f-4358-9d8c-616e0e75a1cd_1758054660.pdf' },
      { titulo: 'UAI-NRO225/2025', gestion: 2025, descripcion: '1er Seguimiento al Informe de Confiabilidad de los Estados Financieros y las Deficiencias de Control Interno de la CS, 2023', url: 'https://apisi.senado.gob.bo/images/9f59bff2-014c-421c-b7c5-3b0d79e551a3_1752078212.pdf' },
      { titulo: 'POA 2026', gestion: 2025, descripcion: 'PLAN OPERATIVO ANUAL - GESTION 2026', url: 'https://apisi.senado.gob.bo/images/a0dff120-d778-4550-9276-31221fbec2df_1768836836.pdf' },
      { titulo: 'INF-UAI-SCI-N°004-2024', gestion: 2024, descripcion: 'PRIMER SEGUIMIENTO A DECLARACIONES JURADAS DE BIENES Y RENTAS , GESTION 2022', url: 'https://apisi.senado.gob.bo/images/9ecb6d3a-458c-464a-8c53-059b0eff8b52_1745965480.pdf' },
      { titulo: 'UAI-NRO224/2025', gestion: 2023, descripcion: '1er Seguimiento al Informe de Confiabilidad de los Registros y Deficiencia de control interno Camara Senadores 2023', url: 'https://apisi.senado.gob.bo/images/9f59be72-6329-4d56-ad08-e995f3440b99_1752077960.pdf' },
      { titulo: 'UAI-NRO226/2025', gestion: 2022, descripcion: '2do Seguimiento al Informe de Confiabilidad de los Registros y Deficiencia de control interno Camara Senadores 2022', url: 'https://apisi.senado.gob.bo/images/9f59c29c-486a-4642-8f05-69ab3f784345_1752078659.pdf' },
      { titulo: 'UAI-NRO226/2025', gestion: 2022, descripcion: '1er Seguimiento al Informe de Control interno cumplimiento de gastos ejecutados con fondos en avance y fondo rotativo de la Camara Senadores 2022', url: 'https://apisi.senado.gob.bo/images/9f59c666-e38d-4337-be56-123c584ce031_1752079295.pdf' },
      { titulo: 'UAI-N° 008-2014', gestion: 2014, descripcion: 'PRIMER SEGUIMIENTO A LA IMPLANTACIÓN, INF. UAI-N° 002-2012 2011 Y 30 DE JUNIO DE', url: 'https://apisi.senado.gob.bo/images/9d5c90ed-034a-4350-8d53-5c5e2c75c3b1_1730208940.pdf' }
    ]
  }
};

// ============================================
// SCRIPT PRINCIPAL
// ============================================
async function seedAuditoria() {
  console.log('\n' + '═'.repeat(80));
  console.log('📋 SEED DE AUDITORÍA');
  console.log('   Cargando categorías y documentos con URLs originales');
  console.log('═'.repeat(80) + '\n');

  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado a MongoDB\n');

    // Buscar admin
    let adminUser = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!adminUser) adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) adminUser = await User.findOne({});

    if (!adminUser) {
      console.error('❌ No se encontró usuario. Ejecuta: node src/check-admin.js');
      process.exit(1);
    }

    console.log(`👤 Usuario asignado: ${adminUser.email}\n`);

    const force = process.argv.includes('--force');

    // Limpiar si se pide force
    const existingCats = await AuditoriaCategoria.countDocuments();
    const existingDocs = await AuditoriaDocumento.countDocuments();

    if (existingCats > 0 || existingDocs > 0) {
      if (!force) {
        console.log(`⚠️ Ya existen ${existingCats} categorías y ${existingDocs} documentos.`);
        console.log('   Usa --force para sobrescribir.');
        await mongoose.disconnect();
        process.exit(0);
      }
      console.log('🗑️ Limpiando colecciones...');
      await AuditoriaCategoria.deleteMany({});
      await AuditoriaDocumento.deleteMany({});
      console.log('✅ Limpiado\n');
    }

    // ============================================
    // Insertar categorías
    // ============================================
    console.log('📝 Insertando categorías...\n');

    let totalCategorias = 0;
    for (const [modulo, categorias] of Object.entries(CATEGORIAS_DATA)) {
      for (const cat of categorias) {
        await AuditoriaCategoria.create({
          modulo,
          ...cat,
          creadoPor: adminUser._id,
          actualizadoPor: adminUser._id
        });
        totalCategorias++;
        console.log(`   ✅ [${modulo}] ${cat.key} → ${cat.nombre}`);
      }
    }

    console.log(`\n✅ ${totalCategorias} categorías insertadas\n`);

    // ============================================
    // Insertar documentos
    // ============================================
    console.log('📝 Insertando documentos...\n');

    let totalDocs = 0;
    for (const [modulo, categorias] of Object.entries(DOCUMENTOS_DATA)) {
      for (const [categoria, documentos] of Object.entries(categorias)) {
        for (let i = 0; i < documentos.length; i++) {
          const doc = documentos[i];
          await AuditoriaDocumento.create({
            modulo,
            categoria,
            titulo: doc.titulo,
            descripcion: doc.descripcion,
            gestion: doc.gestion,
            url: doc.url,
            urlOriginal: doc.url, // Guardar URL original
            estado: 'Publicado',
            activo: true,
            orden: i,
            migrado: false, // Pendiente de migrar
            creadoPor: adminUser._id,
            actualizadoPor: adminUser._id
          });
          totalDocs++;
        }
        console.log(`   ✅ [${modulo}/${categoria}] ${documentos.length} documentos`);
      }
    }

    console.log(`\n✅ ${totalDocs} documentos insertados\n`);

    // ============================================
    // Resumen
    // ============================================
    console.log('═'.repeat(80));
    console.log('📊 RESUMEN');
    console.log('═'.repeat(80));

    for (const modulo of Object.keys(CATEGORIAS_DATA)) {
      const catsCount = await AuditoriaCategoria.countDocuments({ modulo });
      const docsCount = await AuditoriaDocumento.countDocuments({ modulo });
      console.log(`   ${modulo}: ${catsCount} categorías, ${docsCount} documentos`);
    }

    console.log('\n💡 SIGUIENTE PASO:');
    console.log('   Los documentos tienen las URLs originales de apisi.senado.gob.bo');
    console.log('   Para migrar los PDFs al backend, ejecuta:');
    console.log('   POST /api/auditoria/migrar-pdfs (desde el CMS o Postman con token admin)');
    console.log('   O ejecuta el script: node src/scripts/migrateAuditoriaPDFs.js\n');

    await mongoose.disconnect();
    console.log('═'.repeat(80));
    console.log('🎉 SEED COMPLETADO');
    console.log('═'.repeat(80) + '\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seedAuditoria();