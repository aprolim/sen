const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    console.log('🔍 Conectando a MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📊 Base de datos: ${conn.connection.name}`);
    
    // Crear/verificar super admin al conectar
    await createSuperAdmin();
    
    return conn;
  } catch (error) {
    console.error(`❌ Error al conectar a MongoDB: ${error.message}`);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 MongoDB no está corriendo. Ejecuta:');
      console.log('   Windows: net start MongoDB');
      console.log('   macOS: brew services start mongodb-community');
      console.log('   Linux: sudo systemctl start mongod');
      console.log('   O ejecuta: mongod');
    }
    
    process.exit(1);
  }
};

const createSuperAdmin = async () => {
  try {
    const User = require('../models/User');
    
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@senado.bo';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!';
    
    console.log('\n👤 Verificando super administrador...');
    console.log(`📧 Email: ${superAdminEmail}`);
    
    const existingAdmin = await User.findOne({ 
      email: superAdminEmail.toLowerCase() 
    });
    
    if (!existingAdmin) {
      console.log('➕ Creando nuevo super administrador...');
      
      // ✅ PASSWORD EN TEXTO PLANO - Mongoose lo hasheará automáticamente
      const admin = await User.create({
        email: superAdminEmail.toLowerCase(),
        password: superAdminPassword, // ✅ TEXTO PLANO
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        profile: {
          firstName: 'Super',
          lastName: 'Administrador',
          position: 'Administrador del Sistema',
        },
      });
      
      console.log('✅ Super administrador creado exitosamente');
      console.log(`🔑 Password inicial: ${superAdminPassword}`);
      console.log('⚠️  Cambia esta contraseña después del primer login');
      
      // Verificación inmediata
      const isValid = await admin.comparePassword(superAdminPassword);
      console.log(`🔐 Verificación interna: ${isValid ? '✅ FUNCIONA' : '❌ NO FUNCIONA'}`);
      
    } else {
      console.log('✅ Super administrador ya existe en el sistema');
      console.log(`📅 Creado el: ${existingAdmin.createdAt}`);
      
      // Verificar si el password funciona
      const isValid = await existingAdmin.comparePassword(superAdminPassword);
      console.log(`🔐 ¿Password "${superAdminPassword}" funciona?: ${isValid ? '✅ SÍ' : '❌ NO'}`);
      
      // Si no funciona, corregirlo
      if (!isValid) {
        console.log('🔄 Corrigiendo password...');
        existingAdmin.password = superAdminPassword; // ✅ Texto plano
        await existingAdmin.save();
        console.log('✅ Password corregido');
      }
    }
    
    // Mostrar estadísticas
    const userCount = await User.countDocuments();
    console.log(`📈 Total de usuarios en sistema: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Error en createSuperAdmin:', error.message);
    // No salir del proceso, solo loguear el error
  }
};

module.exports = connectDB;