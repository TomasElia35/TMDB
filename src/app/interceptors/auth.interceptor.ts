import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

// ¡ELIMINAMOS! la inyección de AuthService
// import { inject } from '@angular/core';
// import { AuthService } from '../services/auth.service';

// ¡NUEVO! Importamos la clave directamente
import { SESSION_STORAGE_KEY } from '../services/auth.service';

/**
 * Interceptor para añadir API Key, idioma y Session ID (leyendo desde sessionStorage).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // ¡ELIMINAMOS! const authService = inject(AuthService);
  const apiKey = environment.tmdb.apiKey;

  // Añadimos api_key y language a todas las peticiones
  let params = req.params
    .append('api_key', apiKey)
    .append('language', 'es-ES');

  // ¡MODIFICADO! Leemos el session_id directamente de sessionStorage
  const sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);

  // Si el token existe y la URL es para la API de 'account', lo añadimos
  if (sessionId && req.url.includes('/account')) {
    params = params.append('session_id', sessionId);
  }

  const authorizedReq = req.clone({ params });

  return next(authorizedReq);
};