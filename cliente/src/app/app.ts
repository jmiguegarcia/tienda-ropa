import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { CarritoService } from './carrito/carrito.service';

@Component({
  imports: [RouterLink, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  protected readonly carrito = inject(CarritoService);
  protected readonly auth = inject(AuthService);

  // Para volver a la misma página después de entrar (salvo si ya estás en entrar/registro)
  protected readonly urlActual = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      map((url) => (url.startsWith('/entrar') || url.startsWith('/registro') ? undefined : url)),
    ),
  );

  protected primerNombre(nombre: string) {
    return nombre.split(' ')[0];
  }

  protected salir() {
    this.auth.cerrarSesion();
    this.router.navigateByUrl('/');
  }
}
