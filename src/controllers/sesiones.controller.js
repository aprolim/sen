// src/controllers/sesiones.controller.js
const SesionesVideo = require('../models/SesionesVideo');
const SesionFecha = require('../models/SesionFecha');

class SesionesController {
  
  // ============================================
  // VIDEOS - PÚBLICOS
  // ============================================
  
  async getVideos(req, res) {
    console.log('📹 [GET /api/sesiones] Solicitando videos');
    try {
      const videos = await SesionesVideo.find()
        .sort({ position: 1 })
        .lean();
      
      console.log(`📹 Encontrados ${videos.length} videos en BD`);
      res.json({ success: true, data: videos });
    } catch (error) {
      console.error('❌ Error en getVideos:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getLiveVideo(req, res) {
    console.log('🔴 [GET /api/sesiones/live] Solicitando video en vivo');
    try {
      const liveVideo = await SesionesVideo.findOne({ 
        isLive: true,
        isActive: true 
      }).lean();
      
      res.json({ 
        success: true, 
        data: liveVideo || null
      });
    } catch (error) {
      console.error('❌ Error en getLiveVideo:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ============================================
  // VIDEOS - ADMIN
  // ============================================

  async getAllVideos(req, res) {
    try {
      const videos = await SesionesVideo.find().sort({ position: 1 });
      res.json({ success: true, data: videos });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createVideo(req, res) {
    try {
      const { position, title, url, isActive, isLive } = req.body;
      
      const existing = await SesionesVideo.findOne({ position });
      if (existing) {
        return res.status(400).json({ 
          success: false, 
          message: `Ya existe un video en la posición ${position}` 
        });
      }
      
      const video = new SesionesVideo({
        position,
        title,
        url,
        youtubeId: this.extractYoutubeId(url),
        isActive: isActive !== undefined ? isActive : true,
        isLive: isLive || false,
        createdBy: req.user?._id,
        lastUpdatedBy: req.user?._id
      });
      
      await video.save();
      res.status(201).json({ success: true, data: video });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateVideo(req, res) {
    try {
      const { position } = req.params;
      const { title, url, isActive, youtubeId, isLive } = req.body;
      
      console.log(`📹 [PUT /api/sesiones/${position}]`);
      console.log(`   Título: ${title}`);
      console.log(`   isLive: ${isLive}`);
      
      let video = await SesionesVideo.findOne({ position: parseInt(position) });
      
      if (video) {
        video.title = title;
        video.url = url;
        if (youtubeId) video.youtubeId = youtubeId;
        if (isActive !== undefined) video.isActive = isActive;
        if (isLive !== undefined) video.isLive = isLive;
        video.lastUpdatedBy = req.user?._id;
        await video.save();
        console.log(`✅ Video ${position} actualizado`);
      } else {
        video = new SesionesVideo({
          position: parseInt(position),
          title,
          url,
          youtubeId: youtubeId || this.extractYoutubeId(url),
          isActive: isActive !== undefined ? isActive : true,
          isLive: isLive || false,
          createdBy: req.user?._id,
          lastUpdatedBy: req.user?._id
        });
        await video.save();
        console.log(`✅ Video ${position} creado`);
      }
      
      res.json({ success: true, data: video });
    } catch (error) {
      console.error('❌ Error en updateVideo:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteVideo(req, res) {
    try {
      const { position } = req.params;
      
      console.log(`🗑️ [DELETE /api/sesiones/${position}]`);
      
      const video = await SesionesVideo.findOne({ position: parseInt(position) });
      
      if (!video) {
        return res.status(404).json({ 
          success: false, 
          message: 'Video no encontrado' 
        });
      }
      
      await SesionesVideo.deleteOne({ _id: video._id });
      
      console.log(`✅ Video ${position} eliminado permanentemente`);
      
      res.json({ 
        success: true, 
        message: `Video ${position} eliminado` 
      });
    } catch (error) {
      console.error('❌ Error en deleteVideo:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  extractYoutubeId(url) {
    if (!url) return '';
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : '';
  }

  // ============================================
  // FECHAS DE SESIONES - PÚBLICAS
  // ============================================

  async getFechasSesiones(req, res) {
    try {
      console.log('📅 [GET /api/sesiones/fechas] Solicitando fechas de sesiones');
      
      const ahora = new Date();
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 2, 0);
      
      const fechas = await SesionFecha.find({
        fecha: { $gte: inicioMes, $lte: finMes },
        esActivo: true
      })
      .sort({ fecha: 1 })
      .lean();
      
      const fechasFormateadas = fechas.map(f => ({
        fecha: f.fecha.toISOString().split('T')[0],
        titulo: f.titulo,
        descripcion: f.descripcion,
        tipo: f.tipo
      }));
      
      res.json({ success: true, data: fechasFormateadas });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ============================================
  // FECHAS DE SESIONES - ADMIN
  // ============================================

  async getFechasSesionesAdmin(req, res) {
    try {
      const { year, month } = req.query;
      let query = {};
      
      if (year && month) {
        const inicio = new Date(parseInt(year), parseInt(month) - 1, 1);
        const fin = new Date(parseInt(year), parseInt(month), 0);
        query.fecha = { $gte: inicio, $lte: fin };
      }
      
      const fechas = await SesionFecha.find(query).sort({ fecha: 1 }).lean();
      res.json({ success: true, data: fechas });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createFechaSesion(req, res) {
    try {
      const { fecha, titulo, descripcion, tipo } = req.body;
      
      if (!fecha) {
        return res.status(400).json({
          success: false,
          message: 'La fecha es requerida'
        });
      }
      
      const fechaObj = new Date(fecha);
      fechaObj.setHours(0, 0, 0, 0);
      
      const existing = await SesionFecha.findOne({ fecha: fechaObj });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una sesión en esta fecha'
        });
      }
      
      const nuevaFecha = new SesionFecha({
        fecha: fechaObj,
        titulo: titulo || 'Sesión del Senado',
        descripcion: descripcion || '',
        tipo: tipo || 'ordinaria',
        createdBy: req.user._id,
        lastUpdatedBy: req.user._id
      });
      
      await nuevaFecha.save();
      
      res.status(201).json({
        success: true,
        message: 'Fecha de sesión creada exitosamente',
        data: nuevaFecha
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteFechaSesion(req, res) {
    try {
      const { fechaId } = req.params;
      
      const fecha = await SesionFecha.findByIdAndDelete(fechaId);
      
      if (!fecha) {
        return res.status(404).json({
          success: false,
          message: 'Fecha no encontrada'
        });
      }
      
      res.json({ success: true, message: 'Fecha eliminada exitosamente' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateFechaSesion(req, res) {
    try {
      const { fechaId } = req.params;
      const { titulo, descripcion, tipo, esActivo } = req.body;
      
      const fecha = await SesionFecha.findById(fechaId);
      
      if (!fecha) {
        return res.status(404).json({
          success: false,
          message: 'Fecha no encontrada'
        });
      }
      
      if (titulo !== undefined) fecha.titulo = titulo;
      if (descripcion !== undefined) fecha.descripcion = descripcion;
      if (tipo !== undefined) fecha.tipo = tipo;
      if (esActivo !== undefined) fecha.esActivo = esActivo;
      
      fecha.lastUpdatedBy = req.user._id;
      await fecha.save();
      
      res.json({
        success: true,
        message: 'Fecha actualizada exitosamente',
        data: fecha
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new SesionesController();