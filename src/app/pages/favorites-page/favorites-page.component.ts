import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TmdbService, Movie } from '../../services/tmdb.service';
import { AuthService } from '../../services/auth.service';
import { MovieDetailModalComponent } from '../../components/movie-detail-modal/movie-detail-modal.component';

@Component({
  selector: 'app-favorites-page',
  standalone: true,
  imports: [CommonModule, MovieDetailModalComponent],
  templateUrl: './favorites-page.component.html',
  styleUrls: ['./favorites-page.component.css']
})
export class FavoritesPageComponent implements OnInit {
  public tmdbService = inject(TmdbService);
  private authService = inject(AuthService);

  public favoriteMovies: Movie[] = [];
  public isLoading = true;
  public error: string | null = null;
  private accountId: string | null = null;
  
  public selectedMovie: Movie | null = null;

  ngOnInit(): void {
    this.accountId = this.authService.getAccountId();
    this.loadFavoriteMovies();
  }

  loadFavoriteMovies(): void {
    this.isLoading = true;
    this.error = null;

    if (!this.accountId) {
      this.error = "No se pudo verificar tu cuenta. Intenta iniciar sesión de nuevo.";
      this.isLoading = false;
      return;
    }

    this.tmdbService.getFavoriteMovies(this.accountId).subscribe({
      next: (response) => {
        // Marcamos todas como favoritas, ya que vienen de la API de favoritos
        this.favoriteMovies = response.results.map(movie => ({
          ...movie,
          isFavorite: true 
        }));
        this.isLoading = false;
        
        if (this.favoriteMovies.length === 0) {
          this.error = "Aún no has añadido ninguna película a favoritos.";
        }
      },
      error: (err) => {
        console.error('Error al cargar películas favoritas:', err);
        this.error = 'No se pudieron cargar tus películas favoritas.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Al quitar de favoritos en esta página, lo removemos de la lista.
   */
  toggleFavorite(movie: Movie, event: MouseEvent): void {
    event.stopPropagation();
    if (!this.accountId) return;

    // Aquí, el único estado posible es "quitar" (false)
    const newFavoriteState = false; 

    this.tmdbService.setFavorite(this.accountId, movie.id, newFavoriteState)
      .subscribe({
        next: () => {
          // Éxito: Quita la película de la lista de la UI
          this.favoriteMovies = this.favoriteMovies.filter(m => m.id !== movie.id);
          if (this.favoriteMovies.length === 0) {
            this.error = "Aún no has añadido ninguna película a favoritos.";
          }
        },
        error: (err) => {
          console.error('Error al actualizar favorito:', err);
          alert('No se pudo quitar de favoritos. Inténtalo de nuevo.');
        }
      });
  }

  // --- Métodos del Modal ---
  openMovieDetails(movie: Movie): void {
    this.selectedMovie = movie;
  }
  closeModal(): void {
    this.selectedMovie = null;
  }
}