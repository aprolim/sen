// src/scripts/importarRedesSociales.js
//
// Rellena las redes sociales de los senadores en MongoDB a partir del
// antiguo archivo estático del frontend publico:
//
//   ../frontend-publico-oficial2/data/senadores.js
//
// Ese archivo tenía 46 enlaces sociales que NUNCA se cargaron en la base,
// por eso al migrar los perfiles al API dejaron de verse.
//
// QUÉ HACE
//   - Lee el JSON estático de senadores.
//   - Para cada TITULAR, copia facebook/twitter/instagram/youtube/tiktok
//     SOLO si en la base están vacíos (no sobrescribe lo editado en el CMS).
//   - Para cada SUPLENTE, hace lo mismo con los campos *Suplente.
//   - También rellena datos personales si faltan (fechaNacimiento, nacidoEn,
//     ocupacion, comision, comite, cargo).
//
// QUÉ NO HACE
//   - No borra documentos.
//   - No sobrescribe valores que ya existan en la base.
//   - No toca fotos.
//
// USO
//   node src/scripts/importarRedesSociales.js               → SIMULACIÓN
//   node src/scripts/importarRedesSociales.js --aplicar     → escribe
//   node src/scripts/importarRedesSociales.js --sobrescribir → reemplaza todo
//
// El JSON se busca por defecto en ../frontend-publico-oficial2/data/senadores.js
// y se puede cambiar con la variable de entorno SENADORES_JSON.

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Senador = require('../models/Senador');

const APLICAR = process.argv.includes('--aplicar');
const SOBRESCRIBIR = process.argv.includes('--sobrescribir');

// ============================================
// RUTA DEL JSON ESTÁTICO
//
// Se busca en este orden:
//   1. La ruta indicada en SENADORES_JSON (si existe)
//   2. src/scripts/data/senadores.js  ← copiado aquí para que viaje por git
//   3. El proyecto del frontend público (entorno de desarrollo)
// ============================================
const RUTAS_CANDIDATAS = [
  process.env.SENADORES_JSON,
  path.join(__dirname, 'data', 'senadores.js'),
  path.join(__dirname, '..', '..', '..', 'frontend-publico-oficial2', 'data', 'senadores.js'),
  '/var/www/frontend-publico-oficial2/data/senadores.js'
].filter(Boolean);

const encontrarJson = () => {
  for (const ruta of RUTAS_CANDIDATAS) {
    if (ruta && fs.existsSync(ruta)) return ruta;
  }
  return null;
};

// ============================================
// PARSEO DEL JSON ESTÁTICO
//
// El archivo es un módulo ES con `export const senadores = [...]` y usa
// sintaxis JavaScript (claves sin comillas, comillas simples, generarSlug()).
// Por eso se evalúa con `new Function` en lugar de JSON.parse.
//
// Es seguro: solo se ejecuta contenido local del repositorio, y `generarSlug`
// se define aquí mismo.
// ============================================
const leerSenadoresEstaticos = (ruta) => {
  const contenido = fs.readFileSync(ruta, 'utf8');

  const inicio = contenido.indexOf('export const senadores = [');
  if (inicio === -1) {
    throw new Error('No se encontró "export const senadores = [" en el archivo');
  }

  // Desde el '[' inicial hasta el ']' que cierra el array
  const desdeCorchete = contenido.indexOf('[', inicio);
  let nivel = 0;
  let fin = -1;
  let enString = false;
  let comilla = '';

  for (let i = desdeCorchete; i < contenido.length; i++) {
    const c = contenido[i];

    if (enString) {
      if (c === '\\') { i++; continue; }
      if (c === comilla) enString = false;
      continue;
    }

    if (c === '"' || c === "'" || c === '`') { enString = true; comilla = c; continue; }
    if (c === '[') nivel++;
    if (c === ']') {
      nivel--;
      if (nivel === 0) { fin = i; break; }
    }
  }

  if (fin === -1) throw new Error('No se pudo cerrar el array de senadores');

  const textoArray = contenido.slice(desdeCorchete, fin + 1);

  // Evaluar como JavaScript con la función generarSlug disponible
  const generarSlugFn = `
    const generarSlug = (nombre) => {
      if (!nombre) return '';
      return nombre
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .toLowerCase()
        .replace(/ñ/g, 'n')
        .replace(/[^a-z0-9\\s-]/g, '')
        .trim()
        .replace(/\\s+/g, '-');
    };
  `;

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(`${generarSlugFn} return (${textoArray});`);
    const data = fn();

    if (!Array.isArray(data)) {
      throw new Error('El resultado no es un array');
    }
    return data;
  } catch (e) {
    throw new Error('No se pudo interpretar senadores.js: ' + e.message);
  }
};

// ============================================
// HELPERS
// ============================================
const REDES = ['facebook', 'twitter', 'instagram', 'youtube', 'tiktok'];

const estaVacio = (v) =>
  v === undefined || v === null || String(v).trim() === '';

const limpiar = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

/** Genera el slug con la misma regla que el resto del sistema. */
const generarSlug = (nombre) => {
  if (!nombre) return '';
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
};

/** Normaliza una URL social: añade https:// si falta. */
const normalizarUrl = (url) => {
  if (estaVacio(url)) return null;
  let v = String(url).trim();
  if (!/^https?:\/\//i.test(v)) v = `https://${v.replace(/^\/+/, '')}`;
  return v;
};

/**
 * Normaliza un nombre para comparar: sin tildes, minúsculas,
 * ñ → n, sin signos y con espacios simples.
 *   "María Isabel"  → "maria isabel"
 *   "MARIA  ISABEL" → "maria isabel"
 */
const normalizarNombre = (nombre) =>
  String(nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// ============================================
// MAIN
// ============================================
async function run() {
  console.log('\n' + '═'.repeat(72));
  console.log('🔗 IMPORTACIÓN DE REDES SOCIALES Y DATOS DE PERFIL');
  console.log('═'.repeat(72));
  console.log(`   Modo: ${APLICAR ? (SOBRESCRIBIR ? 'APLICAR + SOBRESCRIBIR' : 'APLICAR (solo rellena vacíos)') : 'SIMULACIÓN (no escribe)'}`);

  const jsonPath = encontrarJson();
  if (!jsonPath) {
    console.error('\n❌ No se encontró data/senadores.js');
    console.error('   Rutas probadas:');
    RUTAS_CANDIDATAS.forEach((r) => console.error('     -', r));
    console.error('\n   Indica la ruta con: SENADORES_JSON=/ruta/data/senadores.js node ...');
    process.exit(1);
  }

  console.log(`   JSON: ${jsonPath}`);
  console.log('═'.repeat(72) + '\n');

  const estaticos = leerSenadoresEstaticos(jsonPath);
  const titularesEst = estaticos.filter((s) => s.tipo === 'titular');
  const suplentesEst = estaticos.filter((s) => s.tipo === 'suplente');

  console.log(`📄 JSON estático: ${titularesEst.length} titulares, ${suplentesEst.length} suplentes`);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`🔌 MongoDB: ${mongoose.connection.name}\n`);

  const enBD = await Senador.find({ tipo: { $ne: 'suplente' } }).lean();
  console.log(`🗄️  Base de datos: ${enBD.length} titulares\n`);

  if (enBD.length === 0) {
    console.log('⚠️  No hay senadores en la base. Ejecuta primero el seed.\n');
    await mongoose.disconnect();
    process.exit(0);
  }

  let docsActualizados = 0;
  let camposTitular = 0;
  let camposSuplente = 0;
  let noEncontrados = [];
  const nombresDistintos = [];

  for (const titular of enBD) {
    const est = titularesEst.find((e) => e.id === titular.id);
    if (!est) {
      noEncontrados.push(titular.id);
      continue;
    }

    // ⚠️ Protección: si el nombre no coincide, NO se copian datos.
    // Evita asignar redes de una persona a otra si los ids se desalinean.
    // La comparación ignora tildes, mayúsculas, ñ y espacios múltiples,
    // porque el JSON y la base pueden diferir en esos detalles ("María" vs "Maria").
    const mismoNombre = normalizarNombre(est.name) === normalizarNombre(titular.name);

    if (!mismoNombre) {
      nombresDistintos.push({
        id: titular.id,
        enBD: titular.name,
        enJson: est.name
      });
      continue;
    }

    const cambios = {};

    // ---------- Redes del TITULAR ----------
    for (const red of REDES) {
      const nuevo = normalizarUrl(est[red]);
      if (!nuevo) continue;
      if (SOBRESCRIBIR || estaVacio(titular[red])) {
        cambios[red] = nuevo;
        camposTitular++;
      }
    }

    // ---------- Datos personales del TITULAR ----------
    for (const campo of ['fechaNacimiento', 'nacidoEn', 'ocupacion', 'comision', 'comite', 'cargo']) {
      const nuevo = limpiar(est[campo]);
      if (!nuevo) continue;
      if (SOBRESCRIBIR || estaVacio(titular[campo])) {
        cambios[campo] = nuevo;
        camposTitular++;
      }
    }

    // ---------- Redes del SUPLENTE ----------
    // El suplente estático se localiza por titularId
    const supEst = suplentesEst.find((s) => s.titularId === titular.id);

    if (supEst) {
      for (const red of REDES) {
        const nuevo = normalizarUrl(supEst[red]);
        if (!nuevo) continue;
        const clave = `${red}Suplente`;
        if (SOBRESCRIBIR || estaVacio(titular[clave])) {
          cambios[clave] = nuevo;
          camposSuplente++;
        }
      }

      // Datos personales del suplente
      for (const [campoEst, campoBD] of [
        ['fechaNacimiento', 'fechaNacimientoSuplente'],
        ['nacidoEn', 'nacidoEnSuplente'],
        ['ocupacion', 'ocupacionSuplente'],
        ['comite', 'comiteSuplente'],
        ['cargo', 'cargoSuplente']
      ]) {
        const nuevo = limpiar(supEst[campoEst]);
        if (!nuevo) continue;
        if (SOBRESCRIBIR || estaVacio(titular[campoBD])) {
          cambios[campoBD] = nuevo;
          camposSuplente++;
        }
      }

      // Si el suplente en BD no tiene nombre, se rellena
      if (estaVacio(titular.suplente) && supEst.name) {
        cambios.suplente = supEst.name;
        if (!titular.slugSuplente) cambios.slugSuplente = generarSlug(supEst.name);
      }
    }

    if (Object.keys(cambios).length === 0) continue;

    docsActualizados++;

    if (APLICAR) {
      await Senador.updateOne({ _id: titular._id }, { $set: cambios });
    }

    // Muestra los primeros 5 con detalle
    if (docsActualizados <= 5) {
      const redesCambiadas = Object.keys(cambios).filter((k) => k.includes('acebook') || k.includes('nstagram') || k.includes('itter') || k.includes('outube') || k.includes('iktok'));
      console.log(`   • #${String(titular.seatNumber).padStart(2)} ${titular.name}`);
      console.log(`     ${Object.keys(cambios).length} campo(s)${redesCambiadas.length ? ` — redes: ${redesCambiadas.join(', ')}` : ''}`);
    }
  }

  console.log('\n' + '─'.repeat(72));
  console.log(`✅ Documentos ${APLICAR ? 'actualizados' : 'a actualizar'}: ${docsActualizados} de ${enBD.length}`);
  console.log(`   Campos de titular  : ${camposTitular}`);
  console.log(`   Campos de suplente : ${camposSuplente}`);
  console.log('─'.repeat(72));

  if (noEncontrados.length > 0) {
    console.log(`\n⚠️  ${noEncontrados.length} registros de la base no están en el JSON (ids: ${noEncontrados.join(', ')})`);
  }

  if (nombresDistintos.length > 0) {
    console.log('\n⛔ REGISTROS OMITIDOS (el nombre no coincide, no se copiaron datos):');
    nombresDistintos.forEach((d) => {
      console.log(`   id ${d.id}`);
      console.log(`      BD  : ${d.enBD}`);
      console.log(`      JSON: ${d.enJson}`);
    });
    console.log('   Revisa si los ids de la base están desalineados antes de volver a ejecutar.');
  }

  console.log('\n' + '═'.repeat(72));
  if (!APLICAR) {
    console.log('ℹ️  SIMULACIÓN: no se escribió nada.');
    console.log('   Para aplicar:  node src/scripts/importarRedesSociales.js --aplicar');
  } else {
    console.log('🎉 Datos importados. Revisa el CMS → Pleno Camaral.');
  }
  console.log('═'.repeat(72) + '\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (error) => {
  console.error('\n❌ ERROR:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
