// src/scripts/limpiarPLT.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const DocumentoLegislativo = require('../models/DocumentoLegislativo');

async function limpiar() {
  console.log('\n🧹 DESACTIVANDO PROYECTOS EN TRATAMIENTO (P.L.T.) - PDFs SEGUROS\n');
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    
    const result = await DocumentoLegislativo.updateMany(
      { tipo: 'proyecto-ley-tratamiento-senado' },
      { $set: { activo: false, eliminado: true } }
    );
    
    console.log(`✅ Se desactivaron ${result.modifiedCount} registros. Los PDFs están a salvo.\n`);
    await mongoose.disconnect(); process.exit(0);
  } catch (error) { console.error('❌ Error:', error.message); process.exit(1); }
}
limpiar();