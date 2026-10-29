import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { destinoSeguro } from './destino';

const sesion = {
  token: 'token-de-prueba',
  usuario: { id: 1, nombre: 'Ana Gómez', email: 'ana@ejemplo.test', rol: 'cliente' as const },
};

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('guarda la sesión al iniciar sesión y la borra al salir', () => {
    auth.iniciarSesion({ email: 'ana@ejemplo.test', password: 'clave-segura' }).subscribe();
    http.expectOne('/api/auth/login').flush(sesion);

    expect(auth.conectado()).toBe(true);
    expect(auth.usuario()?.nombre).toBe('Ana Gómez');
    expect(JSON.parse(localStorage.getItem('all-style:sesion')!).token).toBe('token-de-prueba');

    auth.cerrarSesion();
    expect(auth.conectado()).toBe(false);
    expect(localStorage.getItem('all-style:sesion')).toBeNull();
  });

  it('añade el token solo a las llamadas a nuestra API', () => {
    auth.iniciarSesion({ email: 'ana@ejemplo.test', password: 'clave-segura' }).subscribe();
    http.expectOne('/api/auth/login').flush(sesion);

    const cliente = TestBed.inject(HttpClient);
    cliente.get('/api/productos').subscribe();
    cliente.get('https://otro-sitio.test/datos').subscribe();

    expect(http.expectOne('/api/productos').request.headers.get('Authorization')).toBe(
      'Bearer token-de-prueba',
    );
    expect(http.expectOne('https://otro-sitio.test/datos').request.headers.has('Authorization')).toBe(
      false,
    );
  });
});

describe('AuthService con sesión guardada', () => {
  it('cierra la sesión si el servidor dice que ya no es válida', () => {
    localStorage.setItem('all-style:sesion', JSON.stringify(sesion));
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const auth = TestBed.inject(AuthService);
    expect(auth.conectado()).toBe(true);

    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/yo')
      .flush({ error: 'caducada' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.conectado()).toBe(false);
  });
});

describe('destinoSeguro', () => {
  it('solo permite volver a rutas de la tienda', () => {
    expect(destinoSeguro('/carrito')).toBe('/carrito');
    expect(destinoSeguro('https://malicioso.test')).toBe('/');
    expect(destinoSeguro('//malicioso.test')).toBe('/');
    expect(destinoSeguro(undefined)).toBe('/');
  });
});
