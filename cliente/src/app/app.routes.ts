import { Routes } from '@angular/router';
import { Carrito } from './carrito/carrito';
import { Catalogo } from './catalogo/catalogo';
import { FichaProducto } from './ficha-producto/ficha-producto';
import { Personalizado } from './personalizado/personalizado';

export const routes: Routes = [
  { path: '', component: Catalogo, title: 'All Style' },
  { path: 'producto/:id', component: FichaProducto, title: 'Producto · All Style' },
  { path: 'carrito', component: Carrito, title: 'Carrito · All Style' },
  { path: 'personalizado', component: Personalizado, title: 'Personalizado · All Style' },
  { path: '**', redirectTo: '' },
];
