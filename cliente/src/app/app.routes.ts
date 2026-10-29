import { Routes } from '@angular/router';
import { Catalogo } from './catalogo/catalogo';
import { FichaProducto } from './ficha-producto/ficha-producto';

export const routes: Routes = [
  { path: '', component: Catalogo, title: 'All Style' },
  { path: 'producto/:id', component: FichaProducto, title: 'Producto · All Style' },
  { path: '**', redirectTo: '' },
];
