export interface Categoria {
  id: number;
  nombre: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  // Rango de precios de sus variantes (iguales si todas cuestan lo mismo)
  precio_min: number;
  precio_max: number;
  categoria_id: number | null;
  categoria: string | null;
  imagen_url: string | null;
  // 'personalizado' no se compra por carrito: se solicita y se cotiza por WhatsApp
  tipo: 'estandar' | 'personalizado';
}

export interface Variante {
  id: number;
  corte: string | null;
  talla: string;
  color: string;
  stock: number;
  sku: string;
  precio: number;
}

export interface ProductoDetalle extends Omit<Producto, 'precio_min' | 'precio_max'> {
  variantes: Variante[];
}
