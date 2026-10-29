require('dotenv').config();

const express = require('express');
const cors = require('cors');
const initDB = require('./init-db');

const productosRutas = require('./rutas/productos');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Montar rutas
app.use('/api/productos', productosRutas);

// Ruta base informativa
app.get('/api', (req, res) => {
  res.json({
    app: 'Tienda Ropa API',
    version: '0.1.0',
    estado: 'activo'
  });
});

async function iniciarServidor() {
  try {
    // Asegura que las tablas y el catálogo de prueba existan
    await initDB();

    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

iniciarServidor();
