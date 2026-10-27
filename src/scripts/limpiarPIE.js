// src/scripts/limpiarManchas.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const DocumentoLegislativo = require('../models/DocumentoLegislativo');

function limpiarTexto(texto) {
  if (!texto) return '';
  return texto
    .replace(/[\u0080-\u00FF]/g, (char) => {
      if (char === '\x95' || char === '\x95') return '-';
      if (['\xE1', '\xE9', '\xED', '\xF3', '\xFA', '\xF1', '\xC1', '\xC9', '\xCD', '\xD3', '\xDA', '\xD1'].includes(char)) {
        return char;
      }
      return '-';
    })
    .replace(/\s+/g, ' ')
    .trim();
}

async function limpiar() {
  console.log('\n' + '═'.repeat(60));
  console.log('🧹 LIMPIANDO MANCHAS EN LOS TEXTOS (SIN BORRAR NADA)');
  console.log('═'.repeat(60) + '\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado a MongoDB\n');

    const docs = await DocumentoLegislativo.find({ tipo: 'peticion-informe-escrito' });
    console.log(`📊 Se encontraron ${docs.length} registros para revisar.\n`);

    let actualizados = 0;

    for (const doc of docs) {
      let modificado = false;

      // Limpiamos el Asunto
      if (doc.asunto) {
        const asuntoLimpio = limpiarTexto(doc.asunto);
        if (asuntoLimpio !== doc.asunto) {
          doc.asunto = asuntoLimpio;
          modificado = true;
        }
      }

      // Limpiamos el Destinatario
      if (doc.destinatario) {
        const destLimpio = limpiarTexto(doc.destinatario);
        if (destLimpio !== doc.destinatario) {
          doc.destinatario = destLimpio;
          modificado = true;
        }
      }

      // Limpiamos la Observación
      if (doc.observacion) {
        const obsLimpia = limpiarTexto(doc.observacion);
        if (obsLimpia !== doc.observacion) {
          doc.observacion = obsLimpia;
          modificado = true;
        }
      }

      // Si hubo cambios, guardamos el mismo registro (No se borra, solo se actualiza)
      if (modificado) {
        await doc.save();
        actualizados++;
      }
    }

    console.log(`✅ Se limpiaron las manchas de ${actualizados} registros.`);
    console.log('   Los registros y los PDFs siguen intactos.\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

limpiar();