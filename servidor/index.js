require('dotenv').config();

const express = require('express');
const cors = require('cors');
const initDB = require('./init-db');

const productosRutas = require('./rutas/productos');
const categoriasRutas = require('./rutas/categorias');
const solicitudesRutas = require('./rutas/solicitudes');
const authRutas = require('./rutas/auth');

// Sin secreto los tokens de sesión no se pueden firmar: mejor no arrancar
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('Falta JWT_SECRET en servidor/.env (mínimo 32 caracteres). Mira .env.example.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Montar rutas
app.use('/api/productos', productosRutas);
app.use('/api/categorias', categoriasRutas);
app.use('/api/solicitudes', solicitudesRutas);
app.use('/api/auth', authRutas);

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
