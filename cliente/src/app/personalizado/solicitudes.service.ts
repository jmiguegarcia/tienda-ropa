import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface SolicitudPersonalizado {
  nombre: string;
  // Formato internacional, por ejemplo +573001234567
  telefono: string;
  producto_id: number;
  corte: string | null;
  talla: string;
  color: string;
  cantidad: number;
  diseno: 'propio' | 'crear';
  comentario: string;
  autorizacion: boolean;
}

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private readonly http = inject(HttpClient);

  crear(solicitud: SolicitudPersonalizado): Observable<{ id: number }> {
    return this.http.post<{ id: number }>('/api/solicitudes', solicitud);
  }
}
