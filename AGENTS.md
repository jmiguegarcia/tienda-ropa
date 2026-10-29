# Tienda Ropa

Tienda online de camisetas y ropa en general.

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

- `GET /api/productos`: lista productos (filtro opcional `?categoria=<id>`)
- `GET /api/productos/:id`: obtiene un producto con sus variantes

## Modelo de datos

- `categorias` (id, nombre)
- `productos` (id, nombre, descripcion, precio, categoria_id, imagen_url)
- `variantes` (id, producto_id, talla, color, stock, sku)
- `usuarios` (id, nombre, email, password_hash, rol: `admin` | `cliente`)
- `pedidos` (id, usuario_id, estado, total, fecha)
- `pedido_items` (id, pedido_id, variante_id, cantidad, precio_unitario)

Reglas:

- El stock pertenece a la **variante** (talla × color), no al producto.
- `pedido_items.precio_unitario` guarda el precio del momento de la compra.
- Las operaciones que descuentan stock deben ir en una transacción.

## Notas

- Angular 22 usa standalone components.
- Los componentes deben usar `inject()` en lugar de constructor injection.
- En Angular 22 se busca usar signals para estado reactivo (por ejemplo, el carrito).

## Flujo de Commits y Git

- Cuando el usuario diga **"estoy listo para hacer commit y push"**, el asistente debe:
  - Analizar los ficheros que están en los cambios (`changes` / git status).
  - Generar un plan de commits para subir los cambios de manera ordenada utilizando **Conventional Commits**.
  - Entregar **únicamente el plan en el chat** con los comandos exactos (`git add` y `git commit -m "..."`).
  - **No ejecutar commits ni pushes directamente**: el usuario realiza los commits manualmente.
