const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    
    // Crear super admin al conectar
    await createSuperAdmin();
    
  } catch (error) {
    console.error(`❌ Error al conectar a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const createSuperAdmin = async () => {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@senado.bo';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!';
    
    const existingAdmin = await User.findOne({ 
      email: superAdminEmail,
      role: 'SUPER_ADMIN' 
    });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
      
      await User.create({
        email: superAdminEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        profile: {
          firstName: 'Super',
          lastName: 'Administrador',
          position: 'Administrador del Sistema',
        },
      });
      
      console.log('✅ Super administrador creado exitosamente');
      console.log(`📧 Email: ${superAdminEmail}`);
      console.log(`🔑 Password: ${superAdminPassword}`);
    }
  } catch (error) {
    console.error('❌ Error al crear super admin:', error.message);
  }
};

module.exports = connectDB;