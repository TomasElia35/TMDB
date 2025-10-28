import { Component, EventEmitter, Input, OnChanges, Output, inject, SimpleChanges } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common'; // Importa DecimalPipe
import { TmdbService, Movie, MovieDetails, WatchProviders } from '../../services/tmdb.service';
import { Observable, forkJoin } from 'rxjs'; // Importa forkJoin

@Component({
  selector: 'app-movie-detail-modal',
  standalone: true,
  imports: [CommonModule, DecimalPipe], // Añade DecimalPipe
  templateUrl: './movie-detail-modal.component.html',
  styleUrls: ['./movie-detail-modal.component.css']
})
export class MovieDetailModalComponent implements OnChanges {
  public tmdbService = inject(TmdbService); // Público para usar en el template

  @Input() movie: Movie | null = null;
  @Output() closeModal = new EventEmitter<void>();

  // Observable para manejar los estados de carga
  public movieData$: Observable<{ details: MovieDetails, providers: WatchProviders | null }> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    // Si el input 'movie' cambia y no es nulo
    if (changes['movie'] && this.movie) {
      this.loadDetails();
    }
  }

  loadDetails(): void {
    if (!this.movie) return;

    // Usamos forkJoin para hacer ambas llamadas (detalles y plataformas) en paralelo
    this.movieData$ = forkJoin({
      details: this.tmdbService.getMovieDetails(this.movie.id),
      providers: this.tmdbService.getWatchProviders(this.movie.id)
    });
  }

  /**
   * Cierra el modal solo si se hace clic en el fondo oscuro
   */
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal.emit();
    }
  }

  // Helper para obtener la URL del logo (tamaño pequeño)
  getLogoUrl(path: string): string {
    return this.tmdbService.getImageUrl(path, 'w92');
  }

  // Devuelve los géneros como string separados por coma
  getGenresString(genres: { name: string }[] = []): string {
    return Array.isArray(genres) && genres.length > 0 ? genres.map(g => g.name).join(', ') : '';
  }
}