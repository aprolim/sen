const fs = require('fs');
const path = require('path');

const PDFS_RAW_DIR = path.join(__dirname, '..', '..', 'uploads', 'documents', 'pie-raw');

if (!fs.existsSync(PDFS_RAW_DIR)) {
  console.log(`❌ La carpeta NO existe: ${PDFS_RAW_DIR}`);
  console.log('   Significa que los PDFs fueron borrados o nunca se subieron.');
  process.exit(0);
}

const archivos = fs.readdirSync(PDFS_RAW_DIR);
console.log(`📂 Archivos encontrados en pie-raw: ${archivos.length}`);
console.log('\nPrimeros 10 archivos (como los ve el servidor):');
archivos.slice(0, 10).forEach(f => console.log(`  "${f}"`));

// Probamos buscar el archivo del PIE 001
console.log('\n🔍 Probando buscar el PIE 001:');
const encontrados = archivos.filter(f => 
  f.includes('001-2025-2026') || 
  f.includes('Nř 001') || 
  f.includes('N° 001')
);

if (encontrados.length === 0) {
  console.log('❌ No se encontró ningún archivo con "001-2025-2026".');
} else {
  console.log(`✅ Se encontraron ${encontrados.length} coincidencias:`);
  encontrados.forEach(f => console.log(`   - "${f}"`));
}