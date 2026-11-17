// src/scripts/importarMarcoNormativoAcordeon.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const DocumentoLegislativo = require('../models/DocumentoLegislativo');
const User = require('../models/User');

const PDFS_RAW_DIR = "/var/www/sen/uploads/documents/publicado en la web/MARCO NORMATIVO"; 
const PDFS_FINAL_DIR = path.join(__dirname, '..', '..', 'uploads', 'documents');
const BACKEND_URL = 'https://demoback.senado.gob.bo';

// ============================================
// DATA EXACTA DEL ACORDEÓN (16 DOCUMENTOS)
// ============================================
const DATA = [
  { orden: 1, numero: 2001, codigo: 'MANUAL DE ORGANIZACIÓN Y FUNCIONES', asunto: 'Manual de Organización y Funciones', fecha: '2020-01-01', archivo: 'Manual de Organización y Funciones.pdf' },
  { orden: 2, numero: 2002, codigo: 'REGLAMENTO INTERNO DE PERSONAL', asunto: 'Reglamento Interno de Personal', fecha: '2020-01-01', archivo: 'Reglamento Interno de Personal.pdf' },
  { orden: 3, numero: 2003, codigo: 'CÓDIGO DE ÉTICA', asunto: 'Código de Ética', fecha: '2020-01-01', archivo: 'Código de Ética.pdf' },
  { orden: 4, numero: 2004, codigo: 'REGLAMENTO SISTEMA CONTABILIDAD INTEGRADA', asunto: 'Reglamento Específico del Sistema Contabilidad Integrada', fecha: '2020-01-01', archivo: 'Reglamento Específico del Sistema Contabilidad Integrada.pdf' },
  { orden: 5, numero: 2005, codigo: 'REGLAMENTO SISTEMA ADMINISTRACIÓN DE PERSONAL', asunto: 'Reglamento Específico del Sistema de Administración de Personal', fecha: '2020-01-01', archivo: 'Reglamento Específico del Sistema de Administración de Personal.pdf' },
  { orden: 6, numero: 2006, codigo: 'REGLAMENTO SISTEMA ORGANIZACIÓN ADMINISTRATIVA', asunto: 'Reglamento Específico del Sistema de Organización Administrativa', fecha: '2020-01-01', archivo: 'Reglamento Específico del Sistema de Organización Administrativa.pdf' },
  { orden: 7, numero: 2007, codigo: 'REGLAMENTO SISTEMA PROGRAMACIÓN DE OPERACIONES', asunto: 'Reglamento Específico del Sistema de Programación de Operaciones', fecha: '2020-01-01', archivo: 'Reglamento Específico del Sistema de Programación de Operaciones.pdf' },
  { orden: 8, numero: 2008, codigo: 'REGLAMENTO SISTEMA DE TESORERÍA', asunto: 'Reglamento Específico Sistema de Tesorería', fecha: '2020-01-01', archivo: 'Reglamento Específico Sistema de Tesorería.pdf' },
  { orden: 9, numero: 2009, codigo: 'MANUAL PROCESOS SISTEMA DE PRESUPUESTOS', asunto: 'Manual de Procesos y Procedimientos del Sistema de Presupuestos', fecha: '2020-01-01', archivo: 'Manual de Procesos y Procedimientos del Sistema de Presupuestos.pdf' },
  { orden: 10, numero: 2010, codigo: 'REGLAMENTO DECLARACIÓN JURADA DE BIENES', asunto: 'Reglamento para el cumplimiento de Declaración Jurada de Bienes y Servicios', fecha: '2020-01-01', archivo: 'Reglamento para el cumplimiento de Declaración Jurada de Bienes y Servicios.pdf' },
  { orden: 11, numero: 2011, codigo: 'REGLAMENTO SISTEMA ADMINISTRACIÓN DE BIENES Y SERVICIOS', asunto: 'Reglamento Específico del Sistema de Administración de Bienes y Servicios', fecha: '2020-01-01', archivo: 'Reglamento Específico del Sistema de Administración de Bienes y Servicios.pdf' },
  { orden: 12, numero: 2012, codigo: 'REGLAMENTO SISTEMA DE PRESUPUESTOS', asunto: 'Reglamento Específico del Sistema de Presupuestos', fecha: '2020-01-01', archivo: 'Reglamento Específico del Sistema de Presupuestos.pdf' },
  { orden: 13, numero: 2013, codigo: 'REGLAMENTO PROCESOS SUMARIOS', asunto: 'Reglamento Procesos Sumarios', fecha: '2026-01-01', archivo: 'REGLAMENTO PROCESOS SUMARIOS.pdf' },
  { orden: 14, numero: 2014, codigo: 'REGLAMENTO INTERNO UTLCC', asunto: 'Reglamento Interno Unidad de Transparencia y Lucha Contra la Corrupción', fecha: '2025-01-01', archivo: 'Reglamento Interno UTLCC.pdf' },
  { orden: 15, numero: 2015, codigo: 'MANUAL ADMINISTRACIÓN DE ACTIVOS FIJOS', asunto: 'Manual de Administración de Activos Fijos', fecha: '2020-01-01', archivo: 'Manual de Administración de Activos Fijos.pdf' },
  { orden: 16, numero: 2016, codigo: 'MANUAL ADMINISTRACIÓN DE ALMACENES', asunto: 'Manual de Administración de Almacenes', fecha: '2020-01-01', archivo: 'Manual de Administración de Almacenes.pdf' }
];

function copiarArchivo(origenDir, nombre, prefijo) {
  try {
    const origen = path.join(origenDir, nombre);
    if (!fs.existsSync(origen)) {
      console.log(`   ⚠️ No se encontró: ${nombre}`);
      return null;
    }
    const ext = path.extname(nombre);
    const base = path.basename(nombre, ext).toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
    const nuevoNombre = `${prefijo}-${base}-${Date.now()}${ext}`;
    const destino = path.join(PDFS_FINAL_DIR, nuevoNombre);
    fs.copyFileSync(origen, destino);
    return { nombre: nuevoNombre, size: fs.statSync(destino).size };
  } catch (e) {
    console.error(`   ❌ Error copiando ${nombre}:`, e.message);
    return null;
  }
}

async function run() {
  console.log('\n' + '═'.repeat(60));
  console.log('📚 IMPORTANDO 16 DOCUMENTOS DEL ACORDEÓN');
  console.log('═'.repeat(60) + '\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    const admin = await User.findOne({ role: 'SUPER_ADMIN' }) || await User.findOne({ role: 'ADMIN' });
    if (!admin) { console.error('❌ No hay usuario admin.'); process.exit(1); }

    for (const d of DATA) {
      const existe = await DocumentoLegislativo.findOne({ codigo: d.codigo });
      if (existe) {
        console.log(`   ⏭️ Saltando: ${d.codigo} (ya existe)`);
        continue;
      }

      const pdf = copiarArchivo(PDFS_RAW_DIR, d.archivo, 'doc');

      await DocumentoLegislativo.create({
        tipo: 'proyecto-ley-aprobados', // Mismo tipo para que entren al acordeón
        numero: d.numero,
        codigo: d.codigo,
        asunto: d.asunto,
        fechaIngreso: new Date(d.fecha),
        fechaAprobacion: new Date(d.fecha),
        fechaRemisionDiputados: new Date(d.fecha),
        estadoLey: 'APROBADO',
        peticionario: ['Cámara de Senadores'],
        orden: d.orden,
        imagen: null, // No llevan imagen porque van al acordeón
        archivo: pdf ? { url: `${BACKEND_URL}/uploads/documents/${pdf.nombre}`, filename: pdf.nombre, originalName: d.archivo, size: pdf.size } : null,
        creadoPor: admin._id,
        actualizadoPor: admin._id
      });

      console.log(`   ✅ Insertado: ${d.codigo} [Orden ${d.orden}]`);
    }

    console.log('\n✅ COMPLETADO\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

run();