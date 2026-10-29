import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { destinoSeguro, mensajeDeError } from './destino';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './formulario-auth.css',
})
export class Registro implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly location = inject(Location);

  readonly volver = input<string>();

  // Mismos límites que el servidor (bcrypt solo usa los primeros 72 caracteres)
  protected readonly formulario = inject(NonNullableFormBuilder).group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });

  protected readonly verPassword = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly emailEnUso = signal(false);

  ngOnInit() {
    // Correo que "Entrar" pasa en el estado de la navegación cuando no tiene cuenta
    const email = (this.location.getState() as { email?: unknown } | null)?.email;
    if (typeof email === 'string') {
      this.formulario.controls.email.setValue(email);
    }
  }

  protected invalido(campo: 'nombre' | 'email' | 'password') {
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
    this.emailEnUso.set(false);

    const datos = this.formulario.getRawValue();
    this.auth.registrar({ ...datos, nombre: datos.nombre.trim() }).subscribe({
      next: () => this.router.navigateByUrl(destinoSeguro(this.volver())),
      error: (err) => {
        this.enviando.set(false);
        if (err instanceof HttpErrorResponse && err.status === 409) {
          this.emailEnUso.set(true);
          return;
        }
        this.error.set(mensajeDeError(err, 'No pudimos crear tu cuenta. Inténtalo de nuevo.'));
      },
    });
  }
}
