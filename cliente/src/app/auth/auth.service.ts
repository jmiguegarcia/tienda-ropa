import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'cliente';
}

interface Sesion {
  token: string;
  usuario: Usuario;
}

const CLAVE = 'all-style:sesion';

function leerGuardada(): Sesion | null {
  try {
    const guardada = JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
    return guardada?.token && guardada?.usuario ? guardada : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sesion = signal<Sesion | null>(leerGuardada());

  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly token = computed(() => this.sesion()?.token ?? null);
  readonly conectado = computed(() => this.sesion() !== null);

  constructor() {
    // Comprueba que la sesión guardada siga siendo válida (puede haber caducado)
    if (this.token()) {
      this.http.get<Usuario>('/api/auth/yo').subscribe({
        next: (usuario) => this.guardar({ token: this.token()!, usuario }),
        error: (err) => {
          if (err.status === 401) {
            this.cerrarSesion();
          }
        },
      });
    }
  }

  registrar(datos: { nombre: string; email: string; password: string }): Observable<Sesion> {
    return this.http.post<Sesion>('/api/auth/registro', datos).pipe(tap((s) => this.guardar(s)));
  }

  iniciarSesion(datos: { email: string; password: string }): Observable<Sesion> {
    return this.http.post<Sesion>('/api/auth/login', datos).pipe(tap((s) => this.guardar(s)));
  }

  cerrarSesion() {
    this.sesion.set(null);
    try {
      localStorage.removeItem(CLAVE);
    } catch {
      // Sin almacenamiento disponible: la sesión ya no está en memoria
    }
  }

  private guardar(sesion: Sesion) {
    this.sesion.set(sesion);
    try {
      localStorage.setItem(CLAVE, JSON.stringify(sesion));
    } catch {
      // Sin almacenamiento: la sesión dura lo que la pestaña
    }
  }
}
