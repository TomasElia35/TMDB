import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import { GeminiFilters } from './gemini.service';

// --- Interfaces para tipar la respuesta ---

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  vote_average: number;
  isFavorite?: boolean;
}

export interface TmdbApiResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}
export interface MovieDetails extends Movie {
  genres: { id: number; name: string }[];
  runtime: number;
  tagline: string;
}

// Interface para Plataformas
export interface WatchProvider {
  logo_path: string;
  provider_name: string;
}

export interface WatchProviders {
  link: string;
  flatrate?: WatchProvider[]; // Suscripción (Netflix, Hbo)
  rent?: WatchProvider[];     // Alquiler
  buy?: WatchProvider[];      // Compra
}

export interface WatchProviderResponse {
  id: number;
  results: {
    [countryCode: string]: WatchProviders;
  };
}

export interface Genre {
  id: number;
  name: string;
}

interface GenresResponse {
  genres: Genre[];
}

@Injectable({
  providedIn: 'root'
})
export class TmdbService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.tmdb.apiUrl;
  private readonly imgBaseUrl = environment.tmdb.imageBaseUrl;

  // ¡NUEVO! Caché para la lista de géneros
  private genresCache$: Observable<Genre[]> | null = null;

  /**
   * ¡NUEVO! Obtiene la lista de géneros de TMDB (para la IA)
   * Usa shareReplay(1) para cachear el resultado y no llamarlo cada vez.
   */
getGenres(): Observable<Genre[]> {
  if (!this.genresCache$) {
    this.genresCache$ = this.http.get<GenresResponse>(`${this.apiUrl}/genre/movie/list`).pipe(
      map(response => response.genres),
      shareReplay(1) // Cachea el resultado
    );
  }
  return this.genresCache$;
}

  /**
   * ¡NUEVO! Busca películas usando los filtros de IA (RF004)
   * Llama a /discover/movie
   */
discoverMovies(filters: GeminiFilters): Observable<TmdbApiResponse> {
  const url = `${this.apiUrl}/discover/movie`;
  let params = new HttpParams()
    .set('sort_by', 'popularity.desc')
    .set('vote_count.gte', '100');

  if (filters.genreIds && filters.genreIds.length > 0) {
    params = params.set('with_genres', filters.genreIds.join(','));
  }
  if (filters.minRating > 0) {
    params = params.set('vote_average.gte', filters.minRating.toString());
  }
  // El interceptor añadirá api_key y language
  return this.http.get<TmdbApiResponse>(url, { params });
}

  /**
   * Obtiene la lista de películas populares (RF002 / CU-02)
   */
  getPopularMovies(): Observable<TmdbApiResponse> {
    // El interceptor se encarga de añadir la api_key
    return this.http.get<TmdbApiResponse>(`${this.apiUrl}/movie/popular`);
  }

  /**
   * ¡NUEVO! Obtiene la lista de películas favoritas del usuario (RF006)
   */
  getFavoriteMovies(accountId: string): Observable<TmdbApiResponse> {
    const url = `${this.apiUrl}/account/${accountId}/favorite/movies`;
    // El interceptor añade api_key, lang, session_id
    return this.http.get<TmdbApiResponse>(url);
  }

  /**
   * ¡NUEVO! Añade o quita una película de favoritos (RF005)
   */
  setFavorite(accountId: string, movieId: number, isFavorite: boolean): Observable<any> {
    const url = `${this.apiUrl}/account/${accountId}/favorite`;
    const body = {
      media_type: 'movie',
      media_id: movieId,
      favorite: isFavorite 
    };
    // El interceptor añade api_key, lang, session_id
    return this.http.post(url, body);
  }

  /**
   * ¡NUEVO! Obtiene los detalles completos de una película
   */
  getMovieDetails(id: number): Observable<MovieDetails> {
    // Interceptor añade api_key, lang
    return this.http.get<MovieDetails>(`${this.apiUrl}/movie/${id}`);
  }

  /**
   * ¡NUEVO! Obtiene dónde ver la película
   */
  getWatchProviders(id: number): Observable<WatchProviders | null> {
    // Interceptor añade api_key (no necesita lang)
    return this.http.get<WatchProviderResponse>(`${this.apiUrl}/movie/${id}/watch/providers`).pipe(
      map(response => {
        // Damos prioridad a Argentina (AR), si no, a España (ES) o USA (US)
        const results = response.results;
        if (results?.['AR']) return results['AR'];
        if (results?.['ES']) return results['ES'];
        if (results?.['US']) return results['US'];
        return null;
      })
    );
  }

  /**
   * Devuelve la URL completa del póster
   * @param posterPath El 'poster_path' que viene de la API
   * @param size El tamaño de imagen (ej. 'w200', 'w500')
   * @returns URL completa
   */
  getImageUrl(posterPath: string, size: string = 'w500'): string {
    if (!posterPath) {
      // Retorna una imagen placeholder si no hay póster
      return 'https://via.placeholder.com/500x750?text=No+Image';
    }
    return `${this.imgBaseUrl}${size}${posterPath}`;
  }
}