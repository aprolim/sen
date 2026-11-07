// src/scripts/resetPassword.js
// Uso: node src/scripts/resetPassword.js email@dominio.com NuevaPassword123!
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');

async function resetPassword() {
  const [, , email, newPassword] = process.argv;

  if (!email || !newPassword) {
    console.error('Uso: node src/scripts/resetPassword.js <email> <nuevaPassword>');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('❌ La contraseña debe tener al menos 8 caracteres');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
  console.log('✅ MongoDB conectado');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    console.error(`❌ No existe usuario con email ${email}`);
    process.exit(1);
  }

  // ⚠️ IMPORTANTE: asignar en texto plano.
  // El hook pre('save') del modelo lo hashea automáticamente.
  user.password = newPassword;
  await user.save();

  console.log(`✅ Contraseña actualizada para ${user.email} (rol: ${user.role})`);

  // Verificar
  const check = await User.findOne({ email: email.toLowerCase() }).select('+password');
  const ok = await check.comparePassword(newPassword);
  console.log(`🔍 Verificación login: ${ok ? '✅ OK' : '❌ FALLÓ'}`);

  await mongoose.disconnect();
  process.exit(0);
}

resetPassword().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});