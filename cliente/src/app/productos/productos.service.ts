import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Categoria, Producto, ProductoDetalle, Variante } from './producto';

// PostgreSQL devuelve las columnas NUMERIC como texto
type ConPreciosTexto<T, K extends keyof T> = Omit<T, K> & Record<K, string>;
type ProductoApi = ConPreciosTexto<Producto, 'precio' | 'precio_min' | 'precio_max'>;
type VarianteApi = ConPreciosTexto<Variante, 'precio'>;
type ProductoDetalleApi = ConPreciosTexto<Omit<ProductoDetalle, 'variantes'>, 'precio'> & {
  variantes: VarianteApi[];
};

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private readonly http = inject(HttpClient);

  listarProductos(categoriaId?: number): Observable<Producto[]> {
    const params = categoriaId ? new HttpParams().set('categoria', categoriaId) : undefined;
    return this.http.get<ProductoApi[]>('/api/productos', { params }).pipe(
      map((productos) =>
        productos.map((p) => ({
          ...p,
          precio: Number(p.precio),
          precio_min: Number(p.precio_min),
          precio_max: Number(p.precio_max),
        })),
      ),
    );
  }

  obtenerProducto(id: number): Observable<ProductoDetalle> {
    return this.http.get<ProductoDetalleApi>(`/api/productos/${id}`).pipe(
      map((p) => ({
        ...p,
        precio: Number(p.precio),
        variantes: p.variantes.map((v) => ({ ...v, precio: Number(v.precio) })),
      })),
    );
  }

  listarCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>('/api/categorias');
  }
}
