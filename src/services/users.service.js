const User = require('../models/User');

class UsersService {
  /**
   * Crear usuario (para administradores)
   */
  async createUser(userData, creatorRole) {
    try {
      // Verificar permisos
      if (creatorRole === 'CITIZEN' || creatorRole === 'VIEWER') {
        throw new Error('No tiene permisos para crear usuarios');
      }
      
      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
      
      if (existingUser) {
        throw new Error('El email ya está registrado');
      }
      
      // Crear usuario
      const user = new User({
        ...userData,
        email: userData.email.toLowerCase(),
      });
      
      await user.save();
      
      return user;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Obtener todos los usuarios (paginated)
   */
  async getUsers(page = 1, limit = 10, filters = {}) {
    try {
      const query = {};
      
      // Aplicar filtros
      if (filters.role) query.role = filters.role;
      if (filters.status) query.status = filters.status;
      if (filters.search) {
        query.$or = [
          { email: { $regex: filters.search, $options: 'i' } },
          { 'profile.firstName': { $regex: filters.search, $options: 'i' } },
          { 'profile.lastName': { $regex: filters.search, $options: 'i' } },
        ];
      }
      
      const skip = (page - 1) * limit;
      
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password -refreshToken')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(query),
      ]);
      
      return {
        users,
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Obtener usuario por ID
   */
  async getUserById(id) {
    try {
      const user = await User.findById(id).select('-password -refreshToken');
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Actualizar usuario
   */
  async updateUser(id, updateData, updaterRole) {
    try {
      const user = await User.findById(id);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      // Verificar permisos
      if (updaterRole === 'CITIZEN' && user._id.toString() !== id) {
        throw new Error('Solo puede actualizar su propio perfil');
      }
      
      if (updaterRole === 'VIEWER') {
        throw new Error('No tiene permisos para actualizar usuarios');
      }
      
      // Actualizar campos permitidos
      const allowedFields = ['profile', 'status'];
      if (updaterRole === 'SUPER_ADMIN' || updaterRole === 'ADMIN') {
        allowedFields.push('role');
      }
      
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          user[key] = updateData[key];
        }
      });
      
      await user.save();
      
      return user;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Eliminar usuario
   */
  async deleteUser(id, deleterRole) {
    try {
      if (deleterRole !== 'SUPER_ADMIN') {
        throw new Error('Solo el super administrador puede eliminar usuarios');
      }
      
      const user = await User.findByIdAndDelete(id);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      return { message: 'Usuario eliminado exitosamente' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UsersService();