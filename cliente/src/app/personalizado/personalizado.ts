import { CurrencyPipe } from '@angular/common';
import { Component, computed, ElementRef, inject, linkedSignal, signal, viewChild } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ProductosService } from '../productos/productos.service';
import {
  describirVariante,
  muestraDeColor,
  seleccionDeVariantes,
} from '../productos/seleccion-variante';
import { SolicitudesService } from './solicitudes.service';

const PREFIJOS = [
  { codigo: '+57', pais: 'CO', nombre: 'Colombia' },
  { codigo: '+1', pais: 'US', nombre: 'Estados Unidos' },
  { codigo: '+52', pais: 'MX', nombre: 'México' },
  { codigo: '+593', pais: 'EC', nombre: 'Ecuador' },
  { codigo: '+51', pais: 'PE', nombre: 'Perú' },
  { codigo: '+58', pais: 'VE', nombre: 'Venezuela' },
  { codigo: '+34', pais: 'ES', nombre: 'España' },
];

const soloDigitos = (valor: string) => valor.replace(/\D/g, '');

// 3001234567 -> 300 123 4567 (formato de celular colombiano)
const formatearNumero = (prefijo: string, numero: string) =>
  prefijo === '+57' ? numero.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3') : numero;

// En Colombia solo celulares (10 dígitos empezando por 3), que es donde llega WhatsApp
const telefonoValido: ValidatorFn = (grupo) => {
  const prefijo = grupo.get('prefijo')?.value;
  const numero = soloDigitos(grupo.get('telefono')?.value ?? '');
  if (!numero) {
    return null;
  }
  const valido = prefijo === '+57' ? /^3\d{9}$/.test(numero) : /^\d{6,14}$/.test(numero);
  return valido ? null : { telefono: true };
};

@Component({
  selector: 'app-personalizado',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './personalizado.html',
  styleUrls: ['../ficha-producto/ficha-producto.css', './personalizado.css'],
})
export class Personalizado {
  private readonly productosService = inject(ProductosService);
  private readonly solicitudes = inject(SolicitudesService);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  protected readonly prefijos = PREFIJOS;
  protected readonly muestra = muestraDeColor;

  // Las opciones salen de las prendas que se venden normalmente (camiseta, hoodie...)
  protected readonly prendas = rxResource({
    stream: () =>
      this.productosService
        .listarProductos()
        .pipe(map((productos) => productos.filter((p) => p.tipo === 'estandar'))),
    defaultValue: [],
  });

  protected readonly prendaId = linkedSignal(() => this.prendas.value()[0]?.id ?? null);

  protected readonly prenda = rxResource({
    params: () => {
      const id = this.prendaId();
      return id === null ? undefined : { id };
    },
    stream: ({ params }) => this.productosService.obtenerProducto(params.id),
  });

  private readonly seleccion = seleccionDeVariantes(
    computed(() => this.prenda.value()?.variantes ?? []),
  );

  protected readonly cortes = this.seleccion.cortes;
  protected readonly tallas = this.seleccion.tallas;
  protected readonly colores = this.seleccion.colores;
  protected readonly corte = this.seleccion.corte;
  protected readonly talla = this.seleccion.talla;
  protected readonly color = this.seleccion.color;
  protected readonly variante = this.seleccion.variante;
  protected readonly precioBase = this.seleccion.precio;

  protected readonly resumen = computed(() => {
    const prenda = this.prenda.value();
    const variante = this.variante();
    return prenda && variante ? `${prenda.nombre} · ${describirVariante(variante)}` : '';
  });

  protected readonly formulario = inject(NonNullableFormBuilder).group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      prefijo: ['+57'],
      telefono: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1), Validators.max(1000)]],
      diseno: ['' as 'propio' | 'crear' | '', Validators.required],
      comentario: ['', Validators.maxLength(500)],
      autorizacion: [false, Validators.requiredTrue],
    },
    { validators: telefonoValido },
  );

  protected readonly cantidad = toSignal(this.formulario.controls.cantidad.valueChanges, {
    initialValue: 1,
  });

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  // Teléfono al que se escribirá, para la confirmación
  protected readonly enviadaA = signal<string | null>(null);

  protected abrir() {
    this.enviadaA.set(null);
    this.error.set(null);
    this.dialogo().nativeElement.showModal();
  }

  protected cerrar() {
    this.dialogo().nativeElement.close();
  }

  protected campoInvalido(campo: 'nombre' | 'cantidad' | 'diseno' | 'autorizacion') {
    const control = this.formulario.controls[campo];
    return control.invalid && control.touched;
  }

  protected telefonoInvalido() {
    const control = this.formulario.controls.telefono;
    return control.touched && (control.invalid || this.formulario.hasError('telefono'));
  }

  protected enviar() {
    const prenda = this.prenda.value();
    const variante = this.variante();
    if (this.formulario.invalid || !prenda || !variante) {
      this.formulario.markAllAsTouched();
      return;
    }

    const datos = this.formulario.getRawValue();
    const numero = soloDigitos(datos.telefono);
    this.enviando.set(true);
    this.error.set(null);

    this.solicitudes
      .crear({
        nombre: datos.nombre.trim(),
        telefono: datos.prefijo + numero,
        producto_id: prenda.id,
        corte: variante.corte,
        talla: variante.talla,
        color: variante.color,
        cantidad: datos.cantidad,
        diseno: datos.diseno as 'propio' | 'crear',
        comentario: datos.comentario.trim(),
        autorizacion: datos.autorizacion,
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.enviadaA.set(`${datos.prefijo} ${formatearNumero(datos.prefijo, numero)}`);
          this.formulario.reset();
        },
        error: () => {
          this.enviando.set(false);
          this.error.set('No pudimos enviar tu solicitud. Inténtalo de nuevo en unos minutos.');
        },
      });
  }
}
