import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService, Doctor } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './doctors.component.html',
  styleUrls: ['./doctors.component.scss']
})
export class DoctorsComponent implements OnInit {
  doctors: Doctor[] = [];
  form!: FormGroup;
  loading = false;
  editingId: number | null = null;

  constructor(
    private apiService: ApiService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadDoctors();
  }

  initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      specialty: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      licenseNumber: ['', Validators.required]
    });
  }

  loadDoctors(): void {
    this.loading = true;
    this.apiService.getDoctors().subscribe({
      next: (doctors) => {
        if (Array.isArray(doctors)) {
          this.doctors = doctors;
        }
        this.loading = false;
      },
      error: (error) => {
        this.toastService.showToast('Error al cargar doctores', 'error');
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (!this.form.valid) {
      this.toastService.showToast('Por favor completa todos los campos', 'error');
      return;
    }

    const doctor = this.form.value;

    if (this.editingId) {
      this.apiService.updateDoctor(this.editingId, doctor).subscribe({
        next: () => {
          this.toastService.showToast('Doctor actualizado exitosamente', 'success');
          this.clearForm();
          this.loadDoctors();
        },
        error: (error) => {
          this.toastService.showToast('Error al actualizar doctor', 'error');
        }
      });
    } else {
      this.apiService.createDoctor(doctor).subscribe({
        next: () => {
          this.toastService.showToast('Doctor creado exitosamente', 'success');
          this.clearForm();
          this.loadDoctors();
        },
        error: (error) => {
          this.toastService.showToast('Error al crear doctor', 'error');
        }
      });
    }
  }

  editDoctor(doctor: Doctor): void {
    this.editingId = doctor.id || null;
    this.form.patchValue({
      name: doctor.name,
      lastName: doctor.lastName,
      specialty: doctor.specialty,
      phone: doctor.phone,
      email: doctor.email,
      licenseNumber: doctor.licenseNumber
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteDoctor(id: number | undefined): void {
    if (!id) return;
    if (!confirm('¿Estás seguro de eliminar este doctor?')) return;

    this.apiService.deleteDoctor(id).subscribe({
      next: () => {
        this.toastService.showToast('Doctor eliminado exitosamente', 'success');
        this.loadDoctors();
      },
      error: (error) => {
        this.toastService.showToast('Error al eliminar doctor', 'error');
      }
    });
  }

  clearForm(): void {
    this.form.reset();
    this.editingId = null;
  }
}
