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
      -- 'personalizado': no se vende por carrito, se solicita y se cotiza por WhatsApp
      tipo VARCHAR(20) NOT NULL DEFAULT 'estandar' CHECK (tipo IN ('estandar', 'personalizado')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Bases de datos creadas antes de añadir el tipo de producto
    ALTER TABLE productos ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) NOT NULL DEFAULT 'estandar'
      CHECK (tipo IN ('estandar', 'personalizado'));

    -- El stock vive en la variante: una camiseta M roja y una L azul son artículos distintos.
    -- corte es opcional (estándar, oversize...) y precio, si se indica, sustituye al del producto.
    CREATE TABLE IF NOT EXISTS variantes (
      id SERIAL PRIMARY KEY,
      producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
      corte VARCHAR(30),
      talla VARCHAR(10) NOT NULL,
      color VARCHAR(50) NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      sku VARCHAR(50) UNIQUE NOT NULL,
      precio NUMERIC(10, 2) CHECK (precio >= 0)
    );

    -- Bases de datos creadas antes de añadir corte y precio a las variantes
    ALTER TABLE variantes ADD COLUMN IF NOT EXISTS corte VARCHAR(30);
    ALTER TABLE variantes ADD COLUMN IF NOT EXISTS precio NUMERIC(10, 2) CHECK (precio >= 0);

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

    -- Pedidos personalizados: All Style contacta al cliente por WhatsApp para cotizar.
    -- telefono en formato internacional (+573001234567). corte/talla/color copian la elección.
    CREATE TABLE IF NOT EXISTS solicitudes_personalizado (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      telefono VARCHAR(20) NOT NULL,
      producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
      corte VARCHAR(30),
      talla VARCHAR(10) NOT NULL,
      color VARCHAR(50) NOT NULL,
      cantidad INTEGER NOT NULL CHECK (cantidad > 0),
      diseno VARCHAR(20) NOT NULL CHECK (diseno IN ('propio', 'crear')),
      comentario TEXT NOT NULL DEFAULT '',
      estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'contactado', 'cerrado')),
      fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const res = await pool.query('SELECT COUNT(*) FROM productos');
  if (parseInt(res.rows[0].count, 10) === 0) {
    console.log('Sembrando catálogo de prueba...');

    const categorias = await pool.query(`
      INSERT INTO categorias (nombre) VALUES ('Camisetas'), ('Hoodies'), ('Personalizados')
      RETURNING id, nombre
    `);
    const idCategoria = Object.fromEntries(categorias.rows.map((c) => [c.nombre, c.id]));

    const tallas = ['S', 'M', 'L', 'XL'];
    const colores = ['Blanco', 'Negro'];

    // precio del producto = precio base ("desde"); cada corte puede tener el suyo
    const productos = [
      {
        nombre: 'Camiseta',
        precio: 45000,
        categoriaId: idCategoria.Camisetas,
        cortes: [
          ['Estándar', 45000],
          ['Semi-oversize', 50000],
          ['Oversize', 60000]
        ]
      },
      { nombre: 'Hoodie', precio: 130000, categoriaId: idCategoria.Hoodies, cortes: [[null, null]] }
    ];

    for (const { nombre, precio, categoriaId, cortes } of productos) {
      const producto = await pool.query(
        'INSERT INTO productos (nombre, precio, categoria_id) VALUES ($1, $2, $3) RETURNING id',
        [nombre, precio, categoriaId]
      );
      const productoId = producto.rows[0].id;

      for (const [corte, precioCorte] of cortes) {
        for (const color of colores) {
          for (const talla of tallas) {
            const sku = [`P${productoId}`, corte, color, talla]
              .filter(Boolean)
              .map((parte) => parte.normalize('NFD').replace(/[^\w]/g, '').slice(0, 4).toUpperCase())
              .join('-');
            await pool.query(
              'INSERT INTO variantes (producto_id, corte, talla, color, stock, sku, precio) VALUES ($1, $2, $3, $4, $5, $6, $7)',
              [productoId, corte, talla, color, 10, sku, precioCorte]
            );
          }
        }
      }
    }

    // Sin variantes propias: sus opciones salen de las prendas estándar del catálogo
    await pool.query(
      `INSERT INTO productos (nombre, precio, categoria_id, tipo)
       VALUES ('Personalizado', 0, $1, 'personalizado')`,
      [idCategoria.Personalizados]
    );
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
