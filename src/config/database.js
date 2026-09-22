// src/config/database.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Conecta a MongoDB y, SOLO la primera vez (cuando no hay usuarios),
 * crea el super admin inicial usando las variables SUPER_ADMIN_*.
 *
 * ⚠️  Después de crear el admin, borrar SUPER_ADMIN_EMAIL y
 *     SUPER_ADMIN_PASSWORD del .env.
 */
const connectDB = async () => {
  try {
    console.log('🔍 Conectando a MongoDB...');

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📊 Base de datos: ${conn.connection.name}`);

    // Verificar variables críticas
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
    }
    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
      throw new Error('JWT_REFRESH_SECRET debe tener al menos 32 caracteres');
    }

    await ensureInitialAdmin();

    return conn;
  } catch (error) {
    console.error(`❌ Error al conectar a MongoDB: ${error.message}`);

    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 MongoDB no está corriendo. Ejecuta:');
      console.log('   Windows: net start MongoDB');
      console.log('   macOS:   brew services start mongodb-community');
      console.log('   Linux:   sudo systemctl start mongod');
    }

    process.exit(1);
  }
};

/**
 * Crea el super admin SOLO si:
 *   1. La colección de usuarios está vacía (primera vez).
 *   2. Existen SUPER_ADMIN_EMAIL y SUPER_ADMIN_PASSWORD en el .env.
 *   3. La password tiene al menos 12 caracteres.
 *
 * Si ya hay usuarios, NO toca nada.
 * Nunca loguea la password en consola.
 */
const ensureInitialAdmin = async () => {
  try {
    const User = require('../models/User');

    const userCount = await User.countDocuments();

    if (userCount > 0) {
      console.log(`👤 Ya existen ${userCount} usuario(s). No se crea admin inicial.`);
      return;
    }

    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      console.warn(
        '\n⚠️  La base de datos está vacía y faltan SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD.\n' +
        '   Opciones:\n' +
        '     a) Añádelas al .env y reinicia.\n' +
        '     b) Crea el admin manualmente: node src/scripts/createAdmin.js\n'
      );
      return;
    }

    if (password.length < 12) {
      console.warn(
        `⚠️  SUPER_ADMIN_PASSWORD debe tener al menos 12 caracteres (actual: ${password.length}).\n` +
        '   No se crea el admin por seguridad.'
      );
      return;
    }

    await User.create({
      email: email.toLowerCase(),
      password, // El modelo User lo hashea con bcrypt en pre('save')
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      profile: {
        firstName: 'Super',
        lastName: 'Administrador',
        position: 'Administrador del Sistema',
      },
    });

    console.log('✅ Super admin inicial creado (solo esta vez).');
    console.log('⚠️  IMPORTANTE:');
    console.log('   1. Inicia sesión y cambia la contraseña inmediatamente.');
    console.log('   2. Borra SUPER_ADMIN_EMAIL y SUPER_ADMIN_PASSWORD del .env.');
    console.log('   3. Reinicia el backend.\n');
  } catch (error) {
    console.error('❌ Error creando admin inicial:', error.message);
    // No salimos del proceso: preferimos arrancar sin admin que no arrancar.
  }
};

module.exports = connectDB;