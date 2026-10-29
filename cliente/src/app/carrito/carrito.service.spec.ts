import { TestBed } from '@angular/core/testing';
import { Variante } from '../productos/producto';
import { CarritoService } from './carrito.service';

const camiseta = { id: 1, nombre: 'Camiseta' };
const variante = (id: number, precio: number, stock: number): Variante => ({
  id,
  corte: 'Oversize',
  talla: 'M',
  color: 'Negro',
  precio,
  stock,
  sku: `SKU-${id}`,
});

describe('CarritoService', () => {
  let carrito: CarritoService;

  beforeEach(() => {
    localStorage.clear();
    carrito = TestBed.inject(CarritoService);
  });

  it('agrupa la misma variante en una línea y calcula el total', () => {
    carrito.anadir(camiseta, variante(1, 60000, 10));
    carrito.anadir(camiseta, variante(1, 60000, 10));
    carrito.anadir(camiseta, variante(2, 45000, 10));

    expect(carrito.lineas().length).toBe(2);
    expect(carrito.unidades()).toBe(3);
    expect(carrito.total()).toBe(165000);
  });

  it('no deja superar el stock', () => {
    expect(carrito.anadir(camiseta, variante(1, 60000, 1))).toBe(true);
    expect(carrito.anadir(camiseta, variante(1, 60000, 1))).toBe(false);

    carrito.cambiarCantidad(1, 5);
    expect(carrito.unidades()).toBe(1);
  });

  it('quita la línea al bajar la cantidad a cero', () => {
    carrito.anadir(camiseta, variante(1, 60000, 10));
    carrito.cambiarCantidad(1, 0);
    expect(carrito.lineas()).toEqual([]);
  });

  it('guarda el carrito en el navegador', () => {
    carrito.anadir(camiseta, variante(1, 60000, 10));
    TestBed.tick();
    expect(JSON.parse(localStorage.getItem('all-style:carrito')!)[0].varianteId).toBe(1);
  });
});
