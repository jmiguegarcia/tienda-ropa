const express = require('express');
const pool = require('../db');

const router = express.Router();

// Teléfono internacional; en Colombia (+57) solo celulares: 3 + 9 dígitos
function telefonoValido(telefono) {
  if (typeof telefono !== 'string' || !/^\+\d{8,15}$/.test(telefono)) {
    return false;
  }
  return !telefono.startsWith('+57') || /^\+573\d{9}$/.test(telefono);
}

const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '');

// POST /api/solicitudes (pedido personalizado para cotizar por WhatsApp)
router.post('/', async (req, res) => {
  const datos = req.body ?? {};
  const nombre = texto(datos.nombre);
  const comentario = texto(datos.comentario);
  const productoId = Number(datos.producto_id);
  const cantidad = Number(datos.cantidad);
  const corte = datos.corte ?? null;

  const campos = [];
  if (!nombre || nombre.length > 100) campos.push('nombre');
  if (!telefonoValido(datos.telefono)) campos.push('telefono');
  if (!Number.isInteger(productoId)) campos.push('producto_id');
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 1000) campos.push('cantidad');
  if (!['propio', 'crear'].includes(datos.diseno)) campos.push('diseno');
  if (comentario.length > 500) campos.push('comentario');
  if (datos.autorizacion !== true) campos.push('autorizacion');
  if (campos.length > 0) {
    return res.status(400).json({ error: 'Datos no válidos', campos });
  }

  try {
    // La combinación elegida debe existir en una prenda estándar del catálogo
    const variante = await pool.query(
      `SELECT 1
       FROM variantes v
       JOIN productos p ON p.id = v.producto_id
       WHERE p.id = $1 AND p.tipo = 'estandar'
         AND v.corte IS NOT DISTINCT FROM $2 AND v.talla = $3 AND v.color = $4
       LIMIT 1`,
      [productoId, corte, datos.talla, datos.color]
    );
    if (variante.rowCount === 0) {
      return res.status(400).json({ error: 'Datos no válidos', campos: ['prenda'] });
    }

    const solicitud = await pool.query(
      `INSERT INTO solicitudes_personalizado
         (nombre, telefono, producto_id, corte, talla, color, cantidad, diseno, comentario)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [nombre, datos.telefono, productoId, corte, datos.talla, datos.color, cantidad, datos.diseno, comentario]
    );
    res.status(201).json({ id: solicitud.rows[0].id });
  } catch (err) {
    console.error('Error al guardar solicitud:', err);
    res.status(500).json({ error: 'Error al guardar la solicitud' });
  }
});

module.exports = router;
