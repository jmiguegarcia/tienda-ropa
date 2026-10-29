import { Routes } from '@angular/router';
import { Catalogo } from './catalogo/catalogo';

export const routes: Routes = [
  { path: '', component: Catalogo, title: 'Tienda Ropa' },
  { path: '**', redirectTo: '' },
];
