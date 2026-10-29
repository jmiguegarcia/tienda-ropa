import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { describirVariante } from '../productos/seleccion-variante';
import { CarritoService } from './carrito.service';

@Component({
  selector: 'app-carrito',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class Carrito {
  protected readonly carrito = inject(CarritoService);
  protected readonly detalle = describirVariante;
}
