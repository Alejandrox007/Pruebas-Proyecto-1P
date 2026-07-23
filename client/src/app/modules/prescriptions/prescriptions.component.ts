import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, Appointment, Medicine, Prescription } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-prescriptions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './prescriptions.component.html'
})
export class PrescriptionsComponent implements OnInit {
  prescriptions: Prescription[] = [];
  appointments: Appointment[] = [];
  medicines: Medicine[] = [];
  readonly role = this.auth.user!.role;
  readonly form = this.fb.group({
    appointmentId: [null as number | null, Validators.required],
    diagnosis: ['', Validators.required],
    instructions: ['', Validators.required],
    medicineId: [null as number | null, Validators.required],
    dosage: ['', Validators.required],
    frequency: ['', Validators.required],
    duration: ['', Validators.required]
  });

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly fb: FormBuilder,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
    if (this.role === 'doctor') {
      this.api.getAppointments().subscribe((items) => this.appointments = items.filter((item) => item.status === 'completed'));
      this.api.getMedicines().subscribe((items) => this.medicines = items);
    }
  }

  load(): void {
    this.api.getPrescriptions().subscribe({
      next: (items) => this.prescriptions = items,
      error: () => this.toast.showToast('No se pudieron cargar las recetas', 'error')
    });
  }

  create(): void {
    if (this.form.invalid) {
      this.toast.showToast('Completa todos los campos de la receta', 'error');
      return;
    }
    const value = this.form.getRawValue();
    this.api.createPrescription({
      appointmentId: Number(value.appointmentId),
      diagnosis: value.diagnosis!,
      instructions: value.instructions!,
      medications: [{
        medicineId: Number(value.medicineId),
        dosage: value.dosage!,
        frequency: value.frequency!,
        duration: value.duration!
      }]
    }).subscribe({
      next: () => {
        this.toast.showToast('Receta registrada');
        this.form.reset();
        this.load();
      },
      error: (error) => this.toast.showToast(error.error?.message || 'No se pudo registrar', 'error')
    });
  }
}
