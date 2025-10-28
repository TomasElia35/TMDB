import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

// --- INTERFACES (AccountDetails, etc. se mantienen igual) ---
interface AccountDetails {
  id: number;
  username: string;
}
interface RequestTokenResponse {
  success: boolean;
  request_token: string;
}
interface SessionResponse {
  success: boolean;
  session_id: string;
}


// ¡NUEVO! Exportamos las claves en el top-level
export const SESSION_STORAGE_KEY = 'tmdb_session_id';
export const ACCOUNT_ID_KEY = 'tmdb_account_id';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly apiUrl = environment.tmdb.apiUrl;
  private readonly redirectUrl = environment.tmdb.authRedirectUrl;
  
  // ¡MODIFICADO! Hacemos que el servicio use las constantes exportadas
  private readonly SESSION_STORAGE_KEY = SESSION_STORAGE_KEY;
  private readonly ACCOUNT_ID_KEY = ACCOUNT_ID_KEY;

  // ... (handleAuthCallback, startLoginFlow se mantienen igual) ...
  
  public startLoginFlow(): void {
    this.createRequestToken().subscribe({
      next: (token) => {
        // Redirigimos al usuario al portal de TMDB (CU-01.1)
        window.location.href = `https://www.themoviedb.org/authenticate/${token}?redirect_to=${this.redirectUrl}`;
      },
      error: (err) => console.error('Error al crear request token:', err)
    });
  }
  
  public handleAuthCallback(approvedToken: string): Observable<void> {
    return this.createSession(approvedToken).pipe(
      tap((sessionId) => {
        this.storeSessionId(sessionId);
      }),
      switchMap(() => this.fetchAndStoreAccountDetails()),
      map(() => {
        this.router.navigate(['/home']);
      })
    );
  }

  /**
   * ¡NUEVO! Llama a /account para obtener el ID y guardarlo.
   */
  private fetchAndStoreAccountDetails(): Observable<void> {
    // El interceptor (que ahora funciona) añadirá el session_id
    return this.http.get<AccountDetails>(`${this.apiUrl}/account`).pipe(
      map(accountDetails => {
        // Guardamos el account_id usando la constante
        sessionStorage.setItem(this.ACCOUNT_ID_KEY, accountDetails.id.toString());
      })
    );
  }

  public logout(): void {
    sessionStorage.removeItem(this.SESSION_STORAGE_KEY);
    sessionStorage.removeItem(this.ACCOUNT_ID_KEY); 
    this.router.navigate(['/login']);
  }

  // --- Métodos de Ayuda ---

  public getSessionId(): string | null {
    return sessionStorage.getItem(this.SESSION_STORAGE_KEY);
  }

  public getAccountId(): string | null {
    return sessionStorage.getItem(this.ACCOUNT_ID_KEY);
  }

  public isLoggedIn(): boolean {
    return this.getSessionId() !== null && this.getAccountId() !== null;
  }
  
  private storeSessionId(sessionId: string): void {
    sessionStorage.setItem(this.SESSION_STORAGE_KEY, sessionId);
  }
  
  // ... (createRequestToken y createSession se mantienen igual) ...
  /**
   * Paso 1: Pide un token de solicitud temporal a TMDB.
   */
  private createRequestToken(): Observable<string> {
    // Nota: El interceptor añadirá la api_key
    return this.http.get<RequestTokenResponse>(`${this.apiUrl}/authentication/token/new`).pipe(
      map(response => response.request_token)
    );
  }

  /**
   * Paso 2: Intercambia el token de solicitud (aprobado) por un token de sesión.
   */
  private createSession(requestToken: string): Observable<string> {
    // Nota: El interceptor añadirá la api_key
    const body = { request_token: requestToken };
    return this.http.post<SessionResponse>(`${this.apiUrl}/authentication/session/new`, body).pipe(
      map(response => response.session_id)
    );
  }

}