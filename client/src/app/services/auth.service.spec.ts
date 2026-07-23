import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('logs in, persists a session and logs out', () => {
    service.login('admin@test.com', 'Secret1!xxx').subscribe();
    http.expectOne('/api/auth/login').flush({
      token: 'jwt',
      user: { id: 1, email: 'admin@test.com', role: 'admin' }
    });
    expect(service.token).toBe('jwt');
    expect(service.user?.role).toBe('admin');
    service.logout();
    expect(service.user).toBeNull();
    expect(service.token).toBeNull();
  });

  it('registers and safely discards malformed storage', () => {
    service.register({
      name: 'Ana', lastName: 'Pérez', email: 'ana@test.com', password: 'Secret1!xxx',
      phone: '+593999999999', gender: 'Femenino'
    }).subscribe();
    http.expectOne('/api/auth/register').flush({
      token: 'client-jwt',
      user: { id: 2, email: 'ana@test.com', role: 'client' }
    });
    expect(service.token).toBe('client-jwt');
    localStorage.setItem('hospital.session', '{bad');
    expect((service as any).readSession()).toBeNull();
  });
});
