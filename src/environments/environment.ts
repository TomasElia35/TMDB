/**
 * Configuración del entorno de desarrollo.
 */
export const environment = {
  production: false,
  tmdb: {
    // ¡IMPORTANTE! Reemplaza esto con tu API Key V3 de TMDB
    apiKey: 'e0c4a294af13c4c89e047cff149436b8', 
    apiUrl: 'https://api.themoviedb.org/3',
    
    /**
     * URL a la que TMDB te redirigirá después del login.
     */
    authRedirectUrl: 'http://localhost:4200/auth-callback',

    /**
     * URL base para cargar los posters de las películas.
     * Añadiremos el tamaño (ej. 'w500') y el 'poster_path'
     */
    imageBaseUrl: 'https://image.tmdb.org/t/p/'
  },

  gemini: {
    // ¡PEGAR TU CLAVE DE GEMINI AQUÍ!
    apiKey: 'AIzaSyCSMHcD0zA5uq8Ak2LyJfwR2fDoWbtWVHs' 
  }
};