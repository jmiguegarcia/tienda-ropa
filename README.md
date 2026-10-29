# Tienda Ropa

Tienda online de camisetas y ropa en general.

- **`cliente/`**: Angular 22, en `http://localhost:4200`
- **`servidor/`**: API REST con Node.js, Express 5 y PostgreSQL, en `http://localhost:3000`

## Requisitos

- Node.js 24+ y npm 11+
- PostgreSQL

## Puesta en marcha

### 1. Base de datos

```sql
CREATE DATABASE tienda_ropa;
```

Las tablas y un catálogo de prueba se crean automáticamente al arrancar el servidor.

### 2. Servidor

```bash
cd servidor
npm install
cp .env.example .env   # completa JWT_SECRET y DB_PASSWORD
npm start
```

Comprueba que responde en `http://localhost:3000/api/productos`.

### 3. Cliente

```bash
cd cliente
npm install
npm start
```

Abre `http://localhost:4200`.

## API

| Método | Ruta                  | Descripción                                        |
| ------ | --------------------- | -------------------------------------------------- |
| GET    | `/api/productos`      | Lista productos (filtro opcional `?categoria=<id>`) |
| GET    | `/api/productos/:id`  | Producto con sus variantes (talla, color, stock)   |
| GET    | `/api/categorias`     | Lista de categorías                                |

## Hoja de ruta

- [ ] **Fase 1**: catálogo con filtros, ficha de producto, carrito, registro e inicio de sesión
- [ ] **Fase 2**: checkout, pedidos con estados, pagos con Stripe (modo de prueba), historial
- [ ] **Fase 3**: panel de administración (productos, stock, pedidos, imágenes)
