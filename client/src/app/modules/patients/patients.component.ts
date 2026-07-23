import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService, Patient } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.scss']
})
export class PatientsComponent implements OnInit {
  patients: Patient[] = [];
  form!: FormGroup;
  loading = false;
  editingId: number | null = null;
  readonly isAdmin: boolean;

  constructor(
    private apiService: ApiService,
    private toastService: ToastService,
    private fb: FormBuilder,
    auth: AuthService
  ) {
    this.isAdmin = auth.user?.role === 'admin';
    this.initForm();
  }

  ngOnInit(): void {
    this.loadPatients();
  }

  initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', Validators.pattern(/^\+?[0-9]{7,15}$/)],
      gender: ['Masculino', Validators.required],
      illness: ['', Validators.required]
    });
  }

  loadPatients(): void {
    this.loading = true;
    this.apiService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
        this.loading = false;
      },
      error: (error) => {
        this.toastService.showToast('Error al cargar pacientes', 'error');
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (!this.form.valid) {
      this.toastService.showToast('Por favor completa todos los campos', 'error');
      return;
    }

    const patient = this.form.value;

    if (this.editingId) {
      this.apiService.updatePatient(this.editingId, patient).subscribe({
        next: () => {
          this.toastService.showToast('Paciente actualizado exitosamente', 'success');
          this.clearForm();
          this.loadPatients();
        },
        error: (error) => {
          this.toastService.showToast('Error al actualizar paciente', 'error');
        }
      });
    } else {
      this.toastService.showToast('Selecciona un paciente para editarlo', 'error');
    }
  }

  editPatient(patient: Patient): void {
    this.editingId = patient.id || null;
    this.form.patchValue({
      name: patient.name,
      lastName: patient.lastName,
      phone: patient.phone,
      gender: patient.gender,
      illness: patient.illness
    });
  }

  deletePatient(id: number | undefined): void {
    if (!id) return;
    if (!confirm('¿Estás seguro de eliminar este paciente?')) return;

    this.apiService.deletePatient(id).subscribe({
      next: () => {
        this.toastService.showToast('Paciente eliminado exitosamente', 'success');
        this.loadPatients();
      },
      error: (error) => {
        this.toastService.showToast('Error al eliminar paciente', 'error');
      }
    });
  }

  clearForm(): void {
    this.form.reset({ gender: 'Masculino' });
    this.editingId = null;
  }
}
