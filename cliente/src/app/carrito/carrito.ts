import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarritoService, LineaCarrito } from './carrito.service';

@Component({
  selector: 'app-carrito',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class Carrito {
  protected readonly carrito = inject(CarritoService);

  protected detalle(linea: LineaCarrito) {
    return [linea.corte, `Talla ${linea.talla}`, linea.color].filter(Boolean).join(' · ');
  }
}
