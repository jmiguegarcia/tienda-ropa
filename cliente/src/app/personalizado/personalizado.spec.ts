import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Personalizado } from './personalizado';

registerLocaleData(localeEsCo);

const productos = [
  { id: 1, nombre: 'Camiseta', tipo: 'estandar', precio: '45000', precio_min: '45000', precio_max: '60000' },
  { id: 3, nombre: 'Personalizado', tipo: 'personalizado', precio: '0', precio_min: '0', precio_max: '0' },
];

const camiseta = {
  id: 1,
  nombre: 'Camiseta',
  descripcion: '',
  precio: '45000.00',
  tipo: 'estandar',
  variantes: [
    { id: 1, corte: 'Estándar', talla: 'M', color: 'Negro', stock: 10, sku: 'A', precio: '45000.00' },
    { id: 2, corte: 'Oversize', talla: 'M', color: 'Negro', stock: 0, sku: 'B', precio: '60000.00' },
  ],
};

describe('Personalizado', () => {
  let http: HttpTestingController;
  let el: HTMLElement;
  let componente: Personalizado;

  // Los diálogos nativos no existen en jsdom
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.open = false;
    };
  });

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [Personalizado],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'es-CO' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Personalizado);
    componente = fixture.componentInstance;
    fixture.detectChanges();
    // whenStable espera a que no haya peticiones pendientes: se responde a las dos antes.
    // La de la prenda sale cuando el resource reacciona a la lista (un ciclo más tarde).
    http.expectOne('/api/productos').flush(productos);
    TestBed.tick();
    await new Promise((resolver) => setTimeout(resolver));
    TestBed.tick();
    http.expectOne('/api/productos/1').flush(camiseta);
    await fixture.whenStable();
    el = fixture.nativeElement;
  });

  const boton = (texto: string) =>
    [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === texto)!;

  const formulario = () =>
    (componente as unknown as { formulario: Personalizado['formulario'] }).formulario;

  it('solo ofrece prendas estándar y no bloquea tallas sin stock', () => {
    const prendas = [...el.querySelectorAll('fieldset')][0].textContent;
    expect(prendas).toContain('Camiseta');
    expect(prendas).not.toContain('Personalizado');

    boton('Oversize').click();
    TestBed.tick();
    expect(boton('M').disabled).toBe(false);
  });

  it('exige un celular colombiano válido con +57', () => {
    const form = formulario();
    form.patchValue({ telefono: '1234567' });
    expect(form.hasError('telefono')).toBe(true);

    form.patchValue({ telefono: '300 123 4567' });
    expect(form.hasError('telefono')).toBe(false);
  });

  it('envía la solicitud con el teléfono en formato internacional', () => {
    boton('M').click();
    TestBed.tick();
    boton('Solicitar personalizado').click();

    formulario().setValue({
      nombre: 'Ana',
      prefijo: '+57',
      telefono: '300 123 4567',
      cantidad: 12,
      diseno: 'crear',
      comentario: '',
      autorizacion: true,
    });
    el.querySelector('form')!.dispatchEvent(new Event('submit'));

    const peticion = http.expectOne('/api/solicitudes');
    expect(peticion.request.body).toMatchObject({
      nombre: 'Ana',
      telefono: '+573001234567',
      producto_id: 1,
      corte: 'Estándar',
      talla: 'M',
      color: 'Negro',
      cantidad: 12,
      diseno: 'crear',
    });
    peticion.flush({ id: 1 }, { status: 201, statusText: 'Created' });
    TestBed.tick();
    expect(el.querySelector('.confirmacion')?.textContent).toContain('+57 300 123 4567');
  });
});
