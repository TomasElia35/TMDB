import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  // 1. Template actualizado con el Spinner
  template: `
    <div class="callback-container">
      
      <div class="spinner" *ngIf="!error"></div>
      
      <p *ngIf="!error">
        Procesando autenticación, por favor espera...
      </p>

      <div *ngIf="error" class="error-message">
        <p><strong>Error:</strong> {{ error }}</p>
        <p>Serás redirigido al inicio.</p>
      </div>
    </div>
  `,
  // 2. Estilos del componente, incluyendo el Spinner
  styles: [
    `
      .callback-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-md);
      }

      .error-message {
        color: var(--color-error);
      }
      .error-message p {
        color: var(--color-error);
      }

      /* RNF008: Animación de Carga (Spinner) */
      .spinner {
        width: 50px;
        height: 50px;
        border: 5px solid var(--color-surface); /* Anillo grisáceo */
        border-top-color: var(--color-primary); /* Color del "loader" */
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `
  ]
})
export class AuthCallbackComponent implements OnInit {
  // ... (El resto de tu lógica de TS no cambia) ...
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  error: string | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const requestToken = params['request_token'];
      const approved = params['approved'] === 'true';

      if (approved && requestToken) {
        this.authService.handleAuthCallback(requestToken).subscribe({
          error: (err) => {
            this.error = 'No se pudo crear la sesión.';
            console.error(err);
            setTimeout(() => this.router.navigate(['/']), 3000);
          }
        });
      } else {
        this.error = 'Autenticación denegada por el usuario.';
        setTimeout(() => this.router.navigate(['/']), 3000);
      }
    });
  }
}