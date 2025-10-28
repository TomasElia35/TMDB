  import { Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';
import { AuthCallbackComponent } from './pages/auth-callback/auth-callback.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { FavoritesPageComponent } from './pages/favorites-page/favorites-page.component'; // ¡NUEVO!
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Rutas Públicas
  { 
    path: 'login', 
    component: LoginComponent 
  },
  { 
    path: 'auth-callback', 
    component: AuthCallbackComponent 
  },

  // Rutas Privadas (Protegidas)
  {
    path: 'home', // Catálogo
    component: LandingPageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'favorites', // ¡NUEVO!
    component: FavoritesPageComponent,
    canActivate: [authGuard]
  },

  // Redirecciones
  { 
    path: '',
    redirectTo: '/home', // El guard se encargará
    pathMatch: 'full' 
  },
  { 
    path: '**',
    redirectTo: '/home' // El guard se encargará
  }
];