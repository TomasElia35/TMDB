import { ApplicationConfig, importProvidersFrom } from '@angular/core'; // ¡importar!
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // ¡NUEVO!

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    importProvidersFrom(FormsModule) // ¡NUEVO! Importa FormsModule
  ]
};