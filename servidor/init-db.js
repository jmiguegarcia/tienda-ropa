require('dotenv').config();

const pool = require('./db');

async function initDB() {
  console.log('Iniciando configuración de tablas en PostgreSQL...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categorias (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS productos (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      descripcion TEXT DEFAULT '',
      precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
      categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
      imagen_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- El stock vive en la variante: una camiseta M roja y una L azul son artículos distintos
    CREATE TABLE IF NOT EXISTS variantes (
      id SERIAL PRIMARY KEY,
      producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
      talla VARCHAR(10) NOT NULL,
      color VARCHAR(50) NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      sku VARCHAR(50) UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      rol VARCHAR(20) NOT NULL DEFAULT 'cliente' CHECK (rol IN ('admin', 'cliente')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
      estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado')),
      total NUMERIC(10, 2) NOT NULL,
      fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- precio_unitario guarda el precio del momento de la compra
    CREATE TABLE IF NOT EXISTS pedido_items (
      id SERIAL PRIMARY KEY,
      pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
      variante_id INTEGER NOT NULL REFERENCES variantes(id),
      cantidad INTEGER NOT NULL CHECK (cantidad > 0),
      precio_unitario NUMERIC(10, 2) NOT NULL
    );
  `);

  const res = await pool.query('SELECT COUNT(*) FROM productos');
  if (parseInt(res.rows[0].count, 10) === 0) {
    console.log('Sembrando catálogo de prueba...');

    const categorias = await pool.query(`
      INSERT INTO categorias (nombre) VALUES ('Camisetas'), ('Sudaderas'), ('Pantalones')
      RETURNING id, nombre
    `);
    const idCategoria = Object.fromEntries(categorias.rows.map((c) => [c.nombre, c.id]));

    const productos = [
      ['Camiseta básica', 'Camiseta de algodón 100%', 14.99, idCategoria.Camisetas, ['Blanco', 'Negro']],
      ['Sudadera con capucha', 'Sudadera de felpa', 34.99, idCategoria.Sudaderas, ['Gris']],
      ['Vaquero recto', 'Pantalón vaquero de corte recto', 39.99, idCategoria.Pantalones, ['Azul']]
    ];

    for (const [nombre, descripcion, precio, categoriaId, colores] of productos) {
      const producto = await pool.query(
        'INSERT INTO productos (nombre, descripcion, precio, categoria_id) VALUES ($1, $2, $3, $4) RETURNING id',
        [nombre, descripcion, precio, categoriaId]
      );
      const productoId = producto.rows[0].id;

      for (const color of colores) {
        for (const talla of ['S', 'M', 'L', 'XL']) {
          await pool.query(
            'INSERT INTO variantes (producto_id, talla, color, stock, sku) VALUES ($1, $2, $3, $4, $5)',
            [productoId, talla, color, 10, `P${productoId}-${color.slice(0, 3).toUpperCase()}-${talla}`]
          );
        }
      }
    }
  }

  console.log('Base de datos inicializada correctamente.');
}

if (require.main === module) {
  initDB()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Error inicializando base de datos:', err);
      pool.end();
    });
}

module.exports = initDB;
