const jwt = require('jsonwebtoken');

// Exige "Authorization: Bearer <token>" válido y deja { id, rol } en req.usuario
function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization ?? '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Necesitas iniciar sesión' });
  }

  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: Number(datos.sub), rol: datos.rol };
    next();
  } catch {
    res.status(401).json({ error: 'La sesión ha caducado, vuelve a iniciar sesión' });
  }
}

// Para rutas de administración (usar después de autenticar)
function requerirRol(rol) {
  return (req, res, next) => {
    if (req.usuario?.rol !== rol) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    }
    next();
  };
}

module.exports = { autenticar, requerirRol };
