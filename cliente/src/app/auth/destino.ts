import { HttpErrorResponse } from '@angular/common/http';

// Solo rutas internas: evita que ?volver=https://otro-sitio lleve fuera de la tienda
export const destinoSeguro = (volver: string | undefined) =>
  volver && volver.startsWith('/') && !volver.startsWith('//') ? volver : '/';

// Mensaje del servidor si lo hay; si no (servidor caído, red...), el genérico
export function mensajeDeError(err: unknown, generico: string) {
  const mensaje = err instanceof HttpErrorResponse ? err.error?.error : null;
  return err instanceof HttpErrorResponse && err.status >= 400 && err.status < 500 && mensaje
    ? mensaje
    : generico;
}
