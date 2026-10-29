import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Las páginas de entrar y registro no tienen sentido con la sesión ya iniciada
export const invitadoGuard: CanActivateFn = () =>
  inject(AuthService).conectado() ? inject(Router).createUrlTree(['/']) : true;
