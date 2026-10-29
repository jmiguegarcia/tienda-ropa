import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Categoria, Producto } from './producto';

// PostgreSQL devuelve las columnas NUMERIC como texto
type ProductoApi = Omit<Producto, 'precio'> & { precio: string };

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private readonly http = inject(HttpClient);

  listarProductos(categoriaId?: number): Observable<Producto[]> {
    const params = categoriaId ? new HttpParams().set('categoria', categoriaId) : undefined;
    return this.http
      .get<ProductoApi[]>('/api/productos', { params })
      .pipe(map((productos) => productos.map((p) => ({ ...p, precio: Number(p.precio) }))));
  }

  listarCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>('/api/categorias');
  }
}
