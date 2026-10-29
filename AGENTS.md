# Tienda Ropa

Tienda online de camisetas y ropa en general para **All Style** (Cartago, Valle, Colombia). La estética toma como referencia su Instagram (@allstyle.dr): lavanda como color de marca y azul noche para contraste.

## Estructura

- `cliente/`: aplicación Angular (puerto 4200)
- `servidor/`: API Node.js + Express + PostgreSQL (puerto 3000)

## Comandos

### Frontend (`cliente/`)

```bash
npm start
```

### Backend (`servidor/`)

```bash
npm start          # inicializa la BD y arranca la API
npm run init-db    # solo inicializa la BD
```

## API

- `GET /api/productos`: lista productos con `precio_min` y `precio_max` de sus variantes (filtro opcional `?categoria=<id>`)
- `GET /api/productos/:id`: obtiene un producto con sus variantes (cada una con su precio final)
- `GET /api/categorias`: lista categorías
- `POST /api/solicitudes`: guarda una solicitud de personalizado (nombre, teléfono, prenda elegida, cantidad, diseño, autorización)
- `POST /api/auth/registro`: crea una cuenta de cliente (nombre, email, password de 8 a 72 caracteres) y devuelve `{ token, usuario }`
- `POST /api/auth/login`: devuelve `{ token, usuario }`. Si el correo no existe responde 404 con `codigo: 'CORREO_NO_REGISTRADO'` (decisión de negocio: el cliente ofrece crear la cuenta); contraseña errónea, 401. Tras 10 fallos por IP y correo (también correos inexistentes) bloquea 15 minutos (en memoria)
- `GET /api/auth/yo`: usuario de la sesión actual (requiere `Authorization: Bearer <token>`)

## Modelo de datos

- `categorias` (id, nombre)
- `productos` (id, nombre, descripcion, precio, categoria_id, imagen_url, tipo: `estandar` | `personalizado`)
- `variantes` (id, producto_id, corte, talla, color, stock, sku, precio)
- `usuarios` (id, nombre, email, password_hash, rol: `admin` | `cliente`)
- `pedidos` (id, usuario_id, estado, total, fecha)
- `pedido_items` (id, pedido_id, variante_id, cantidad, precio_unitario)
- `solicitudes_personalizado` (id, nombre, telefono, producto_id, corte, talla, color, cantidad, diseno: `propio` | `crear`, comentario, estado: `pendiente` | `contactado` | `cerrado`, fecha)

Reglas:

- El stock pertenece a la **variante** (corte × talla × color), no al producto.
- `variantes.corte` es opcional (las camisetas tienen Estándar, Semi-oversize y Oversize; los hoodies no tienen corte).
- `variantes.precio` es opcional: si se indica, sustituye a `productos.precio`, que actúa como precio base ("desde").
- `pedido_items.precio_unitario` guarda el precio del momento de la compra.
- Los precios están en **pesos colombianos (COP)**, sin decimales en pantalla (`$ 45.000`).
- Las operaciones que descuentan stock deben ir en una transacción.
- Los productos `personalizado` no tienen variantes ni van al carrito: su página (`/personalizado`) ofrece las opciones de las prendas `estandar` y crea una solicitud para que All Style contacte al cliente por WhatsApp (descuentos desde 6 unidades, diseño propio o creado por All Style).
- Las solicitudes guardan datos personales: exigen la autorización del cliente (Ley 1581 de 2012) y no se exponen en ningún endpoint público.

## Notas

- Angular 22 usa standalone components.
- Los componentes deben usar `inject()` en lugar de constructor injection.
- En Angular 22 se busca usar signals para estado reactivo (por ejemplo, el carrito).
- Sesión: JWT firmado con `JWT_SECRET` (7 días), guardado en el navegador (`localStorage`, clave `all-style:sesion`) y añadido a las llamadas a `/api/` por `authInterceptor`. En el servidor, `middleware/auth.js` ofrece `autenticar` y `requerirRol('admin')` para proteger rutas.
- Las cuentas nuevas son siempre `cliente`; un `admin` se asigna a mano en la base de datos.
- El carrito (`CarritoService`) vive en el navegador (`localStorage`, clave `all-style:carrito`) y guarda por línea el `variante_id`, el precio y el stock del momento en que se añadió. Al crear un pedido, el servidor debe volver a comprobar precio y stock.

## Flujo de Commits y Git

- Cuando el usuario escriba **`/git-commit`** o diga **"estoy listo para hacer commit y push"**, el asistente debe seguir la skill [`.claude/skills/git-commit/SKILL.md`](.claude/skills/git-commit/SKILL.md):
  - Analizar los ficheros que están en los cambios (`changes` / git status).
  - Generar un plan de commits para subir los cambios de manera ordenada utilizando **Conventional Commits**.
  - Entregar **únicamente el plan en el chat** con los comandos exactos (`git add` y `git commit -m "..."`).
  - **No ejecutar commits ni pushes directamente**: el usuario realiza los commits manualmente.
