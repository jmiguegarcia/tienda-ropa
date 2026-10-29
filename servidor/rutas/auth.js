const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { autenticar } = require('../middleware/auth');

const router = express.Router();

const RONDAS_BCRYPT = 10;
const DURACION_SESION = '7d';

// Límite simple en memoria contra fuerza bruta: 10 intentos fallidos por IP y correo cada 15 min
const VENTANA_MS = 15 * 60 * 1000;
const MAX_FALLOS = 10;
const fallos = new Map();

function bloqueado(clave) {
  const registro = fallos.get(clave);
  if (registro && Date.now() - registro.desde > VENTANA_MS) {
    fallos.delete(clave);
    return false;
  }
  return (registro?.veces ?? 0) >= MAX_FALLOS;
}

function anotarFallo(clave) {
  const registro = fallos.get(clave) ?? { veces: 0, desde: Date.now() };
  registro.veces += 1;
  fallos.set(clave, registro);
}

const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '');
const emailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;

function crearSesion(usuario) {
  const token = jwt.sign({ sub: String(usuario.id), rol: usuario.rol }, process.env.JWT_SECRET, {
    expiresIn: DURACION_SESION
  });
  return { token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } };
}

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  const nombre = texto(req.body?.nombre);
  const email = texto(req.body?.email).toLowerCase();
  const password = req.body?.password;

  const campos = [];
  if (!nombre || nombre.length > 100) campos.push('nombre');
  if (!emailValido(email)) campos.push('email');
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) campos.push('password');
  if (campos.length > 0) {
    return res.status(400).json({ error: 'Datos no válidos', campos });
  }

  try {
    const hash = await bcrypt.hash(password, RONDAS_BCRYPT);
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3)
       RETURNING id, nombre, email, rol`,
      [nombre, email, hash]
    );
    res.status(201).json(crearSesion(result.rows[0]));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo', campos: ['email'] });
    }
    console.error('Error al registrar usuario:', err);
    res.status(500).json({ error: 'Error al crear la cuenta' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const email = texto(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const clave = `${req.ip}|${email}`;

  if (bloqueado(clave)) {
    return res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, nombre, email, rol, password_hash FROM usuarios WHERE email = $1',
      [email]
    );
    const usuario = result.rows[0];

    // Decisión de negocio: avisar si el correo no existe para ofrecer el registro.
    // Cuenta como intento fallido, así el límite también frena a quien pruebe correos.
    if (!usuario) {
      anotarFallo(clave);
      return res.status(404).json({
        error: 'Este correo no se encuentra registrado',
        codigo: 'CORREO_NO_REGISTRADO'
      });
    }

    if (!(await bcrypt.compare(password, usuario.password_hash))) {
      anotarFallo(clave);
      return res.status(401).json({ error: 'La contraseña no es correcta' });
    }

    fallos.delete(clave);
    res.json(crearSesion(usuario));
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// GET /api/auth/yo (datos del usuario de la sesión actual)
router.get('/yo', autenticar, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, email, rol FROM usuarios WHERE id = $1', [
      req.usuario.id
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'La sesión ya no es válida' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});

module.exports = router;
