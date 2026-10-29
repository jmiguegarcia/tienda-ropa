export interface Categoria {
  id: number;
  nombre: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria_id: number | null;
  categoria: string | null;
  imagen_url: string | null;
}
