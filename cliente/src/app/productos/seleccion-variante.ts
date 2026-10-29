import { computed, linkedSignal, Signal } from '@angular/core';
import { Variante } from './producto';

const unicos = <T>(valores: T[]) => [...new Set(valores)];

/**
 * Estado de la elección de corte, talla y color sobre las variantes de un producto.
 * Al cambiar de producto se reinicia: corte y color al primero, talla sin elegir.
 */
export function seleccionDeVariantes(variantes: Signal<Variante[]>) {
  const cortes = computed(() => unicos(variantes().flatMap((v) => (v.corte ? [v.corte] : []))));
  const tallas = computed(() => unicos(variantes().map((v) => v.talla)));
  const colores = computed(() => unicos(variantes().map((v) => v.color)));

  const corte = linkedSignal(() => cortes()[0] ?? null);
  const color = linkedSignal(() => colores()[0] ?? null);
  const talla = linkedSignal<unknown, string | null>({ source: variantes, computation: () => null });

  const delCorteYColor = computed(() =>
    variantes().filter((v) => v.corte === corte() && v.color === color()),
  );
  const variante = computed(() => delCorteYColor().find((v) => v.talla === talla()));

  // El precio depende del corte, no de la talla ni del color
  const precio = computed(() => delCorteYColor()[0]?.precio ?? null);

  const agotada = (t: string) => {
    const encontrada = delCorteYColor().find((v) => v.talla === t);
    return !encontrada || encontrada.stock === 0;
  };

  return { cortes, tallas, colores, corte, color, talla, variante, precio, agotada };
}

// Color de la muestra para cada nombre de color
const MUESTRAS: Record<string, string> = {
  Blanco: '#ffffff',
  Negro: '#111111',
};

export const muestraDeColor = (color: string) => MUESTRAS[color] ?? 'var(--borde)';

export const describirVariante = (v: Pick<Variante, 'corte' | 'talla' | 'color'>) =>
  [v.corte, `Talla ${v.talla}`, v.color].filter(Boolean).join(' · ');
