import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { FichaProducto } from './ficha-producto';

registerLocaleData(localeEsCo);

const variante = (id: number, corte: string, talla: string, color: string, precio: string, stock = 10) => ({
  id,
  corte,
  talla,
  color,
  precio,
  stock,
  sku: `SKU-${id}`,
});

const camiseta = {
  id: 1,
  nombre: 'Camiseta',
  descripcion: '',
  precio: '45000.00',
  categoria_id: 1,
  categoria: 'Camisetas',
  imagen_url: null,
  variantes: [
    variante(1, 'Estándar', 'S', 'Blanco', '45000.00'),
    variante(2, 'Estándar', 'M', 'Blanco', '45000.00', 0),
    variante(3, 'Oversize', 'S', 'Blanco', '60000.00'),
    variante(4, 'Oversize', 'M', 'Blanco', '60000.00'),
  ],
};

describe('FichaProducto', () => {
  async function crearFicha() {
    TestBed.configureTestingModule({
      imports: [FichaProducto],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'es-CO' },
      ],
    });
    const fixture = TestBed.createComponent(FichaProducto);
    fixture.componentRef.setInput('id', '1');
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/productos/1').flush(camiseta);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const boton = (el: HTMLElement, texto: string) =>
    [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === texto)!;

  it('cambia el precio según el corte elegido', async () => {
    const el = await crearFicha();
    expect(el.querySelector('.precio')?.textContent).toContain('45.000');

    boton(el, 'Oversize').click();
    TestBed.tick();
    expect(el.querySelector('.precio')?.textContent).toContain('60.000');
  });

  it('desactiva las tallas agotadas y exige elegir talla', async () => {
    const el = await crearFicha();
    expect(boton(el, 'M').disabled).toBe(true);
    expect(boton(el, 'Añadir al carrito').disabled).toBe(true);

    boton(el, 'S').click();
    TestBed.tick();
    expect(boton(el, 'Añadir al carrito').disabled).toBe(false);
  });
});
