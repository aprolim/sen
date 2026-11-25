// src/scripts/normalizarSenadores.js
//
// Normaliza los documentos de la colección `senadors` y deja la base lista
// para editarse desde el CMS (Pleno Camaral).
//
// QUÉ HACE
//   1. Añade los campos que falten (redes sociales, datos personales, etc.)
//      con su valor por defecto, para que el CMS los encuentre siempre.
//   2. Normaliza las URLs de redes sociales:
//        - "@usuario"           → https://instagram.com/usuario
//        - "usuario"            → https://instagram.com/usuario
//        - "https://x.com/..."  → se respeta
//        - cadenas vacías       → null
//   3. Limpia espacios sobrantes en campos de texto.
//   4. Reporta qué senadores NO tienen ninguna red social (para rellenarlas
//      desde el CMS, porque esos datos no existen en el proyecto).
//
// QUÉ NO HACE
//   - NO borra documentos.
//   - NO sobrescribe datos existentes (solo rellena huecos).
//   - NO inventa URLs: si no hay dato, deja null.
//
// USO
//   node src/scripts/normalizarSenadores.js            → modo SIMULACIÓN
//   node src/scripts/normalizarSenadores.js --aplicar  → escribe en la base

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Senador = require('../models/Senador');

const APLICAR = process.argv.includes('--aplicar');

// ============================================
// REDES SOCIALES
// Cada red define el dominio con el que se construye la URL
// cuando el valor recibido es solo un usuario.
// ============================================
const REDES = [
  { campo: 'facebook',  sufijo: 'Suplente', dominio: 'https://facebook.com/' },
  { campo: 'twitter',   sufijo: 'Suplente', dominio: 'https://x.com/' },
  { campo: 'instagram', sufijo: 'Suplente', dominio: 'https://instagram.com/' },
  { campo: 'youtube',   sufijo: 'Suplente', dominio: 'https://youtube.com/@' },
  { campo: 'tiktok',    sufijo: 'Suplente', dominio: 'https://tiktok.com/@' }
];

// ============================================
// HELPERS
// ============================================

/**
 * Normaliza el valor de una red social.
 * Devuelve null si no hay nada, o una URL completa.
 */
const normalizarRed = (valor, dominio) => {
  if (valor === null || valor === undefined) return null;

  // Quitar espacios y caracteres invisibles típicos de copiar/pegar
  let v = String(valor)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();

  if (!v) return null;

  // Ya es una URL completa
  if (/^https?:\/\//i.test(v)) {
    // Normalizar el dominio clásico de Twitter
    if (dominio.includes('x.com')) {
      v = v.replace(/^https?:\/\/(www\.)?twitter\.com/i, 'https://x.com');
    }
    return v.replace(/\/+$/, '');
  }

  // Empieza por // → añadir https:
  if (v.startsWith('//')) return `https:${v}`;

  // Quitar la @ inicial para las redes que la usan en la URL
  v = v.replace(/^@+/, '').replace(/\/+$/, '');

  if (!v) return null;

  // Si trae "www.algo.com" sin protocolo
  if (/^www\./i.test(v)) return `https://${v}`;

  // Es solo el usuario
  return `${dominio}${v}`;
};

/** Limpia un string: recorta y convierte vacío en null. */
const limpiarTexto = (valor) => {
  if (valor === null || valor === undefined) return null;
  const v = String(valor).replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  return v === '' ? null : v;
};

/** true si el senador no tiene ninguna red social cargada. */
const sinRedes = (s) => {
  return REDES.every(({ campo }) => !normalizarRed(s[campo], ''));
};

/** true si el titular no tiene ninguna red social del suplente. */
const suplenteSinRedes = (s) => {
  return REDES.every(({ campo, sufijo }) =>
    !normalizarRed(s[`${campo}${sufijo}`], '')
  );
};

// ============================================
// MAIN
// ============================================
async function run() {
  console.log('\n' + '═'.repeat(70));
  console.log('🧹 NORMALIZACIÓN DE SENADORES');
  console.log('═'.repeat(70));
  console.log(`   Modo: ${APLICAR ? 'APLICAR (escribe en la base)' : 'SIMULACIÓN (no escribe)'}`);
  console.log('═'.repeat(70) + '\n');

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('❌ MONGODB_URI no definida en .env');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log(`🔌 Conectado a: ${mongoose.connection.name}`);

    const senadores = await Senador.find({ tipo: { $ne: 'suplente' } })
      .sort({ seatNumber: 1 })
      .lean();

    if (senadores.length === 0) {
      console.log('\n⚠️  No hay senadores en la base. Nada que hacer.\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`📊 ${senadores.length} titulares encontrados\n`);

    let actualizados = 0;
    const faltanRedes = [];
    const faltanRedesSuplente = [];
    const ejemplos = [];

    // Campos que deben existir en TODOS los documentos
    const CAMPOS_TEXTO = [
      'cargo', 'comision', 'comite', 'fechaNacimiento', 'nacidoEn', 'ocupacion',
      'comiteSuplente', 'cargoSuplente', 'fechaNacimientoSuplente',
      'nacidoEnSuplente', 'ocupacionSuplente'
    ];

    for (const s of senadores) {
      const cambios = {};

      // --- Redes del titular ---
      for (const { campo, dominio } of REDES) {
        const actual = s[campo];
        const limpio = normalizarRed(actual, dominio);

        // Reglas:
        //  - Si no existía el campo        → se crea (null o URL normalizada)
        //  - Si existía vacío/espacios     → se limpia a null
        //  - Si existía con valor          → se normaliza la URL
        //  - Nunca se borra un dato real
        const existiaVacio =
          actual === undefined ||
          actual === null ||
          String(actual).trim() === '';

        if (existiaVacio) {
          if (actual !== null) cambios[campo] = null; // normalizar "" → null
        } else if (actual !== limpio) {
          cambios[campo] = limpio;
        }
      }

      // --- Redes del suplente ---
      for (const { campo, sufijo, dominio } of REDES) {
        const clave = `${campo}${sufijo}`;
        const actual = s[clave];
        const limpio = normalizarRed(actual, dominio);

        const existiaVacio =
          actual === undefined ||
          actual === null ||
          String(actual).trim() === '';

        if (existiaVacio) {
          if (actual !== null) cambios[clave] = null;
        } else if (actual !== limpio) {
          cambios[clave] = limpio;
        }
      }

      // --- Campos de texto: rellenar los que falten con null y
      //     convertir cadenas de solo espacios en null ---
      for (const campo of CAMPOS_TEXTO) {
        const actual = s[campo];
        const vacio =
          actual === undefined ||
          actual === null ||
          String(actual).trim() === '';

        if (vacio) {
          if (actual !== null) cambios[campo] = null;
        } else if (String(actual) !== String(actual).trim()) {
          // Conserva el dato, solo quita espacios sobrantes
          cambios[campo] = String(actual).trim();
        }
      }

      // --- Slug del suplente: regenerarlo si falta pero hay nombre ---
      const nombreSup = limpiarTexto(s.suplente);
      if (nombreSup && !limpiarTexto(s.slugSuplente)) {
        cambios.slugSuplente = nombreSup
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/ñ/g, 'n')
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');
      }

      if (sinRedes(s)) faltanRedes.push(s);
      if (s.suplente && suplenteSinRedes(s)) faltanRedesSuplente.push(s);

      if (Object.keys(cambios).length > 0) {
        actualizados++;
        if (ejemplos.length < 5) {
          ejemplos.push({
            nombre: s.name,
            campos: Object.keys(cambios),
            redesNormalizadas: Object.entries(cambios).filter(([k, v]) => v && REDES.some(r => k.startsWith(r.campo)))
          });
        }

        if (APLICAR) {
          await Senador.updateOne({ _id: s._id }, { $set: cambios });
        }
      }
    }

    // ============================================
    // REPORTE
    // ============================================
    console.log('─'.repeat(70));
    console.log(`✅ Documentos ${APLICAR ? 'actualizados' : 'a actualizar'}: ${actualizados} de ${senadores.length}`);
    console.log('─'.repeat(70));

    if (ejemplos.length > 0) {
      console.log('\n📋 Ejemplos de cambios:');
      for (const e of ejemplos) {
        console.log(`   • ${e.nombre}`);
        console.log(`     campos: ${e.campos.length > 0 ? e.campos.join(', ') : '(ninguno)'}`);
        if (e.redesNormalizadas.length > 0) {
          for (const [k, v] of e.redesNormalizadas) {
            console.log(`     ${k}: ${v}`);
          }
        }
      }
    }

    // Pendientes: sin datos que inventar
    console.log('\n' + '─'.repeat(70));
    console.log('📝 SENADORES SIN REDES SOCIALES (hay que cargarlas desde el CMS)');
    console.log('─'.repeat(70));
    if (faltanRedes.length === 0) {
      console.log('   ✅ Todos tienen al menos una red cargada');
    } else {
      console.log(`   ${faltanRedes.length} de ${senadores.length} titulares sin ninguna red:`);
      faltanRedes.forEach((s) => {
        console.log(`   • #${String(s.seatNumber).padStart(2)} ${s.name} (${s.partyShort})`);
      });
    }

    if (faltanRedesSuplente.length > 0) {
      console.log('\n' + '─'.repeat(70));
      console.log('📝 SUPLENTES SIN REDES SOCIALES');
      console.log('─'.repeat(70));
      console.log(`   ${faltanRedesSuplente.length} suplentes sin ninguna red:`);
      faltanRedesSuplente.forEach((s) => {
        console.log(`   • ${s.suplente}`);
      });
    }

    console.log('\n' + '═'.repeat(70));
    if (!APLICAR) {
      console.log('ℹ️  MODO SIMULACIÓN: no se escribió nada.');
      console.log('   Ejecuta con --aplicar para guardar los cambios:');
      console.log('   node src/scripts/normalizarSenadores.js --aplicar');
    } else {
      console.log('🎉 Normalización aplicada correctamente.');
      console.log('   Las redes sociales pueden completarse desde el CMS → Pleno Camaral');
      console.log('   → ✏️ Editar datos.');
    }
    console.log('═'.repeat(70) + '\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

run();
