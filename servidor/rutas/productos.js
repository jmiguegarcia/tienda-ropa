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

    const result = await pool.query(
      `SELECT p.*, c.nombre AS categoria
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       ${filtro}
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
  try {
    const producto = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
    if (producto.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const variantes = await pool.query(
      'SELECT id, talla, color, stock, sku FROM variantes WHERE producto_id = $1 ORDER BY color, id',
      [id]
    );

    res.json({ ...producto.rows[0], variantes: variantes.rows });
  } catch (err) {
    console.error('Error al obtener producto:', err);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

module.exports = router;
