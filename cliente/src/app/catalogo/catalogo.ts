import { CurrencyPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ProductosService } from '../productos/productos.service';

@Component({
  selector: 'app-catalogo',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo {
  private readonly productosService = inject(ProductosService);

  // Se rellena desde ?categoria=<id> gracias a withComponentInputBinding()
  readonly categoria = input(undefined, {
    transform: (valor: string | undefined) => (valor ? Number(valor) : undefined),
  });

  protected readonly categorias = rxResource({
    stream: () => this.productosService.listarCategorias(),
    defaultValue: [],
  });

  protected readonly productos = rxResource({
    params: () => ({ categoria: this.categoria() }),
    stream: ({ params }) => this.productosService.listarProductos(params.categoria),
    defaultValue: [],
  });
}
