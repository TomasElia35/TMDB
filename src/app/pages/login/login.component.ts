import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-card">
      <h2>Bienvenido a <strong>QueVeoHoy?</strong></h2>
      <p class="subtitle">Inicia sesión con tu cuenta de TMDB</p>
      
      <div *ngIf="!authService.isLoggedIn(); else loggedIn">
        <button (click)="onLogin()">
          Iniciar Sesión con TMDB
        </button>
      </div>

      <ng-template #loggedIn>
        <div class="logged-in-message">
          <p>¡Ya iniciaste sesión!</p>
          <button (click)="onLogout()">
            Cerrar Sesión
          </button>
        </div>
      </ng-template>
    </div>
  `,
  // ¡ESTILOS MODIFICADOS!
  styles: [
    `
      /* NUEVO: :host se refiere al propio componente <app-login> 
        Le decimos que ocupe toda la pantalla y centre su contenido.
      */
      :host {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 100vh; /* Ocupa toda la altura de la vista */
        padding: var(--spacing-md);
      }

      /* Estos estilos ya los teníamos */
      .login-card {
        background-color: var(--color-surface);
        padding: var(--spacing-lg);
        border-radius: var(--border-radius);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        width: 100%;
        max-width: 420px;
        text-align: center; /* Aseguramos centrado del texto */
      }

      .subtitle {
        color: var(--color-text-muted);
        margin-bottom: var(--spacing-lg);
      }

      .logged-in-message p {
        color: var(--color-text);
        margin-bottom: var(--spacing-md);
      }
    `
  ]
})
export class LoginComponent {
  public authService = inject(AuthService);

  onLogin(): void {
    // El feedback visual se maneja con la redirección
    this.authService.startLoginFlow();
  }

  onLogout(): void {
    this.authService.logout();
  }
}