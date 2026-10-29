import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Entrar } from './entrar';

describe('Entrar', () => {
  async function enviarConRespuesta(cuerpo: object, status: number) {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Entrar],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(Entrar);
    const el = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();

    const escribir = (selector: string, valor: string) => {
      const input = el.querySelector<HTMLInputElement>(selector)!;
      input.value = valor;
      input.dispatchEvent(new Event('input'));
    };
    escribir('input[type="email"]', 'nueva@ejemplo.test');
    escribir('#password', 'una-clave');
    el.querySelector('form')!.dispatchEvent(new Event('submit'));

    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/login')
      .flush(cuerpo, { status, statusText: 'Error' });
    await fixture.whenStable();
    return el;
  }

  it('ofrece crear una cuenta con el correo escrito si no está registrado', async () => {
    const el = await enviarConRespuesta(
      { error: 'Este correo no se encuentra registrado', codigo: 'CORREO_NO_REGISTRADO' },
      404,
    );

    const aviso = el.querySelector('.sin-cuenta');
    expect(aviso?.textContent).toContain('Este correo no se encuentra registrado, ¿quieres crear una cuenta?');
    // El correo no debe ir en la URL
    expect(aviso?.querySelector('a')?.getAttribute('href')).toBe('/registro');
  });

  it('muestra el error de contraseña sin ofrecer el registro', async () => {
    const el = await enviarConRespuesta({ error: 'La contraseña no es correcta' }, 401);

    expect(el.querySelector('.sin-cuenta')).toBeNull();
    expect(el.querySelector('.error-envio')?.textContent).toContain('La contraseña no es correcta');
  });
});
