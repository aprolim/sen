// reset-admin-simple.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Configurar directamente (sin dotenv)
const MONGODB_URI = 'mongodb://localhost:27017/senado_bolivia';

async function main() {
  console.log('🚀 Conectando a:', MONGODB_URI);
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB conectado');
    
    const User = require('./models/User');
    
    // 1. Eliminar admin existente
    const deleted = await User.deleteMany({ email: 'admin@senado.bo' });
    console.log(`🗑️  Eliminados ${deleted.deletedCount} usuarios admin`);
    
    // 2. Crear nuevo admin con password en texto plano
    const adminData = {
      email: 'admin@senado.bo',
      password: 'Admin123!', // ✅ Pasar en texto plano
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      profile: {
        firstName: 'Super',
        lastName: 'Administrador',
        position: 'Administrador del Sistema',
      },
    };
    
    console.log('\n📝 Creando admin con estos datos:');
    console.log('   Email:', adminData.email);
    console.log('   Password:', adminData.password);
    console.log('   Rol:', adminData.role);
    
    // Usar User.create() - activará el hook pre-save
    const admin = await User.create(adminData);
    
    console.log('\n✅ ADMIN CREADO:');
    console.log('   ID:', admin._id);
    console.log('   Email:', admin.email);
    console.log('   Hash generado:', admin.password.substring(0, 30) + '...');
    
    // 3. Verificar inmediatamente
    const adminFromDB = await User.findOne({ email: 'admin@senado.bo' });
    console.log('\n🔍 VERIFICACIÓN:');
    console.log('   Usuario encontrado:', !!adminFromDB);
    
    if (adminFromDB) {
      const isValid = await adminFromDB.comparePassword('Admin123!');
      console.log('   Login válido con "Admin123!":', isValid ? '✅ SÍ' : '❌ NO');
      
      // También probar otras variantes
      console.log('\n🔐 Probando diferentes passwords:');
      console.log('   "admin123!":', await adminFromDB.comparePassword('admin123!'));
      console.log('   "Admin123":', await adminFromDB.comparePassword('Admin123'));
      console.log('   "Admin123! ":', await adminFromDB.comparePassword('Admin123! '));
      console.log('   " Admin123!":', await adminFromDB.comparePassword(' Admin123!'));
    }
    
    // 4. Crear usuario de prueba adicional
    await User.create({
      email: 'test@senado.bo',
      password: 'Test123!',
      role: 'CITIZEN',
      status: 'ACTIVE',
      profile: {
        firstName: 'Test',
        lastName: 'Usuario',
      },
    });
    
    console.log('\n👤 Usuario de prueba creado: test@senado.bo / Test123!');
    
    // 5. Mostrar todos
    const allUsers = await User.find({});
    console.log('\n👥 TOTAL USUARIOS:', allUsers.length);
    allUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.role})`);
    });
    
    await mongoose.disconnect();
    console.log('\n🎉 Listo! Prueba en Postman:');
    console.log('   POST http://localhost:3000/api/auth/login');
    console.log('   Body: {"email":"admin@senado.bo","password":"Admin123!"}');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('connect ECONNREFUSED')) {
      console.log('\n⚠️  MongoDB no está corriendo.');
      console.log('   Inicia MongoDB primero:');
      console.log('   Windows: net start MongoDB');
      console.log('   macOS: brew services start mongodb-community');
      console.log('   Linux: sudo systemctl start mongod');
      console.log('   O ejecuta: mongod');
    }
    
    process.exit(1);
  }
}

main();