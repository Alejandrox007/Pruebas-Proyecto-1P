import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Role } from './api.service';

export interface User {
  id: number;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Registration {
  name: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  gender: string;
  birthDate?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'hospital.session';
  private readonly userSubject = new BehaviorSubject<User | null>(this.readUser());
  readonly user$ = this.userSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  get user(): User | null {
    return this.userSubject.value;
  }

  get token(): string | null {
    return this.readSession()?.token || null;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password })
      .pipe(tap((session) => this.saveSession(session)));
  }

  register(data: Registration): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', data)
      .pipe(tap((session) => this.saveSession(session)));
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.userSubject.next(null);
  }

  private saveSession(session: AuthResponse): void {
    localStorage.setItem(this.storageKey, JSON.stringify(session));
    this.userSubject.next(session.user);
  }

  private readSession(): AuthResponse | null {
    try {
      const value = localStorage.getItem(this.storageKey);
      return value ? JSON.parse(value) : null;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  private readUser(): User | null {
    return this.readSession()?.user || null;
  }
}
