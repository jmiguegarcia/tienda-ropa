import { Routes } from '@angular/router';
import { Entrar } from './auth/entrar';
import { invitadoGuard } from './auth/invitado.guard';
import { Registro } from './auth/registro';
import { Carrito } from './carrito/carrito';
import { Catalogo } from './catalogo/catalogo';
import { FichaProducto } from './ficha-producto/ficha-producto';
import { Personalizado } from './personalizado/personalizado';

export const routes: Routes = [
  { path: '', component: Catalogo, title: 'All Style' },
  { path: 'producto/:id', component: FichaProducto, title: 'Producto · All Style' },
  { path: 'carrito', component: Carrito, title: 'Carrito · All Style' },
  { path: 'personalizado', component: Personalizado, title: 'Personalizado · All Style' },
  { path: 'entrar', component: Entrar, canActivate: [invitadoGuard], title: 'Entrar · All Style' },
  {
    path: 'registro',
    component: Registro,
    canActivate: [invitadoGuard],
    title: 'Crear cuenta · All Style',
  },
  { path: '**', redirectTo: '' },
];
