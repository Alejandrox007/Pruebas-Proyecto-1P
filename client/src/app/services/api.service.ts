import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface Doctor {
  id?: number;
  name: string;
  lastName: string;
  specialty: string;
  phone: string;
  email: string;
  licenseNumber: string;
}

export interface Patient {
  id?: number;
  name: string;
  lastName: string;
  email: string;
  gender: string;
  illness: string;
}

export interface Medicine {
  id?: number;
  name: string;
  description: string;
}

export interface Specialty {
  id?: number;
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = '/api';
  private serverStatusSubject = new BehaviorSubject<boolean | null>(null);
  
  public serverStatus$ = this.serverStatusSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkServerStatus();
    setInterval(() => this.checkServerStatus(), 15000);
  }

  // Server Status
  checkServerStatus(): void {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    this.http.get(`${this.apiUrl}/doctores`, { 
      responseType: 'json'
    }).pipe(
      tap(() => {
        this.serverStatusSubject.next(true);
        clearTimeout(timeoutId);
      }),
      catchError(() => {
        this.serverStatusSubject.next(false);
        clearTimeout(timeoutId);
        return of(null);
      })
    ).subscribe();
  }

  // DOCTORS
  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.apiUrl}/doctores`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  createDoctor(doctor: Doctor): Observable<Doctor> {
    return this.http.post<Doctor>(`${this.apiUrl}/doctores`, doctor).pipe(
      tap(() => this.handleSuccess('Doctor creado exitosamente')),
      catchError(error => this.handleError(error))
    );
  }

  updateDoctor(id: number, doctor: Doctor): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.apiUrl}/doctores/${id}`, doctor).pipe(
      tap(() => this.handleSuccess('Doctor actualizado exitosamente')),
      catchError(error => this.handleError(error))
    );
  }

  deleteDoctor(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/doctores/${id}`).pipe(
      tap(() => this.handleSuccess('Doctor eliminado exitosamente')),
      catchError(error => this.handleError(error))
    );
  }

  // PATIENTS
  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/pacientes`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  createPatient(patient: Patient): Observable<Patient> {
    return this.http.post<Patient>(`${this.apiUrl}/pacientes`, patient).pipe(
      tap(() => this.handleSuccess('Paciente creado exitosamente')),
      catchError(error => this.handleError(error))
    );
  }

  updatePatient(id: number, patient: Patient): Observable<Patient> {
    return this.http.put<Patient>(`${this.apiUrl}/pacientes/${id}`, patient).pipe(
      tap(() => this.handleSuccess('Paciente actualizado exitosamente')),
      catchError(error => this.handleError(error))
    );
  }

  deletePatient(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/pacientes/${id}`).pipe(
      tap(() => this.handleSuccess('Paciente eliminado exitosamente')),
      catchError(error => this.handleError(error))
    );
  }

  // MEDICINES
  getMedicines(): Observable<Medicine[]> {
    return this.http.get<Medicine[]>(`${this.apiUrl}/medicamentos`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  createMedicine(medicine: Medicine): Observable<Medicine> {
    return this.http.post<Medicine>(`${this.apiUrl}/medicamentos`, medicine).pipe(
      tap(() => this.handleSuccess('Medicamento creado exitosamente')),
      catchError(error => this.handleError(error))
    );
  }

  updateMedicine(id: number, medicine: Medicine): Observable<Medicine> {
    return this.http.put<Medicine>(`${this.apiUrl}/medicamentos/${id}`, medicine).pipe(
      tap(() => this.handleSuccess('Medicamento actualizado exitosamente')),
      catchError(error => this.handleError(error))
    );
  }

  deleteMedicine(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/medicamentos/${id}`).pipe(
      tap(() => this.handleSuccess('Medicamento eliminado exitosamente')),
      catchError(error => this.handleError(error))
    );
  }

  // SPECIALTIES
  getSpecialties(): Observable<Specialty[]> {
    return this.http.get<Specialty[]>(`${this.apiUrl}/especialidades`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  createSpecialty(specialty: Specialty): Observable<Specialty> {
    return this.http.post<Specialty>(`${this.apiUrl}/especialidades`, specialty).pipe(
      tap(() => this.handleSuccess('Especialidad creada exitosamente')),
      catchError(error => this.handleError(error))
    );
  }

  updateSpecialty(id: number, specialty: Specialty): Observable<Specialty> {
    return this.http.put<Specialty>(`${this.apiUrl}/especialidades/${id}`, specialty).pipe(
      tap(() => this.handleSuccess('Especialidad actualizada exitosamente')),
      catchError(error => this.handleError(error))
    );
  }

  deleteSpecialty(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/especialidades/${id}`).pipe(
      tap(() => this.handleSuccess('Especialidad eliminada exitosamente')),
      catchError(error => this.handleError(error))
    );
  }

  private handleSuccess(message: string): void {
    console.log(message);
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }
}
