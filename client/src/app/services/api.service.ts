import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of } from 'rxjs';

export type Role = 'admin' | 'doctor' | 'client';

export interface Doctor {
  id?: number;
  name: string;
  lastName: string;
  specialtyId: number;
  specialty?: string;
  phone: string;
  email: string;
  licenseNumber: string;
  initialPassword?: string;
  active?: boolean;
}

export interface Patient {
  id?: number;
  userId?: number;
  name: string;
  lastName: string;
  email: string;
  phone?: string;
  gender: 'Masculino' | 'Femenino' | 'Otro';
  birthDate?: string | null;
  illness: string;
}

export interface Medicine {
  id?: number;
  name: string;
  description: string | null;
}

export interface Specialty {
  id?: number;
  name: string;
  description?: string | null;
}

export interface Appointment {
  id?: number;
  patientId?: number;
  doctorId: number;
  scheduledAt: string;
  reason: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  patient?: string;
  doctor?: string;
  specialty?: string;
}

export interface Prescription {
  id?: number;
  appointmentId: number;
  diagnosis: string;
  instructions: string;
  patient?: string;
  doctor?: string;
  createdAt?: string;
  medications: Array<{
    medicineId: number;
    name?: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly apiUrl = '/api';
  private readonly serverStatusSubject = new BehaviorSubject<boolean | null>(null);
  readonly serverStatus$ = this.serverStatusSubject.asObservable();

  constructor(private readonly http: HttpClient) {
    this.checkServerStatus();
  }

  checkServerStatus(): void {
    this.http.get(`${this.apiUrl}/health`).pipe(
      catchError(() => {
        this.serverStatusSubject.next(false);
        return of(null);
      })
    ).subscribe((result) => {
      if (result) this.serverStatusSubject.next(true);
    });
  }

  getDoctors = (): Observable<Doctor[]> => this.http.get<Doctor[]>(`${this.apiUrl}/doctores`);
  createDoctor = (doctor: Doctor): Observable<Doctor> => this.http.post<Doctor>(`${this.apiUrl}/doctores`, doctor);
  updateDoctor = (id: number, doctor: Partial<Doctor>): Observable<Doctor> =>
    this.http.put<Doctor>(`${this.apiUrl}/doctores/${id}`, doctor);
  deleteDoctor = (id: number): Observable<Doctor> => this.http.delete<Doctor>(`${this.apiUrl}/doctores/${id}`);

  getPatients = (): Observable<Patient[]> => this.http.get<Patient[]>(`${this.apiUrl}/pacientes`);
  updatePatient = (id: number, patient: Partial<Patient>): Observable<Patient> =>
    this.http.put<Patient>(`${this.apiUrl}/pacientes/${id}`, patient);
  deletePatient = (id: number): Observable<Patient> => this.http.delete<Patient>(`${this.apiUrl}/pacientes/${id}`);

  getMedicines = (): Observable<Medicine[]> => this.http.get<Medicine[]>(`${this.apiUrl}/medicamentos`);
  createMedicine = (medicine: Medicine): Observable<Medicine> =>
    this.http.post<Medicine>(`${this.apiUrl}/medicamentos`, medicine);
  updateMedicine = (id: number, medicine: Partial<Medicine>): Observable<Medicine> =>
    this.http.put<Medicine>(`${this.apiUrl}/medicamentos/${id}`, medicine);
  deleteMedicine = (id: number): Observable<Medicine> =>
    this.http.delete<Medicine>(`${this.apiUrl}/medicamentos/${id}`);

  getSpecialties = (): Observable<Specialty[]> => this.http.get<Specialty[]>(`${this.apiUrl}/especialidades`);
  createSpecialty = (specialty: Specialty): Observable<Specialty> =>
    this.http.post<Specialty>(`${this.apiUrl}/especialidades`, specialty);
  updateSpecialty = (id: number, specialty: Specialty): Observable<Specialty> =>
    this.http.put<Specialty>(`${this.apiUrl}/especialidades/${id}`, specialty);
  deleteSpecialty = (id: number): Observable<Specialty> =>
    this.http.delete<Specialty>(`${this.apiUrl}/especialidades/${id}`);

  getAppointments = (): Observable<Appointment[]> => this.http.get<Appointment[]>(`${this.apiUrl}/citas`);
  createAppointment = (appointment: Appointment): Observable<Appointment> =>
    this.http.post<Appointment>(`${this.apiUrl}/citas`, appointment);
  updateAppointment = (id: number, status: string, notes?: string): Observable<Appointment> =>
    this.http.patch<Appointment>(`${this.apiUrl}/citas/${id}`, { status, ...(notes ? { notes } : {}) });

  getPrescriptions = (): Observable<Prescription[]> => this.http.get<Prescription[]>(`${this.apiUrl}/recetas`);
  createPrescription = (prescription: Prescription): Observable<Prescription> =>
    this.http.post<Prescription>(`${this.apiUrl}/recetas`, prescription);

  getAdminSummary = (): Observable<Record<string, number>> =>
    this.http.get<Record<string, number>>(`${this.apiUrl}/admin/summary`);
}
