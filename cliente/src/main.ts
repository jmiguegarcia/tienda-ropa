import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Formato colombiano para precios ($ 45.000)
registerLocaleData(localeEsCo);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
