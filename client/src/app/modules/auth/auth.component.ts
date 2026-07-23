import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
  mode: 'login' | 'register' = 'login';
  loading = false;
  error = '';

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  readonly registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ '-]+$/)]],
    lastName: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ '-]+$/)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{7,15}$/)]],
    gender: ['Masculino', Validators.required],
    birthDate: [''],
    password: ['', [
      Validators.required,
      Validators.minLength(10),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
    ]]
  });

  constructor(private readonly fb: FormBuilder, private readonly auth: AuthService) {}

  submitLogin(): void {
    if (this.loginForm.invalid) return this.showValidationError();
    this.loading = true;
    this.error = '';
    const { email, password } = this.loginForm.getRawValue();
    this.auth.login(email!, password!).subscribe({
      next: () => { this.loading = false; },
      error: (error) => this.handleError(error)
    });
  }

  submitRegister(): void {
    if (this.registerForm.invalid) return this.showValidationError();
    this.loading = true;
    this.error = '';
    const data = this.registerForm.getRawValue();
    this.auth.register({
      name: data.name!,
      lastName: data.lastName!,
      email: data.email!,
      phone: data.phone!,
      gender: data.gender!,
      password: data.password!,
      ...(data.birthDate ? { birthDate: data.birthDate } : {})
    }).subscribe({
      next: () => { this.loading = false; },
      error: (error) => this.handleError(error)
    });
  }

  switchMode(mode: 'login' | 'register'): void {
    this.mode = mode;
    this.error = '';
  }

  private showValidationError(): void {
    this.error = 'Revisa los campos marcados y vuelve a intentarlo.';
  }

  private handleError(error: any): void {
    this.loading = false;
    this.error = error.error?.message || 'No fue posible completar la solicitud.';
  }
}
