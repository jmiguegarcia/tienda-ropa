import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { destinoSeguro, mensajeDeError } from './destino';

@Component({
  selector: 'app-entrar',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './entrar.html',
  styleUrl: './formulario-auth.css',
})
export class Entrar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // ?volver=/carrito para regresar a donde estaba el cliente
  readonly volver = input<string>();

  protected readonly formulario = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly verPassword = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  // Correo que no tiene cuenta, para ofrecer el registro con él ya escrito
  protected readonly sinCuenta = signal<string | null>(null);

  protected invalido(campo: 'email' | 'password') {
    const control = this.formulario.controls[campo];
    return control.invalid && control.touched;
  }

  protected enviar() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.sinCuenta.set(null);

    const datos = this.formulario.getRawValue();
    this.auth.iniciarSesion(datos).subscribe({
      next: () => this.router.navigateByUrl(destinoSeguro(this.volver())),
      error: (err) => {
        this.enviando.set(false);
        if (err instanceof HttpErrorResponse && err.error?.codigo === 'CORREO_NO_REGISTRADO') {
          this.sinCuenta.set(datos.email.trim());
          return;
        }
        this.error.set(mensajeDeError(err, 'No pudimos iniciar sesión. Inténtalo de nuevo.'));
      },
    });
  }
}
