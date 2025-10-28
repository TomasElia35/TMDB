import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'; // ¡Importar RouterLink!
import { CommonModule } from '@angular/common'; // ¡Importar CommonModule!
import { AuthService } from './services/auth.service'; // ¡Importar AuthService!

@Component({
  selector: 'app-root',
  standalone: true,
  // ¡ACTUALIZAR IMPORTS!
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive], 
  templateUrl: './app.html',
  styleUrls: ['./app.css'] // Apuntamos a un nuevo CSS
})
export class App {
  title = 'queveohoy';

  // Hacemos públicos los services para usarlos en el template
  public authService = inject(AuthService);
  private router = inject(Router);

  /**
   * ¡NUEVO! Lógica de Logout movida aquí desde LandingPage
   */
  onLogout(): void {
    this.authService.logout();
  }
}