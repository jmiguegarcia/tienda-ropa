import { computed, effect, Injectable, signal } from '@angular/core';
import { Variante } from '../productos/producto';

export interface LineaCarrito {
  varianteId: number;
  productoId: number;
  nombre: string;
  corte: string | null;
  talla: string;
  color: string;
  precio: number;
  // Stock al añadirlo; el servidor lo volverá a comprobar al hacer el pedido
  stock: number;
  cantidad: number;
}

const CLAVE = 'all-style:carrito';

function leerGuardado(): LineaCarrito[] {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
    return Array.isArray(guardado) ? guardado : [];
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly estado = signal<LineaCarrito[]>(leerGuardado());

  readonly lineas = this.estado.asReadonly();
  readonly unidades = computed(() => this.estado().reduce((suma, l) => suma + l.cantidad, 0));
  readonly total = computed(() =>
    this.estado().reduce((suma, l) => suma + l.precio * l.cantidad, 0),
  );

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(CLAVE, JSON.stringify(this.estado()));
      } catch {
        // Sin almacenamiento (modo privado, bloqueado...): el carrito dura lo que la pestaña
      }
    });
  }

  /** Añade una unidad de la variante. Devuelve false si ya no queda stock para añadir más. */
  anadir(producto: { id: number; nombre: string }, variante: Variante): boolean {
    const existente = this.estado().find((l) => l.varianteId === variante.id);
    if (existente) {
      if (existente.cantidad >= variante.stock) {
        return false;
      }
      this.cambiarCantidad(variante.id, existente.cantidad + 1);
      return true;
    }

    if (variante.stock < 1) {
      return false;
    }
    this.estado.update((lineas) => [
      ...lineas,
      {
        varianteId: variante.id,
        productoId: producto.id,
        nombre: producto.nombre,
        corte: variante.corte,
        talla: variante.talla,
        color: variante.color,
        precio: variante.precio,
        stock: variante.stock,
        cantidad: 1,
      },
    ]);
    return true;
  }

  cambiarCantidad(varianteId: number, cantidad: number) {
    if (cantidad < 1) {
      this.quitar(varianteId);
      return;
    }
    this.estado.update((lineas) =>
      lineas.map((l) =>
        l.varianteId === varianteId ? { ...l, cantidad: Math.min(cantidad, l.stock) } : l,
      ),
    );
  }

  quitar(varianteId: number) {
    this.estado.update((lineas) => lineas.filter((l) => l.varianteId !== varianteId));
  }

  vaciar() {
    this.estado.set([]);
  }
}
