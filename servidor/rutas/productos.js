const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/productos?categoria=1 (catálogo público)
router.get('/', async (req, res) => {
  try {
    const params = [];
    let filtro = '';
    if (req.query.categoria) {
      params.push(Number(req.query.categoria));
      filtro = 'WHERE p.categoria_id = $1';
    }

    // precio_min y precio_max cubren las variantes con precio propio (por ejemplo, por corte)
    const result = await pool.query(
      `SELECT p.*, c.nombre AS categoria,
              COALESCE(MIN(COALESCE(v.precio, p.precio)), p.precio) AS precio_min,
              COALESCE(MAX(COALESCE(v.precio, p.precio)), p.precio) AS precio_max
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       LEFT JOIN variantes v ON v.producto_id = p.id
       ${filtro}
       GROUP BY p.id, c.nombre
       ORDER BY p.id`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET /api/productos/:id (incluye sus variantes)
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  try {
    const producto = await pool.query(
      `SELECT p.*, c.nombre AS categoria
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE p.id = $1`,
      [id]
    );
    if (producto.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const variantes = await pool.query(
      `SELECT v.id, v.corte, v.talla, v.color, v.stock, v.sku,
              COALESCE(v.precio, p.precio) AS precio
       FROM variantes v
       JOIN productos p ON p.id = v.producto_id
       WHERE v.producto_id = $1
       ORDER BY v.id`,
      [id]
    );

    res.json({ ...producto.rows[0], variantes: variantes.rows });
  } catch (err) {
    console.error('Error al obtener producto:', err);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

module.exports = router;
