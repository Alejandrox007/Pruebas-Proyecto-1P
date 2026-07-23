import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { AuthComponent } from './auth.component';

describe('AuthComponent', () => {
  let auth: any;
  let component: AuthComponent;

  beforeEach(() => {
    auth = { login: vi.fn().mockReturnValue(of({})), register: vi.fn().mockReturnValue(of({})) };
    component = new AuthComponent(new FormBuilder(), auth);
  });

  it('validates and submits login', () => {
    component.submitLogin();
    expect(component.error).toContain('Revisa');
    component.loginForm.setValue({ email: 'admin@test.com', password: 'Secret1!xxx' });
    component.submitLogin();
    expect(auth.login).toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });

  it('validates and submits registration with and without birth date', () => {
    component.switchMode('register');
    component.submitRegister();
    expect(component.error).toBeTruthy();
    component.registerForm.setValue({
      name: 'Ana', lastName: 'Pérez', email: 'ana@test.com', phone: '+593999999999',
      gender: 'Femenino', birthDate: '', password: 'SecretPass1!'
    });
    component.submitRegister();
    expect(auth.register).toHaveBeenCalled();
    component.registerForm.patchValue({ birthDate: '2000-01-01' });
    component.submitRegister();
    expect(auth.register).toHaveBeenCalledTimes(2);
  });

  it('shows server errors and fallback errors', () => {
    component.loginForm.setValue({ email: 'admin@test.com', password: 'Secret1!xxx' });
    auth.login.mockReturnValue(throwError(() => ({ error: { message: 'Invalid' } })));
    component.submitLogin();
    expect(component.error).toBe('Invalid');
    auth.register.mockReturnValue(throwError(() => ({})));
    component.registerForm.setValue({
      name: 'Ana', lastName: 'Pérez', email: 'ana@test.com', phone: '+593999999999',
      gender: 'Femenino', birthDate: '', password: 'SecretPass1!'
    });
    component.submitRegister();
    expect(component.error).toContain('No fue posible');
  });
});
