import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Este Guard protege las rutas que requieren autenticación.
 * Si el usuario no está logueado, lo redirige a la página de login.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    // Si está logueado, permite el acceso
    return true; 
  } else {
    // Si no, redirige a la página de login
    return router.parseUrl('/login');
  }
};