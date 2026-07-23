import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, Appointment, Doctor, Patient } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './appointments.component.html'
})
export class AppointmentsComponent implements OnInit {
  appointments: Appointment[] = [];
  doctors: Doctor[] = [];
  patients: Patient[] = [];
  readonly role = this.auth.user!.role;
  readonly form = this.fb.group({
    doctorId: [null as number | null, Validators.required],
    patientId: [null as number | null],
    scheduledAt: ['', Validators.required],
    reason: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]]
  });

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly fb: FormBuilder,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
    if (this.role !== 'doctor') this.api.getDoctors().subscribe((items) => this.doctors = items.filter((item) => item.active !== false));
    if (this.role === 'admin') this.api.getPatients().subscribe((items) => this.patients = items);
  }

  load(): void {
    this.api.getAppointments().subscribe({
      next: (items) => this.appointments = items,
      error: () => this.toast.showToast('No se pudieron cargar las citas', 'error')
    });
  }

  create(): void {
    if (this.form.invalid) {
      this.toast.showToast('Completa correctamente los datos de la cita', 'error');
      return;
    }
    const value = this.form.getRawValue();
    this.api.createAppointment({
      doctorId: Number(value.doctorId),
      ...(this.role === 'admin' ? { patientId: Number(value.patientId) } : {}),
      scheduledAt: new Date(value.scheduledAt!).toISOString(),
      reason: value.reason!
    }).subscribe({
      next: () => {
        this.toast.showToast('Cita agendada exitosamente');
        this.form.reset();
        this.load();
      },
      error: (error) => this.toast.showToast(error.error?.message || 'No se pudo agendar la cita', 'error')
    });
  }

  changeStatus(appointment: Appointment, status: string): void {
    this.api.updateAppointment(appointment.id!, status).subscribe({
      next: () => {
        this.toast.showToast('Estado actualizado');
        this.load();
      },
      error: (error) => this.toast.showToast(error.error?.message || 'No se pudo actualizar', 'error')
    });
  }
}
