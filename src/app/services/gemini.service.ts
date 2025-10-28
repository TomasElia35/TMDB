import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { TmdbService, Genre } from './tmdb.service';

/**
 * Interface para los filtros que esperamos de Gemini
 */
export interface GeminiFilters {
  genreIds: number[];
  minRating: number;
}

// --- Interfaces para la API de Gemini ---
interface GeminiApiRequest {
  contents: {
    parts: { text: string }[]
  }[];
}
interface GeminiApiResponse {
  candidates: {
    content: {
      parts: { text: string }[]
    }
  }[];
}
// ---

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private http = inject(HttpClient);
  private tmdbService = inject(TmdbService); // Inyectamos TMDB service

  private readonly geminiApiKey = environment.gemini.apiKey;
  private readonly geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;

  /**
   * Llama a la API de Gemini para obtener los filtros (RF003)
   */
  getSmartSearchFilters(userPrompt: string): Observable<GeminiFilters> {
    
    // 1. Obtener la lista de géneros de TMDB (desde la caché)
    return this.tmdbService.getGenres().pipe(
      switchMap(genres => {
        // 2. Construir el prompt
        const geminiPrompt = this.buildPrompt(userPrompt, genres);

        // 3. Construir el cuerpo de la petición
        const requestBody: GeminiApiRequest = {
          contents: [{ parts: [{ text: geminiPrompt }] }]
        };

        // 4. Llamar a la API de Gemini
        return this.http.post<GeminiApiResponse>(this.geminiApiUrl, requestBody);
      }),
      map(response => {
        // 5. Parsear la respuesta
        const jsonText = response.candidates[0].content.parts[0].text;
        return this.parseGeminiResponse(jsonText);
      })
    );
  }

  /**
   * Construye el prompt para la IA
   */
  private buildPrompt(userPrompt: string, genres: Genre[]): string {
    return `
      Tu tarea es analizar la petición de un usuario que busca una película y
      devolver SÓLO un objeto JSON con filtros para la API de TMDB.

      La petición del usuario es: "${userPrompt}"

      Basado en esa petición:
      1.  Identifica los géneros. Mapea los nombres de género (ej. "acción", "comedia")
          a sus IDs correspondientes usando esta lista:
          ${JSON.stringify(genres)}
      2.  Infiere una puntuación mínima (vote_average.gte) de 0 a 10. Si el usuario
          pide "una obra maestra" o "algo muy bueno", usa un rating alto (ej. 7.5 u 8).
          Si pide "algo para pasar el rato" o no especifica, usa un rating bajo (ej. 5 o 6).

      El formato de respuesta DEBE ser un objeto JSON con esta estructura:
      {
        "genreIds": [array de IDs de género, ej: [28, 35]],
        "minRating": [número, ej: 7.5]
      }

      Responde SÓLO con el objeto JSON.
    `;
  }

  /**
   * Limpia y parsea la respuesta JSON de Gemini
   */
  private parseGeminiResponse(text: string): GeminiFilters {
    try {
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText) as GeminiFilters;
    } catch (e) {
      console.error('Error al parsear JSON de Gemini:', e, text);
      throw new Error('La IA devolvió una respuesta inválida.');
    }
  }
}