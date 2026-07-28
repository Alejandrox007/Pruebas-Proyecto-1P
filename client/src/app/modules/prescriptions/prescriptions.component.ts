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

  readonly dosages: string[] = [
    '500 mg', '500mg', '250 mg', '100 mg', '50 mg', '1 g', '1 tableta', '2 tabletas', '1 cápsula', '5 ml', '10 ml'
  ];
  readonly frequencies: string[] = [
    'Cada 8 horas', '8h', 'Cada 4 horas', 'Cada 6 horas', 'Cada 12 horas', 'Cada 24 horas', 'Una vez al día', 'Dos veces al día', 'Tres veces al día'
  ];
  readonly durations: string[] = [
    '3 días', '1 día', '2 días', '5 días', '7 días', '10 días', '14 días', '30 días', 'Tratamiento único'
  ];

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

  translateError(msg: string): string {
    if (!msg) return '';
    const translations: Record<string, string> = {
      'Appointment not found': 'Cita no encontrada.',
      'Only the assigned doctor can create the prescription': 'Solo el médico asignado puede crear la receta.',
      'The appointment must be completed first': 'La cita debe estar completada primero.',
      'One or more medicines do not exist': 'Uno o más medicamentos no existen.',
      'Medicines cannot be duplicated': 'Los medicamentos no pueden estar duplicados.',
      'A record with those values already exists': 'Ya existe un registro con esos valores.',
      'The record is in use or references invalid data': 'El registro está en uso o hace referencia a datos inválidos.',
      'API route not found': 'Ruta de la API no encontrada.',
      'Internal server error': 'Error interno del servidor.'
    };
    return translations[msg] || msg;
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
      error: (error) => this.toast.showToast(this.translateError(error.error?.message) || 'No se pudo registrar', 'error')
    });
  }
}
