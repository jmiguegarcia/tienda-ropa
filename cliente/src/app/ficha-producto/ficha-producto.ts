import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, numberAttribute } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ProductosService } from '../productos/productos.service';

// Color de la muestra para cada nombre de color
const MUESTRAS: Record<string, string> = {
  Blanco: '#ffffff',
  Negro: '#111111',
};

const unicos = <T>(valores: T[]) => [...new Set(valores)];

@Component({
  selector: 'app-ficha-producto',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './ficha-producto.html',
  styleUrl: './ficha-producto.css',
})
export class FichaProducto {
  private readonly productosService = inject(ProductosService);

  // Se rellena desde la ruta producto/:id gracias a withComponentInputBinding()
  readonly id = input.required({ transform: numberAttribute });

  protected readonly producto = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.productosService.obtenerProducto(params.id),
  });

  private readonly variantes = computed(() => this.producto.value()?.variantes ?? []);

  protected readonly cortes = computed(() =>
    unicos(this.variantes().flatMap((v) => (v.corte ? [v.corte] : []))),
  );
  protected readonly tallas = computed(() => unicos(this.variantes().map((v) => v.talla)));
  protected readonly colores = computed(() => unicos(this.variantes().map((v) => v.color)));

  // La selección se reinicia al cargar otro producto; la talla la elige siempre el cliente
  protected readonly corte = linkedSignal(() => this.cortes()[0] ?? null);
  protected readonly color = linkedSignal(() => this.colores()[0] ?? null);
  protected readonly talla = linkedSignal<unknown, string | null>({
    source: this.variantes,
    computation: () => null,
  });

  private readonly delCorteYColor = computed(() =>
    this.variantes().filter((v) => v.corte === this.corte() && v.color === this.color()),
  );

  protected readonly variante = computed(() =>
    this.delCorteYColor().find((v) => v.talla === this.talla()),
  );

  // El precio depende del corte, no de la talla ni del color
  protected readonly precio = computed(
    () => this.delCorteYColor()[0]?.precio ?? this.producto.value()?.precio ?? 0,
  );

  protected readonly puedeAnadir = computed(() => (this.variante()?.stock ?? 0) > 0);

  protected readonly aviso = linkedSignal<unknown, string | null>({
    source: this.variante,
    computation: () => null,
  });

  protected agotada(talla: string) {
    const variante = this.delCorteYColor().find((v) => v.talla === talla);
    return !variante || variante.stock === 0;
  }

  protected muestra(color: string) {
    return MUESTRAS[color] ?? 'var(--borde)';
  }

  protected anadirAlCarrito() {
    // TODO: conectar con el carrito cuando exista
    this.aviso.set('El carrito estará disponible muy pronto.');
  }
}
