import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, input, linkedSignal, numberAttribute } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../carrito/carrito.service';
import { ProductosService } from '../productos/productos.service';
import { muestraDeColor, seleccionDeVariantes } from '../productos/seleccion-variante';

@Component({
  selector: 'app-ficha-producto',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './ficha-producto.html',
  styleUrl: './ficha-producto.css',
})
export class FichaProducto {
  private readonly productosService = inject(ProductosService);
  private readonly carrito = inject(CarritoService);
  private readonly router = inject(Router);

  // Se rellena desde la ruta producto/:id gracias a withComponentInputBinding()
  readonly id = input.required({ transform: numberAttribute });

  protected readonly producto = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.productosService.obtenerProducto(params.id),
  });

  private readonly seleccion = seleccionDeVariantes(
    computed(() => this.producto.value()?.variantes ?? []),
  );

  protected readonly cortes = this.seleccion.cortes;
  protected readonly tallas = this.seleccion.tallas;
  protected readonly colores = this.seleccion.colores;
  protected readonly corte = this.seleccion.corte;
  protected readonly talla = this.seleccion.talla;
  protected readonly color = this.seleccion.color;
  protected readonly variante = this.seleccion.variante;
  protected readonly agotada = this.seleccion.agotada;
  protected readonly muestra = muestraDeColor;

  protected readonly precio = computed(
    () => this.seleccion.precio() ?? this.producto.value()?.precio ?? 0,
  );

  protected readonly puedeAnadir = computed(() => (this.variante()?.stock ?? 0) > 0);

  protected readonly aviso = linkedSignal<unknown, string | null>({
    source: this.variante,
    computation: () => null,
  });

  constructor() {
    // El producto personalizado tiene su propia página
    effect(() => {
      if (this.producto.value()?.tipo === 'personalizado') {
        this.router.navigate(['/personalizado'], { replaceUrl: true });
      }
    });
  }

  protected anadirAlCarrito() {
    const producto = this.producto.value();
    const variante = this.variante();
    if (!producto || !variante) {
      return;
    }
    this.aviso.set(
      this.carrito.anadir(producto, variante)
        ? 'Añadido al carrito.'
        : 'Ya tienes en el carrito todas las unidades disponibles.',
    );
  }
}
