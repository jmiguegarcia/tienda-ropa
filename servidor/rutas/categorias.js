const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/categorias (para los filtros del catálogo)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre FROM categorias ORDER BY nombre');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener categorías:', err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

module.exports = router;
