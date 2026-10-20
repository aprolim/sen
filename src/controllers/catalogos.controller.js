// src/controllers/catalogos.controller.js
const Senador = require('../models/Senador');
const Comision = require('../models/Comision');

/**
 * ============================================
 * 📋 CATÁLOGOS PARA EL CMS
 * ============================================
 * Estos endpoints los consume SOLO el CMS (panel de administración).
 * Están protegidos por `authenticate` en routes/catalogos.routes.js,
 * por lo que NO son accesibles desde el portal público.
 *
 * El portal público NO usa /api/catalogos/*, así que cualquier cambio
 * aquí es seguro y no rompe ninguna página pública.
 * ============================================
 */

/**
 * GET /api/catalogos/senadores
 * GET /api/catalogos/senadores?q=mamani
 *
 * Devuelve la lista de senadores (titulares + suplentes) para poblar
 * selects, autocompletados y multi-selects del CMS.
 *
 * Query params:
 *   - q (opcional): término de búsqueda parcial (case-insensitive).
 *                   Busca en nombre, partido y departamento.
 *
 * Respuesta:
 *   {
 *     success: true,
 *     data: [
 *       {
 *         id: 1,
 *         name: "Wilder Véliz Armas",
 *         tipo: "titular",          // "titular" | "suplente"
 *         party: "Partido Demócrata Cristiano",
 *         partyShort: "PDC",
 *         department: "Cochabamba",
 *         foto: "/senadores/titulares/g1/WILDER VELIZ ARMAS.png",
 *         cargo: "Senador",
 *         // Compatibilidad con selects viejos:
 *         value: "Wilder Véliz Armas",
 *         label: "Wilder Véliz Armas - Cochabamba"
 *       },
 *       ...
 *     ]
 *   }
 *
 * Notas:
 *   - El array viene ordenado alfabéticamente por nombre.
 *   - Se devuelven TODOS los senadores (36 titulares + ~35 suplentes),
 *     para que el CMS pueda filtrar en cliente si lo prefiere.
 *   - El campo `value` es el nombre exacto (lo que se guarda en el
 *     array `peticionario` del modelo DocumentoLegislativo).
 */
const getSenadores = async (req, res) => {
  try {
    const { q } = req.query;

    // Filtro de búsqueda parcial (opcional)
    const filtro = {};
    if (q && typeof q === 'string' && q.trim()) {
      const termino = q.trim();
      filtro.$or = [
        { name:       { $regex: termino, $options: 'i' } },
        { party:      { $regex: termino, $options: 'i' } },
        { partyShort: { $regex: termino, $options: 'i' } },
        { department: { $regex: termino, $options: 'i' } },
      ];
    }

    const senadores = await Senador.find(
      filtro,
      // Proyección: solo los campos que el CMS necesita
      'id name tipo party partyShort department foto cargo'
    )
      .sort({ name: 1 })
      .lean();

    const data = senadores.map((s) => ({
      // Campos nuevos (para el MultiSelect del CMS)
      id: s.id,
      name: s.name,
      tipo: s.tipo,
      party: s.party || '',
      partyShort: s.partyShort || '',
      department: s.department || '',
      foto: s.foto || '',
      cargo: s.cargo || '',

      // ⚠️ Campos de compatibilidad: NO ELIMINAR
      // Los usan selects antiguos del CMS que aún no migramos.
      value: s.name,
      label: `${s.name}${s.tipo === 'suplente' ? ' (Suplente)' : ''} - ${s.department || 'Sin departamento'}`,
    }));

    return res.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    console.error('❌ [getSenadores] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de senadores',
    });
  }
};

/**
 * GET /api/catalogos/comisiones
 *
 * Devuelve la lista de comisiones camarales para poblar selects
 * del CMS (por ejemplo, en el formulario de documentos legislativos).
 *
 * Respuesta:
 *   {
 *     success: true,
 *     data: [
 *       { value: "Comisión de Constitución...", label: "Comisión de Constitución..." },
 *       ...
 *     ]
 *   }
 */
const getComisiones = async (req, res) => {
  try {
    const comisiones = await Comision.find({}, 'nombre')
      .sort({ nombre: 1 })
      .lean();

    const data = comisiones.map((c) => ({
      value: c.nombre,
      label: c.nombre,
    }));

    return res.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    console.error('❌ [getComisiones] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de comisiones',
    });
  }
};

module.exports = {
  getSenadores,
  getComisiones,
};