import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Asegúrate que esté
import { TmdbService, Movie, TmdbApiResponse } from '../../services/tmdb.service';
import { AuthService } from '../../services/auth.service';
// ¡NUEVO! Importar RxJS y el Modal
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { MovieDetailModalComponent } from '../../components/movie-detail-modal/movie-detail-modal.component';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  // ¡NUEVO! Importar el componente del Modal
  imports: [CommonModule, FormsModule, MovieDetailModalComponent], 
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  public tmdbService = inject(TmdbService);
  private authService = inject(AuthService);
  private geminiService = inject(GeminiService);

  public popularMovies: Movie[] = [];
  public isLoading = true;
  public error: string | null = null;


  private accountId: string | null = null;

  // --- ¡NUEVO! Propiedades para la Búsqueda Inteligente ---
  public searchPrompt: string = ''; // Vinculado al textarea con [(ngModel)]
  public isSearching = false;      // Para el spinner de búsqueda (RNF008)
  public searchResults: Movie[] = [];
  public searchPerformed = false;  // true para mostrar resultados, false para populares
  public searchError: string | null = null;
  // ---

  // ¡NUEVO! Variable para el modal
  public selectedMovie: Movie | null = null;

  ngOnInit(): void {
    // Obtenemos el ID de la cuenta guardado
    this.accountId = this.authService.getAccountId();
    this.loadMovies();
  }

  loadMovies(): void {
    this.isLoading = true;
    this.error = null;
    
    if (!this.accountId) {
      // Si por alguna razón no hay accountId, solo cargamos populares
      this.tmdbService.getPopularMovies().subscribe(this.handlePopularResponse);
      return;
    }

    // Usamos forkJoin para cargar populares y favoritos en paralelo
    forkJoin({
      popular: this.tmdbService.getPopularMovies(),
      favorites: this.tmdbService.getFavoriteMovies(this.accountId)
    }).pipe(
      // Mapeamos la respuesta para combinar los datos
      map(({ popular, favorites }) => {
        const favoriteIds = new Set(favorites.results.map(m => m.id));
        
        return popular.results.map(movie => ({
          ...movie,
          // Marcamos si la película es favorita
          isFavorite: favoriteIds.has(movie.id) 
        }));
      })
    ).subscribe({
      next: (moviesWithFavs) => {
        this.popularMovies = moviesWithFavs;
        this.isLoading = false;
      },
      error: (err) => {
        // Si forkJoin falla (ej. error en favoritos), cargamos solo populares
        console.error('Error cargando favoritos, cargando solo populares:', err);
        this.tmdbService.getPopularMovies().subscribe(this.handlePopularResponse);
      }
    });
  }
  
  /**
   * ¡NUEVO! Inicia la búsqueda inteligente (CU-03)
   */
  onSearchSubmit(): void {
    
    if (!this.searchPrompt.trim()) return;

    this.isSearching = true; // Mostrar spinner de búsqueda (RNF008)
    this.searchPerformed = true; // Cambiamos a la vista de resultados
    this.searchError = null;
    this.searchResults = []; // Limpiamos resultados anteriores

    // Flujo CU-03: Gemini (RF003) -> TMDB (RF004)
    this.geminiService.getSmartSearchFilters(this.searchPrompt).pipe(
      // 1. Obtener filtros de Gemini
      catchError(err => {
        console.error('Error en Gemini Service:', err);
        // Flujo Alternativo A1
        throw new Error('La IA no pudo procesar tu solicitud. Intenta ser más específico.');
      }),
      switchMap(filters => this.tmdbService.discoverMovies(filters)), // Llamada a TMDB
      switchMap(tmdbResponse => this.fetchAndMergeFavorites(of(tmdbResponse))) // Marcar favoritos
    ).subscribe({
      next: (movies) => {
        this.searchResults = movies;
        if (movies.length === 0) {
          // Flujo Alternativo A2
          this.searchError = 'No se encontraron películas con esos criterios. ¡Intenta otra búsqueda!';
        }
        this.isSearching = false;
      },
      error: (err) => {
        console.error('Error en el flujo de búsqueda:', err);
        this.searchError = err.message || 'Ocurrió un error al buscar.';
        this.isSearching = false;
      }
    });
  }

  /**
   * ¡NUEVO! Lógica refactorizada para marcar favoritos
   * Toma un observable de películas y le añade el flag 'isFavorite'
   */
  private fetchAndMergeFavorites(movies$: Observable<TmdbApiResponse>): Observable<Movie[]> {
    if (!this.accountId) {
      // Si no está logueado, solo devuelve las películas
      return movies$.pipe(map(response => response.results));
    }

    // Carga favoritos y las películas en paralelo
    return forkJoin({
      moviesResponse: movies$,
      favoritesResponse: this.tmdbService.getFavoriteMovies(this.accountId)
    }).pipe(
      map(({ moviesResponse, favoritesResponse }) => {
        const favoriteIds = new Set(favoritesResponse.results.map(m => m.id));
        return moviesResponse.results.map(movie => ({
          ...movie,
          isFavorite: favoriteIds.has(movie.id)
        }));
      }),
      // Si falla favoritos, al menos muestra las películas
      catchError(err => {
        console.warn('No se pudieron cargar favoritos, mostrando resultados sin marcar.', err);
        return movies$.pipe(map(response => response.results));
      })
    );
  }

  // Helper para manejar la respuesta de solo populares
  private handlePopularResponse = {
    next: (response: TmdbApiResponse) => {
      this.popularMovies = response.results;
      this.isLoading = false;
    },
    error: (err: any) => {
      console.error('Error al cargar películas populares:', err);
      this.error = 'No se pudieron cargar las películas.';
      this.isLoading = false;
    }
  };

  

  /**
   * ¡NUEVO! Añade o quita de favoritos (RF005)
   */
  toggleFavorite(movie: Movie, event: MouseEvent): void {
    event.stopPropagation(); // ¡Importante! Evita que se abra el modal

    if (!this.accountId) {
      console.error('No se encontró Account ID para marcar favorito');
      return;
    }

    const newFavoriteState = !movie.isFavorite; 

    // Actualización optimista: cambiamos la UI al instante
    movie.isFavorite = newFavoriteState;

    // Llamada a la API
    this.tmdbService.setFavorite(this.accountId, movie.id, newFavoriteState)
      .subscribe({
        next: () => {
          // Éxito: la UI ya está actualizada
        },
        error: (err) => {
          // Error: Revertimos el cambio en la UI
          movie.isFavorite = !newFavoriteState;
          console.error('Error al actualizar favorito:', err);
          alert('No se pudo actualizar favoritos. Inténtalo de nuevo.');
        }
      });
  }

  // --- Métodos del Modal ---

  /**
   * ¡NUEVO! Abre el modal con la película seleccionada
   */
  openMovieDetails(movie: Movie): void {
    this.selectedMovie = movie;
  }

  /**
   * ¡NUEVO! Cierra el modal
   */
  closeModal(): void {
    this.selectedMovie = null;
  }
  public onLogout(): void {
  this.authService.logout();
}
}